---
title: "Hiding properties in JS... for real"
tags: ["software"]
date: "2017-12-10T15:52:16.556Z"
lang: "en"
license: "CC-BY-4.0"
aliases: ["/blog/5a2d5830/hiding-properties-in-js…-for-real", "/blog/5a2d5830/hiding-properties-in-js..-for-real"]
---

Sometimes, you want to hide the property of an object[^1]. Probably you are a library author and you are afraid that:

* your users will see it and attempt to use it
* your users will try to enumerate over it although it might not make sense

So here is what you do:

```js
const protectedObj = Object.defineProperty({}, 'foo', {
	enumerable: false,
	configurable: false,
	writable: false,
	value: 'hi there'
});
console.log(protectedObj.foo); // 'hi there'
console.log(Object.keys(protectedObj)); // []
```

Mission accomplished!
Well, nope, of course not.

JavaScript provides your users with [Object.getOwnPropertyNames()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames) or [Reflect.ownKeys()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys), which will reveal the property nevertheless:

```js
console.log(Object.getOwnPropertyNames(protectedObj)); // [ 'foo' ]
console.log(Reflect.ownKeys(protectedObj)); // [ 'foo' ]
```

You should probably leave it at that, because if your users are using these, they know what to expect.
But anyway, here is a funny trick that [puzzled me for a moment a few days ago](https://github.com/mucsi96/nightwatch-cucumber/issues/322).

## `Proxy` to the rescue

The trick to really hide properties is to use [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). The idea is that you set a trap, a function that is executed when the user tries to run `Object.getOwnPropertyNames()` or `Reflect.ownKeys()`, instead of whatever the JavaScript engine is doing internally. And you decide what the function returns - or in this case, doesn't.

```js
const hardProtectedObj = new Proxy({
	foo: 'hi there',
}, {
	ownKeys: (target) => {
		return [];
	},
});
console.log(hardProtectedObj.foo); // 'hi there'
console.log(Object.keys(hardProtectedObj)); // []
console.log(Object.getOwnPropertyNames(hardProtectedObj)); // []
console.log(Reflect.ownKeys(hardProtectedObj)); // []
```

I believe this is the ultimate solution, until JavaScript gets [friend classes](https://en.wikipedia.org/wiki/Friend_class). On the other hand...

* I find it needlessly complicated
* my gut feeling is that it goes against the freedom that JavaScript gives you - for better or worse

[^1]: I assume that in this case you can't use an [IIFE](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) because other parts of your library need to access these properties.
