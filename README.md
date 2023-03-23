[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/brugarolas)

[UNDER CONSTRCTION]

# Reactivefy
Reactivefy is a library for <a href="https://wikipedia.org/wiki/Reactive_programming">reactive programming</a> in JavaScript, inspired by [Hyperactiv](https://github.com/elbywan/hyperactiv) and [Patella](https://github.com/luavixen/Patella).

Reactivefy is a small library which observes object mutations and computes functions depending on those changes.

In other terms, whenever a property from an observed object is mutated, every `computed` function that depend on this property are called right away.

Of course, Reactivefy automatically handles these dependencies so you never have to explicitly declare anything.

It also provides an event-emitter called Subscription.

Reactivefy comes in two versions, which both share the same API: `light` and `full`.

The first one, `light`, uses JavaScript's getters and setters to make all the reactivity magic posible. This results in a better browser compatibility and some better performance, but has some tradeoffs which will be explained later. `light` is compatible with Chrome 5, Firefox 4, and Internet Explorer 9.

`full` uses `Proxy` to implement all reactivity magic, so it is compatible with all browsers which support `Proxy` natively, and don't have to deal with all tradeoffs mentioned earlier.

## Installation
First, we need to install `reactivefy`:

```bash
npm install --save reactivefy
```

To use `full` default version:

```js
    import { Global } from 'reactivefy';
    // Or
    import Global from 'reactivefy/observables/full.js';

    const { observe, computed, dispose } = Global
```

And to use `light` version:

```js
    import Global from 'reactivefy/observables/light.js';

    const { observe, computed, dispose } = Global
```

[ADD EXAMPLE WITH EVENT-EMITTER]
[ALSO ADD EXAMPLES OF INCLUDED POLYFILLS]

## Some real world examples
[MODIFY HSFiddle]
Reactivefy provides functions for observing object mutations and acting on those mutations automatically.
Possibly the best way to learn is by example, so let's take a page out of [Vue.js's guide](https://vuejs.org/guide/essentials/event-handling.html) and make a button that counts how many times it has been clicked using Reactivefy's `observe(object)` and `computed(func)`:
```html
<h1>Click Counter</h1>
<button onclick="model.clicks++"></button>
<script>
  const $button = document.getElementsByTagName("button")[0];
  const model = Global.observe({
    clicks: 0
  });
  Global.computed(() => {
    $button.innerText = model.clicks ? `I've been clicked ${model.clicks} times` : "Click me!";
  });
</script>
```
![](./examples/counter-vid.gif)<br>
View the [full source](./examples/counter.html) or [try it on JSFiddle](https://jsfiddle.net/luawtf/hL6g4emk/latest).

Notice how in the above example, the `<button>` doesn't do any extra magic to change its text when clicked; it just increments the model's click counter, which is "connected" to the button's text in the computed function.

Now let's try doing some math, here's a snippet that adds and multiplies two numbers:
```javascript
const calculator = Global.observe({
  left:    1,
  right:   1,
  sum:     0,
  product: 0
});

// Connect left, right -> sum
Global.computed(() => calculator.sum = calculator.left + calculator.right);
// Connect left, right -> product
Global.computed(() => calculator.product = calculator.left * calculator.right);

calculator.left = 2;
calculator.right = 10;
console.log(calculator.sum, calculator.product); // Output: 12 20

calcuator.left = 3;
console.log(calculator.sum, calculator.product); // Output: 13 30
```

Pretty cool, right?
Reavtivefy's main goal is to be as simple as possible; you only need two functions to build almost anything.

## Examples and snippets
Jump to one of:
  - [Concatenator](#concatenator)
  - [Debounced search](#debounced-search)
  - [Pony browser](#pony-browser)
  - [Multiple objects snippet](#multiple-objects-snippet)
  - [Linked computed functions snippet](#linked-computed-functions-snippet)

### Concatenator
```html
<h1>Concatenator</h1>
<input type="text" oninput="model.first = value" placeholder="Enter some"/>
<input type="text" oninput="model.second = value" placeholder="text!"/>
<h3 id="output"></h3>
<script>
  const $output = document.getElementById("output");
  const model = Global.observe({
    first: "",
    second: "",
    full: ""
  });
  Global.computed(() => {
    model.full = model.first + " " + model.second;
  });
  Global.computed(() => {
    $output.innerText = model.full;
  });
