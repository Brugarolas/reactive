import { __batch__ } from './batcher.js';
import { computed } from './computed.js';
import { dispose } from './dispose.js';
import { observe } from './observe.js';

export class Observable {
  constructor (data, options) {
    Object.assign(this, data || {});

    Object.defineProperty(this, '__computed__', {
      enumerable: false,
      value: []
    });

    return observe(this, Object.assign({ bubble: true }, options));
  }

  computed (fn, opt) {
    this.__computed__.push(computed(fn.bind(this), opt));
  }

  // TODO We are going to get rid of __handler__ for a subscription model
  /* onChange (fn) {
    this.__handler__ = fn;
  } */

  dispose () {
    while (this.__computed__.length) {
      dispose(this.__computed__.pop());
    }
  }

  process () {
    __batch__(this.__computed__);
    this.__computed__ = null;
  }
}
