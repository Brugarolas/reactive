[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/brugarolas)

# Reactive
Small events publisher & subscribe pattern, and observable & reactive objects library.

## Installation
First, we need to install `reactive-blast`:

```bash
npm install --save reactive-blast
```

## Documentation

### Global

`observe()`


## Examples

### Global

You cas use the blobal API like this:

```js
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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

With `dispose` you can remove the computed function from the reactive Maps, allowing garbage collection

```js
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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

Multi-observed objects:

```js
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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

Asynchronous computation:

```js
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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
    import { Global } from 'reactive-blast';
    import { expect } from 'chai'

    const { observe, computed, dispose } = Global

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

### Observable

Instead of using Global function, you can use Observable class to create a reactive object. It's nearly identical.

```js
    import { Observable } from 'reactive-blast';
    import { expect } from 'chai'

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
```

Another example:

```js
    import { Observable } from 'reactive-blast';
    import { expect } from 'chai'

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
```

Multiple getters:

```js
    import { Observable } from 'reactive-blast';
    import { expect } from 'chai'

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
```

Multiple observed objects:

```js
    import { Observable } from 'reactive-blast';
    import { expect } from 'chai'

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
```

### Subscription

Finally

## Credits

Credits for some libraries that served as inspiration or code reference.

https://github.com/elbywan/hyperactiv
https://github.com/luavixen/Patella

https://github.com/vuejs/core/tree/main/packages/reactivity
https://github.com/nx-js/observer-util
https://github.com/salesforce/observable-membrane

https://github.com/RisingStack/react-easy-state
https://github.com/mseddon/preact-nx-observer

https://github.com/vuejs/core/tree/main/packages/reactivity
https://github.com/udamir/mosx