</script>
```
![](./examples/concatenator-vid.gif)<br>
View the [full source](./examples/concatenator.html) or [try it on JSFiddle](https://jsfiddle.net/luawtf/zvnm4jp7/latest).

### Debounced search
```html
<h1>Debounced Search</h1>
<input type="text" oninput="model.input = value" placeholder="Enter your debounced search"/>
<h3 id="search"></h3>
<script>
  const $search = document.getElementById("search");

  const model = Global.observe({
    input: "",
    search: ""
  });

  Global.computed(() => {
    search.innerText = model.search;
  });

  let timeoutID;
  Global.computed(() => {
    const input = model.input;
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      model.search = input;
    }, 1000);
  });
</script>
```
![](./examples/debounce-vid.gif)<br>
View the [full source](./examples/debounce.html) or [try it on JSFiddle](https://jsfiddle.net/luawtf/abd3qxft/latest).

### Pony browser
```html
<main id="app">
  <h1>Pony Browser</h1>
  <select></select>
  <ul></ul>
  <input type="text" placeholder="Add another pony"/>
</main>
<script>
  // Find elements
  const $app = document.getElementById("app");
  const [, $select, $list, $input] = $app.children;

  // Declare model
  const model = Global.observe({
    /* Truncated, find full source in ./examples/pony.html */
  });

  // Populate <select>
  for (const [value, { name }] of Object.entries(model.characterSets)) {
    const $option = document.createElement("option");
    $option.value = value;
    $option.innerText = name;
    $select.appendChild($option);
  }

  // Connect model.selected.key -> model.selected.current
  Global.computed(() => {
    model.selected.current = model.characterSets[model.selected.key];
  });

  // Connect model.selected.current.members -> <ul>
  Global.computed(() => {
    $list.innerHTML = "";
    for (const member of model.selected.current.members) {
      const $entry = document.createElement("li");
      $entry.innerText = member;
      $list.appendChild($entry);
    }
  });

  // Connect <select> -> model.selected.key
  $select.addEventListener("change", () => {
    model.selected.key = $select.value;
  });

  // Connect <input> -> model.selected.current.members
  $input.addEventListener("keyup", ({ key }) => {
    if (key !== "Enter") return;

    const currentSet = model.selected.current;
    currentSet.members = [
      ...currentSet.members,
      $input.value
    ];

    $input.value = "";
  });
</script>
```
![](./examples/pony-vid.gif)<br>
View the [full source](./examples/pony.html) or [try it on JSFiddle](https://jsfiddle.net/luawtf/84wmaz0g/latest).

## Multiple objects snippet
```javascript
// Setting up some reactive objects that contain some data about a US president...
// Disclaimer: I am not an American :P
const person = Global.observe({
  name: { first: "George", last: "Washington" },
  age: 288
});
const account = Global.observe({
  user: "big-george12",
  password: "IHateTheQueen!1"
});

// Declare that we will output a log message whenever person.name.first, account.user, or person.age are updated
Global.computed(() => console.log(
  `${person.name.first}'s username is ${account.user} (${person.age} years old)`
)); // Output: George's username is big-george12 (288 years old)

// Changing reactive properties will only run computed functions that depend on them
account.password = "not-telling"; // Does not output (no computed function depends on this)

// All operators work when updating properties
account.user += "3"; // Output: George's username is big-george123 (288 years old)
person.age++; // Output: George's username is big-george123 (289 years old)

// You can even replace objects entirely
// This will automatically observe this new object and will still trigger dependant computed functions
// Note: You should ideally use ignore or dispose to prevent depending on objects that get replaced, see pitfalls
person.name = {
  first: "Abraham",
  last: "Lincoln"
}; // Output: Abraham's username is big-george123 (289 years old)

person.name.first = "Thomas"; // Output: Thomas's username is big-george123 (289 years old)
```

### Linked computed functions snippet
```javascript
// Create our nums object, with some default values for properties that will be computed
const nums = Global.observe({
  a: 33, b: 23, c: 84,
  x: 0,
  sumAB: 0, sumAX: 0, sumCX: 0,
  sumAllSums: 0
});

