# Reactive
Small events publisher & subscribe pattern, and observable & reactive objects library.

## Installation
First, we need to install `reactive`:

```bash
npm install --save reactive
```

## Usage

```js
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
```

Another example:

```js
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
```

Multi-observed objects:

```js
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
```

Array methods:

```js
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
```

Dispose computed functions:

```js
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
```

Asynchronous computation:

```js
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
```

Currect asynchronous computation:

```js
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
```
