let queue = null;

export const __batched__ = Symbol('__batched__');

/**
 * Will perform batched computations instantly.
 */
export function process () {
  __batch__(queue);
  queue = null;
}

export function __batch__ (taskQueue) {
  if (!taskQueue) {
    return;
  }

  for (const task of taskQueue) {
    task();
    task[__batched__] = false;
  }
}

export function enqueue (task, batch) {
  if (task[__batched__]) {
    return;
  }

  if (queue === null) {
    queue = [];
    if (batch === true) {
      queueMicrotask(process);
    } else {
      setTimeout(process, batch);
    }
  }

  queue.push(task);
}