// Declare that (x) will be equal to (a + b + c)
Global.computed(() => nums.x = nums.a + nums.b + nums.c);
// Declare that (sumAB) will be equal to (a + b)
Global.computed(() => nums.sumAB = nums.a + nums.b);
// Declare that (sumAX) will be equal to (a + x)
Global.computed(() => nums.sumAX = nums.a + nums.x);
// Declare that (sumCX) will be equal to (c + x)
Global.computed(() => nums.sumCX = nums.c + nums.x);
// Declare that (sumAllSums) will be equal to (sumAB + sumAX + sumCX)
Global.computed(() => nums.sumAllSums = nums.sumAB + nums.sumAX + nums.sumCX);

// Now lets check the (sumAllSums) value
console.log(nums.sumAllSums); // Output: 453

// Notice that when we update one value ...
nums.c += 2;
// ... all the other values update! (since we declared them as such)
console.log(nums.sumAllSums); // Output: 459
```

## More examples

### Global API

You cas use the global API like this:

```js
    import { Global } from 'reactivefy';
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
    import { Global } from 'reactivefy';
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

[ADD EXAMPLE SUBSCRIBING TO CHANGES]

With `dispose` you can remove the computed function from the reactive Maps, allowing garbage collection

```js
    import { Global } from 'reactivefy';
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
    import { Global } from 'reactivefy';
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
    import { Global } from 'reactivefy';
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
    import { Global } from 'reactivefy';
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
    import { Global } from 'reactivefy';
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
    import { Observable } from 'reactivefy';
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
    import { Observable } from 'reactivefy';
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
    import { Observable } from 'reactivefy';
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
    import { Observable } from 'reactivefy';
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




## `light` version pitfalls
`light` version uses JavaScript's [getters](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/get) [and](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) [setters](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/set) to make all the reactivity magic possible, which comes with some tradeoffs that the verssion `full` (which uses [Proxy](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) don't have to deal with.
This section details some of the stuff to look out for when using `light` version in your applications.

### Computed functions can cause infinite loops
```javascript
const object = Global.observe({ x: 10, y: 20 });

Global.computed(function one() {
  if (object.x > 20) object.y++;
});

Global.computed(function two() {
  if (object.y > 20) object.x++;
});

object.x = 25;
// Uncaught Error: Computed queue overflow! Last 10 functions in the queue:
// 1993: one
// 1994: two
// 1995: one
// 1996: two
// 1997: one
// 1998: two
// 1999: one
// 2000: two
// 2001: one
// 2002: two
// 2003: one
```

### Array mutations do not trigger dependencies
```javascript
const object = Global.observe({
  array: [1, 2, 3]
});

Global.computed(() => console.log(object.array)); // Output: 1,2,3

object.array[2] = 4; // No output, arrays are not reactive!
object.array.push(5); // Still no output, as Patella does not replace array methods

// If you want to use arrays, do it like this:
// 1. Run your operations
object.array[2] = 3;
object.array[3] = 4;
object.array.push(5);
// 2. Then set the array to itself
object.array = object.array; // Output: 1,2,3,4,5
```

### Properties added after observation are not reactive
```javascript
const object = Global.observe({ x: 10 });
object.y = 20;

Global.computed(() => console.log(object.x)); // Output: 10
Global.computed(() => console.log(object.y)); // Output: 20

object.x += 2; // Output: 12

object.y += 2; // No output, as this property was added after observation

Global.observe(object);

object.y += 2; // Still no output, as objects cannot be re-observed
```

### Prototypes will not be made reactive unless explicitly observed
```javascript
const object = { a: 20 };
const prototype = { b: 10 };
Object.setPrototypeOf(object, prototype);

Global.observe(object);

Global.computed(() => console.log(object.a)); // Output: 10
Global.computed(() => console.log(object.b)); // Output: 20

object.a = 15; // Output: 15

object.b = 30; // No output, as this isn't an actual property on the object
prototype.b = 36; // No output, as prototypes are not made reactive by observe

Global.observe(prototype);

prototype.b = 32; // Output: 32
```

### Non-enumerable and non-configurable properties will not be made reactive
```javascript
const object = { x: 1 };
Object.defineProperty(object, "y", {
  configurable: true,
  enumerable: false,
  value: 2
});
Object.defineProperty(object, "z", {
  configurable: false,
  enumerable: true,
  value: 3
});

Global.observe(object);

