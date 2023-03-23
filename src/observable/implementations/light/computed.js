import {
  isFunction,
  hasOwnProperty,
  HINT_DISPOSE, HINT_DEPENDS, defineHint,
  MESSAGE_NOT_FUNCTION, throwError
} from './utils.js';

/** Maximum queue length */
const MAX_QUEUE = 2000;

/** Is the queue being executed? */
export let computedLock = false;
/** Queue of computed functions to be called */
export let computedQueue = [];
/** Current index into `computedQueue` */
export let computedI = 0;

/**
 * Throws an error indicating that the computed queue has overflowed
 */
function computedOverflow() {
  const message = "Computed queue overflow! Last 10 functions in the queue:";

  const length = computedQueue.length;
  for (const i = length - 11; i < length; i++) {
    const func = computedQueue[i];
    message += "\n" + (i + 1) + ": " + (func.name || "anonymous");
  }

  throwError(message, true);
}

/**
 * Attempts to add a function to the computed queue, then attempts to lock and execute the computed queue
 * @param func Function to queue
 */
export function computedNotify(func) {
  if (hasOwnProperty(func, HINT_DISPOSE)) return;

  // Only add to the queue if not already pending execution
  if (computedQueue.lastIndexOf(func) >= computedI) return;
  computedQueue.push(func);

  // Make sure that the function in question has a depends hint
  if (!hasOwnProperty(func, HINT_DEPENDS)) {
    defineHint(func, HINT_DEPENDS, []);
  }

  // Attempt to lock and execute the queue
  if (!computedLock) {
    computedLock = true;

    try {
      for (; computedI < computedQueue.length; computedI++) {
        // Indirectly call the function to avoid leaking `computedQueue` as `this`
        (0, computedQueue[computedI])();
        if (computedI > MAX_QUEUE) /* @__NOINLINE */ computedOverflow();
      }
    } finally {
      computedLock = false;
      computedQueue = [];
      computedI = 0;
    }
  }
}

export function computed (func) {
  if (!isFunction(func)) {
    throwError(MESSAGE_NOT_FUNCTION);
  }

  computedNotify(func);
  return func;
}

// export default { computed, computedNotify, computedLock, computedQueue, computedI };
