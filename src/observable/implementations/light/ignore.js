import {
  isObject, isFunction,
  hasOwnProperty,
  HINT_OBSERVE, defineHint,
  MESSAGE_NOT_OBJECT, throwError
} from './utils.js';

export function ignore(object) {
  if (!isObject(object) && !isFunction(object)) {
    throwError(MESSAGE_NOT_OBJECT);
  }

  if (!hasOwnProperty(object, HINT_OBSERVE)) {
    defineHint(object, HINT_OBSERVE);
  }

  return object;
}

export default { ignore };