Global.computed(() => console.log(object.x)); // Output: 1
Global.computed(() => console.log(object.y)); // Output: 2
Global.computed(() => console.log(object.z)); // Output: 3

object.x--; // Output: 0

object.y--; // No output as this property is non-enumerable
object.z--; // No output as this property is non-configurable
```

### Enumerable and configurable but non-writable properties will be made writable
```javascript
const object = {};
Object.defineProperty(object, "val", {
  configurable: true,
  enumerable: true,
  writable: false,
  value: 10
});

object.val = 20; // Does nothing
console.log(object.val); // Output: 10

Global.observe(object);

object.val = 20; // Works because the property descriptor has been overwritten
console.log(object.val); // Output: 20
```

### Getter/setter properties will be accessed then lose their getter/setters
```javascript
const object = {
  get val() {
    console.log("Gotten!");
    return 10;
  }
};

object.val; // Output: Gotten!

Global.observe(object); // Output: Gotten!

object.val; // No output as the getter has been overwritten
```

### Properties named `__proto__` are ignored
```javascript
const object = {};
Object.defineProperty(object, '__proto__', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: 10
});

Global.observe(object);

Global.computed(() => console.log(object.__proto__)); // Output: 10

object.__proto__++; // No output as properties named __proto__ are ignored
```

## API
(ADD NETHOD'S TO SUBSCRIBE TO CHANGES).

<h4 id="observe"><code>function observe(object)</code></h4>
Description:
<ul>
  <li>
    Makes an object and its properties reactive recursively.
    Subobjects (but not subfunctions!) will also be observed.
    Note that <code>observe</code> does not create a new object, it mutates the object passed into it: <code>observe(object) === object</code>.
  </li>
</ul>
Parameters:
<ul>
  <li><code>object</code> &mdash; Object or function to make reactive</li>
</ul>
Returns:
<ul>
  <li>Input <code>object</code>, now reactive</li>
</ul>

<h4 id="ignore"><code>function ignore(object)</code></h4>
Description:
<ul>
  <li>
    Prevents an object from being made reactive, <code>observe</code> will do nothing.
    Note that <code>ignore</code> is not recursive, so subobjects can still be made reactive by calling <code>observe</code> on them directly.
  </li>
</ul>
Parameters:
<ul>
  <li><code>object</code> &mdash; Object or function to ignore</li>
</ul>
Returns:
<ul>
  <li>Input <code>object</code>, now permanently ignored</li>
</ul>

<h4 id="computed"><code>function computed(func)</code></h4>
Description:
<ul>
  <li>
    Calls <code>func</code> with no arguments and records a list of all the reactive properties it accesses.
    <code>func</code> will then be called again whenever any of the accessed properties are mutated.
    Note that if <code>func</code> has been <code>dispose</code>d with <code>!!clean === false</code>, no operation will be performed.
  </li>
</ul>
Parameters:
<ul>
  <li><code>func</code> &mdash; Function to execute</li>
</ul>
Returns:
<ul>
  <li>Input <code>func</code></li>
</ul>

<h4 id="dispose"><code>function dispose(func, clean)</code></h4>
Description:
<ul>
  <li>
    "Disposes" a function that was run with <code>computed</code>, deregistering it so that it will no longer be called whenever any of its accessed reactive properties update.
    The <code>clean</code> parameter controls whether calling <code>computed</code> with <code>func</code> will work or no-op.
  </li>
</ul>
Parameters:
<ul>
  <li><code>func</code> &mdash; Function to dispose, omit to dispose the currently executing computed function</li>
  <li><code>clean</code> &mdash; If truthy, only deregister the function from all dependencies, but allow it to be used with <code>computed</code> again in the future</li>
</ul>
Returns:
<ul>
  <li>Input <code>func</code> if <code>func</code> is valid, otherwise <code>undefined</code></li>
</ul>


## Credits
Credits for some libraries that served as inspiration or code reference:
- [Patella](https://github.com/luavixen/Patella)
- [Hyperactiv](https://github.com/elbywan/hyperactiv)

## Authors
Made with ❤ by Andrés Brugarolas ([andres-brugarolas.com](andres-brugarolas.com))

## License
This project is licensed under [GNU GENERAL PUBLIC LICENSE v3](LICENSE).
More info in the [LICENSE](LICENSE) file.
