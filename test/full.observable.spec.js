import { Observable } from '../src/observable/implementations/full/observable.js';
import { expect } from 'chai'

const delay = time => new Promise(resolve => setTimeout(resolve, time))

describe('Observable.full', () => {
  it('Simple computation', () => {
    const obj = new Observable({
      a: 1,
      b: 2
    });

    let result = 0;

    const sum = obj.computed(() => {
      result = obj.a + obj.b;
    }, { autoRun: false });

    sum();

    expect(result).to.equal(3);
    obj.a = 2;
    expect(result).to.equal(4);
    obj.b = 3;
    expect(result).to.equal(5);
  });

  it('Multiple getters', () => {
    const obj = new Observable({
      a: 1,
      b: 2,
      sum: 0
    }, { props: [ 'a', 'b' ]})

    obj.computed(() => {
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
    const obj = new Observable({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    })

    let result = 0

    const aPlusB = () => obj.a + obj.b
    const cPlusD = () => obj.c + obj.d

    obj.computed(() => {
      result = aPlusB() + cPlusD()
    })

    expect(result).to.equal(10)
    obj.a = 2
    expect(result).to.equal(11)
    obj.d = 5
    expect(result).to.equal(12)
  })

  it('Multiple observed objects', () => {
    const obj1 = new Observable({ a: 1 })
    const obj2 = new Observable({ a: 2 })
    const obj3 = new Observable({ a: 3 })

    let result = 0

    obj1.computed(() => {
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
    const obj = new Observable({ a: 1, b: 1 })

    obj.computed(() => {
      obj.a += obj.b
    })

    expect(obj.a).to.equal(2)
    obj.b = 2
    expect(obj.a).to.equal(4)
    obj.a = 3
    expect(obj.a).to.equal(5)
  })

  it('Asynchronous computation', async () => {
    const obj = new Observable({ a: 0, b: 0 })

    const addOne = () => {
      obj.b = obj.a + 1
    }
    const delayedAddOne = obj.computed(
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
    const obj = new Observable({ a: 0, b: 0, c: 0 })
    let result = 0

    const plus = prop => obj.computed(async ({ computeAsync }) => {
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

  it('Usage with \'this\'', () => {
    const obj = new Observable({
      a: 1,
      b: 2,
      doSum: function() {
        this.sum = this.a + this.b
      }
    })

    obj.doSum = obj.computed(obj.doSum.bind(obj))
    expect(obj.sum).to.equal(3)
    obj.a = 2
    expect(obj.sum).to.equal(4)
  })

  it('Subscription to changes works OK', async () => {
    let sum = 0

    const obj = new Observable({
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

