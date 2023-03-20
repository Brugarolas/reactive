const ArrayIteratorProto = (new Array())[Symbol.iterator]().__proto__

function arrayHandler(handler = {}) {
  return {
    ...handler,
    get: (target, prop, receiver) => {
      const value = handler.get ? handler.get(target, prop, receiver) : Reflect.get(target, prop, receiver)
      if (typeof value === 'function' && (
        Reflect.get(Array.prototype, value.name) === value ||
        Reflect.get(ArrayIteratorProto, value.name) === value)
        ) {
        return value.bind(target)
      }
      return value
    }
  }
}

exports.arrayHandler = arrayHandler;
