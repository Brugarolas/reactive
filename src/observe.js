import {
  __batched__,
  enqueue
} from './batcher.js';
import { data } from './data.js';
import { Subscription } from './subscription.js';
import {
  defineBubblingProperties,
  getInstanceMethodKeys,
  isObject
} from './utils.js';

const { computedStack, trackerSymbol } = data; // TODO subscription

const observedSymbol = Symbol('__observed__');

/**
 * @typedef {Object} Options - Observe options.
 * @property {string[]} [props] - Observe only the properties listed.
 * @property {string[]} [ignore] - Ignore the properties listed.
 * @property {boolean | number} [batch] -
 *  Batch computed properties calls, wrapping them in a queueMicrotask and
 *  executing them in a new context and preventing excessive calls.
 *  If batch is an integer, the calls will be debounced by the value in milliseconds using setTimemout.
 * @prop {boolean} [deep] - Recursively observe nested objects and when setting new properties.
 * @prop {boolean} [bind] - Automatically bind methods to the observed object.
 */

/**
 * Observes an object or an array and returns a proxified version which reacts on mutations.
 *
 * @template Object
 * @param {Object} obj - The object to observe.
 * @param {Options} options - Options
 * @returns {Object} - A proxy wrapping the object.
 */
export function observe (obj, options = {}) {
  // 'deep' is slower but reasonable; 'shallow' a performance enhancement but with side-effects
  const {
    props,
    ignore,
    batch,
    deep = true,
    bubble,
    bind,
    subscription,
    isArray
  } = options;

  // Ignore if the object is already observed
  if (obj[observedSymbol]) {
    return obj;
  }

  // If the prop is explicitely not excluded
  const isWatched = (prop, value) => {
    return prop !== observedSymbol &&
    (
      !props ||
            Array.isArray(props) && props.includes(prop) ||
            typeof props === 'function' && props(prop, value)
    ) && (
      !ignore ||
            !(Array.isArray(ignore) && ignore.includes(prop)) &&
            !(typeof ignore === 'function' && ignore(prop, value))
    );
  };

  // If the deep flag is set, observe nested objects/arrays
  if (deep) {
    Object.entries(obj).forEach(([key, val]) => {
      if (isObject(val) && isWatched(key, val)) {
        obj[key] = observe(val, options);

        // If bubble is set, we add keys to the object used to bubble up the mutation
        if (bubble) {
          defineBubblingProperties(obj[key], key, obj);
        }
      }
    });
  }

  // Init onChange subscribersand array methods
  obj.__subscription__ = subscription || new Subscription();

  obj.subscribeToChanges = function (callback) {
    return obj.__subscription__.on('__changed__', callback);
  };

  obj.unsubscribeToChanges = function (id) {
    if (!obj.__subscription__) {
      return false;
    }

    return obj.__subscription__.off('__changed__', id);
  };

  // For each observed object, each property is mapped with a set of computed functions depending on this property.
  // Whenever a property is set, we re-run each one of the functions stored inside the matching Set.
  const propertiesMap = new Map();

  // Proxify the object in order to intercept get/set on props
  const proxy = new Proxy(obj, {
    get (target, prop, receiver) {
      if (prop === observedSymbol) {
        return true;
      }

      // Proxify the array
      if (Array.isArray(obj)) {
        Reflect.get(target, prop, receiver);
      }

      // If the prop is watched
      if (computedStack.length && isWatched(prop, obj[prop])) {
        // If a computed function is being run
        const computedFn = computedStack[0];

        // Tracks object and properties accessed during the function call
        const tracker = computedFn[trackerSymbol];

        if (tracker) {
          let trackerSet = tracker.get(obj);

          if (!trackerSet) {
            trackerSet = new Set();
            tracker.set(obj, trackerSet);
          }

          trackerSet.add(prop);
        }

        // Link the computed function and the property being accessed
        let propertiesSet = propertiesMap.get(prop);

        if (!propertiesSet) {
          propertiesSet = new Set();
          propertiesMap.set(prop, propertiesSet);
        }

        propertiesSet.add(computedFn);
      }

      return obj[prop];
    },

    set (target, prop, value) {
      if (!isWatched(prop, value)) {
        // If the prop is ignored
        obj[prop] = value;
      } else if (Array.isArray(obj) && prop === 'length' || obj[prop] !== value) {
        // If the new/old value are not equal
        const deeper = deep && isObject(value);

        // Remove bubbling infrastructure and pass old value to handlers
        const oldValue = obj[prop];

        if (isObject(oldValue)) {
          delete obj[prop];
        }

        // If the deep flag is set we observe the newly set value
        obj[prop] = deeper ? observe(value, options) : value;

        // Co-opt assigned object into bubbling if appropriate
        if (deeper && bubble) {
          defineBubblingProperties(obj[prop], prop, obj);
        }

        // Publish changes to subscribers
        if (obj.__subscription__) {
          obj.__subscription__.emit('__changed__', { key: prop, value });
        }

        const dependents = propertiesMap.get(prop);

        if (dependents) {
          // Retrieve the computed functions depending on the prop
          for (const dependent of dependents) {
            const tracker = dependent[trackerSymbol];
            const trackedObj = tracker && tracker.get(obj);
            const tracked = trackedObj && trackedObj.has(prop);

            // If the function has been disposed or if the prop has not been used
            // during the latest function call, delete the function reference
            if (dependent.__disposed__ || tracker && !tracked) {
              dependents.delete(dependent);
            } else if (dependent !== computedStack[0]) {
              // Run the computed function
              if (typeof batch !== 'undefined' && batch !== false) {
                enqueue(dependent, batch);
                dependent[__batched__] = true;
              } else {
                dependent();
              }
            }
          }
        }
      }

      return true;
    }
  });

  if (bind) {
    // Need this for binding es6 classes methods which are stored in the object prototype
    getInstanceMethodKeys(obj).forEach((key) => {
      obj[key] = obj[key].bind(proxy);
    });
  }

  return proxy;
}
