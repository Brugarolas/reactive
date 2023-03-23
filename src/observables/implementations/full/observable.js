import { __batch__ } from './batcher.js';
import { computed as computedOriginal } from './computed.js';
import { dispose } from './dispose.js';
import { observe } from './observe.js';

export class Observable {
  constructor (data, options) {
    Object.assign(this, data || {});

    Object.defineProperty(this, '__computed__', {
      enumerable: false,
      value: []
    });

    this.observable = observe(this, Object.assign({ bubble: true }, options));

    return this.observable;
  }

  computed (fn, opt) {
    const computedProp = computedOriginal(fn.bind(this), opt)

    this.__computed__.push(computedProp);

    return computedProp;
  }

  dispose (func) {
    while (this.__computed__.length) {
      dispose(this.__computed__.pop());
    }
  }

  process () {
    __batch__(this.__computed__);
    this.__computed__ = null;
  }

  reduce (callbackFn, initialValue) {
    let accumulator = initialValue;

    for (let i = 0; i < this.length; i++) {
      if (accumulator !== undefined) {
        accumulator = callbackFn.call(undefined, accumulator, this[i], i, this);
      } else {
        accumulator = this[i];
      }
    }

    return accumulator;
  }
}
