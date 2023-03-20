import { isPromise } from './utils.js';
import { nanoid } from 'nanoid/non-secure';

const NOT_FOUND = -1;

export class Subscription {
  constructor () {
    this.subscriptions = new Map();
  }

  on (name, callback) {
    let eventSubscriptions = this.subscriptions.get(name);
    const event = { callback, id: nanoid(), name };

    if (!eventSubscriptions) {
      eventSubscriptions = [];
      this.subscriptions.set(name, eventSubscriptions);
    }

    eventSubscriptions.push(event);
    return event.id;
  }

  off (name, eventId) {
    const eventSubscriptions = this.subscriptions.get(name);

    if (!eventSubscriptions) {
      return false;
    }

    const eventIndex = eventSubscriptions.findIndex(subscription => subscription.id === eventId);

    if (eventIndex === NOT_FOUND) {
      return false;
    }

    eventSubscriptions.splice(eventIndex, 1);
    return true;
  }

  emit (name, params, delay = 0) {
    const eventSubscriptions = this.subscriptions.get(name);

    if (!eventSubscriptions) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const promises = [];

        for (const eventSubscription of eventSubscriptions) {
          const callback = eventSubscription.callback;
          const returned = callback(params);

          if (returned && isPromise(returned)) {
            promises.push(returned);
          }
        }

        Promise.all(promises).then((results) => {
          resolve(results);
        }).catch((error) => {
          reject(error);
        });
      }, delay);
    });
  }
}

export default { Subscription };
