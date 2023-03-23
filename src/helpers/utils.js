const BIND_IGNORED = [
  'String',
  'Number',
  'Object',
  'Array',
  'Boolean',
  'Date'
];

export function isObject (object) {
  return object && typeof object === 'object';
}

export function isPromise (object) {
  return object && Promise.resolve(object) === object;
}

export function isFunction(value) {
  return typeof value === 'function';
}

export function hasOwnProperty(object, key) {
  return key !== '__proto__' && Object.hasOwnProperty.call(object, key);
}

export function setHiddenKey (object, key, value) {
  Object.defineProperty(object, key, {
    configurable: true,
    enumerable: false,
    value
  });
}

export function defineBubblingProperties (object, key, parent) {
  setHiddenKey(object, '__key__', key);
  setHiddenKey(object, '__parent__', parent);
}

export function getInstanceMethodKeys(object) {
  return (
    Object
      .getOwnPropertyNames(object)
      .concat(
        Object.getPrototypeOf(object) &&
        BIND_IGNORED.includes(Object.getPrototypeOf(object).constructor.name) ?
          Object.getOwnPropertyNames(Object.getPrototypeOf(object)) :
          []
      )
      .filter((prop) => {
        return prop !== 'constructor' && typeof object[prop] === 'function';
      })
  );
}

export function throwError(message, generic) {
  throw new (generic ? Error : TypeError)(message);
}
