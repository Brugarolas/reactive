;import Global from '../src/global.js';
import { expect } from 'chai'

const { observe, computed, dispose } = Global
const delay = time => new Promise(resolve => setTimeout(resolve, time))

describe('Global', () => {
  it('Simple computation', () => {
    const obj = observe({
      a: 1,
      b: 2
    });

    let result = 0;

    const sum = computed(() => {
      result = obj.a + obj.b;
    }, { autoRun: false });

    sum();

    expect(result).to.equal(3);
    obj.a = 2;
    expect(result).to.equal(4);
    obj.b = 3;
    expect(result).to.equal(5);
  });

  it('Auto-run computed function', () => {
    const obj = observe({
      a: 1, b: 2
    })

    let result = 0

    computed(() => {
      result = obj.a + obj.b
    })

    expect(result).to.equal(3)
  });

  it('Multiple getters', () => {
    const obj = observe({
      a: 1,
      b: 2,
      sum: 0
    }, { props: [ 'a', 'b' ]})

    computed(() => {
      obj.sum += obj.a
      obj.sum += obj.b
      obj.sum += obj.a + obj.b
    }, { autoRun: true })

    // 1 + 2 + 3
    expect(obj.sum).to.equal(6)

    obj.a = 2

    // 6 + 2 + 2 + 4
    expect(obj.sum).to.equal(14)
  })

  it('Nested functions', () => {
    const obj = observe({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    })

    let result = 0

    const aPlusB = () => obj.a + obj.b
    const cPlusD = () => obj.c + obj.d

    computed(() => {
      result = aPlusB() + cPlusD()
    })

    expect(result).to.equal(10)
    obj.a = 2
    expect(result).to.equal(11)
    obj.d = 5
    expect(result).to.equal(12)
  })

  it('Multiple observed objects', () => {
    const obj1 = observe({ a: 1 })
    const obj2 = observe({ a: 2 })
    const obj3 = observe({ a: 3 })

    let result = 0

    computed(() => {
      result = obj1.a + obj2.a + obj3.a
    })

    expect(result).to.equal(6)
    obj1.a = 0
    expect(result).to.equal(5)
    obj2.a = 0
    expect(result).to.equal(3)
    obj3.a = 0
    expect(result).to.equal(0)
  })

  it('Circular computed function', () => {
    const obj = observe({ a: 1, b: 1 })

    computed(() => {
      obj.a += obj.b
    })

    expect(obj.a).to.equal(2)
    obj.b = 2
    expect(obj.a).to.equal(4)
    obj.a = 3
    expect(obj.a).to.equal(5)
  })

  it('Array methods', () => {
    const arr = observe([{ val: 1 }, { val: 2 }, { val: 3 }])
    let sum = 0

    computed(() => { sum = arr.reduce((acc, { val }) => acc + val, 0) })

    expect(sum).to.equal(6)

    arr.push({ val: 4 })
    expect(sum).to.equal(10)

    arr.pop()
    expect(sum).to.equal(6)

    arr.unshift({ val: 5 }, { val: 4 })
    expect(sum).to.equal(15)

    arr.shift()
    expect(sum).to.equal(10)

    arr.splice(1, 3)
    expect(sum).to.equal(4)
  })

  it('Dispose computed functions', () => {
    const obj = observe({ a: 0 })
    let result = 0
    let result2 = 0

    const minusOne = computed(() => {
      result2 = obj.a - 1
    })
    computed(() => {
      result = obj.a + 1
    })

    obj.a = 1
    expect(result).to.equal(2)
    expect(result2).to.equal(0)

    dispose(minusOne)

    obj.a = 10
    expect(result).to.equal(11)
    expect(result2).to.equal(0)
  })

  it('Does not observe the original object', () => {
    const obj = { a: 1 }
    const obs = observe(obj)

    let plusOne = 0
    computed(() => {
      plusOne = obs.a + 1
    })

    expect(plusOne).to.equal(2)
    obj.a = 2
    expect(plusOne).to.equal(2)
    obs.a = 3
    expect(plusOne).to.equal(4)
  })

  it('Chain of computations', () => {
    const obj = observe({
      a: 0,
      b: 0,
      c: 0,
      d: 0
    })

    computed(() => { obj.b = obj.a * 2 })
    computed(() => { obj.c = obj.b * 2 })
    computed(() => { obj.d = obj.c * 2 })

    expect(obj.d).to.equal(0)
    obj.a = 5
    expect(obj.d).to.equal(40)
  })

  it('Asynchronous computation', async () => {
    const obj = observe({ a: 0, b: 0 })

    const addOne = () => {
      obj.b = obj.a + 1
    }
    const delayedAddOne = computed(
      ({ computeAsync }) => delay(200).then(() => computeAsync(addOne)),
      { autoRun: false }
    )
    await delayedAddOne()

    obj.a = 2
    expect(obj.b).to.equal(1)

    await delay(250).then(() => {
      expect(obj.b).to.equal(3)
    })
  })

  it('Concurrent asynchronous computations', async () => {
    const obj = observe({ a: 0, b: 0, c: 0 })
    let result = 0

    const plus = prop => computed(async ({ computeAsync }) => {
      await delay(200)
      computeAsync(() => result += obj[prop])
    }, { autoRun: false })

    const plusA = plus('a')
    const plusB = plus('b')
    const plusC = plus('c')

    await Promise.all([ plusA(), plusB(), plusC() ])

    expect(result).to.equal(0)

    obj.a = 1
    obj.b = 2
    obj.c = 3

    await delay(250).then(() => {
      expect(result).to.equal(6)
    })
  })

  it('Observe arrays', () => {
    const arr = observe([1, 2, 3])
    let sum = 0
    computed(() => sum = arr.reduce((acc, curr) => acc + curr))
    expect(sum).to.equal(6)

    arr[0] = 2
    expect(sum).to.equal(7)

    arr.push(3);
    expect(sum).to.equal(10)
  })

  it('Usage with \'this\'', () => {
    const obj = observe({
      a: 1,
      b: 2,
      doSum: function() {
        this.sum = this.a + this.b
      }
    })

    obj.doSum = computed(obj.doSum.bind(obj))
    expect(obj.sum).to.equal(3)
    obj.a = 2
    expect(obj.sum).to.equal(4)
  })

  it('Subscription to changes works OK', async () => {
    let sum = 0

    const obj = observe({
      a: 1,
      b: 2,
      c: 3
    })

    const subscriptionId = obj.subscribeToChanges(() => {
      sum++;
    })

    expect(sum).to.equal(0)
    obj.a = 2
    obj.b = 3
    await delay(100)
    expect(sum).to.equal(2)

    obj.unsubscribeToChanges(subscriptionId);

    obj.c = 4
    await delay(100)
    expect(sum).to.equal(2)
  })
});
