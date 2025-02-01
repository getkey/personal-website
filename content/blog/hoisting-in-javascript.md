---
title: "Hoisting in JavaScript"
tags: ["software"]
date: "2016-05-12T18:27:45Z"
locale: "en"
license: "CC-BY-4.0"
aliases: ["/blog/5734cb21/hoisting-in-javascript"]
---

This behavior can surprise beginners to JavaScript, and also, I admit, people like me who learned JavaScript by doing.
So what is hoisting about? Concisely put, it means that every variable declared in a scope is actually declared when entering the scope, **no matter where** you choose to put the declaration.

In the following examples I'm going to create a function to define a scope, but this can be applied to every scope, the global scope, a scope you define with `{` and `}`, etc.

```js
function foo() {
	var bar = true;
	foobar = "baz";
	var foobar;
}
```

Even in strict mode, this will work because it is equivalent to

```js
function foo() {
	var bar,
		foobar;
	bar = true;
	foobar = "baz";
}
```

It is important to note that only declarations are hoisted, not initializations.

```js
function foo() {
	console.log(bar); // undefined
	var bar = "foobar";
	console.log(bar); // "foobar"
}
```

That was what you would expect, but what about this example?

```js
var foo = 50;
function bar() {
	var foo = foo + 1;
	console.log(foo); // NaN
}
```

This is, in fact, the same thing as

```js
var foo = 50;
function bar () {
	var foo;
	// at this point `foo === undefined`
	foo = foo + 1; // and `undefined + 1` is NaN
	console.log(foo); // NaN
}
```

In order to prevent bugs because of this behavior, some developers such as Douglas Crockford recommend that "the `var` statement should be the first statement in the function body". I believe this is a bit extreme and it makes the resulting code unorganized. I think it is better to be careful, knowing this rule. You decide.


## `var`, `function` and `function*`

As we have just seen; before being initialized, a variable declared with `var` hold the value `undefined`.

It is worth noting that function **declarations** are hoisted, which means that they are **not set to `undefined`**.

```js
function bar() {
	baz(); // "I am hoisted :D"
	function baz() {
		console.log("I am hoisted :D");
	}
}
```

Function expressions however, are not. They follow the same rules as everything declared with `var`.

```js
function bar() {
	console.log(foo); // undefined
	var foo = function() {
	}
}
```

```js
function bar() {
	var gen = foo();
	console.log(gen.next().value); // 0
	function* foo() {
		var i = 0;
		while (true) yield i++;
	}
}
```

Generator functions declarations behave like function declarations.


## `let`, `const` and `class`

As we have seen this ~~awful~~ behavior leads to errors. To prevent them, the new ES6 keywords are subject to the TDZ (Temporal Dead Zone). Before the `let`, `const` or `class` statement, instead of being initialized to `undefined`, variables are actually not initialized.
Because something set to `undefined` may be initialized, remember? It's just that it has the value `undefined`.

```js
function bar() {
	console.log(foo); // ReferenceError: foo is not defined
	let foo = true;
}
function barbar() {
	console.log(foo); // ReferenceError: foo is not defined
	const foo = true;
}
function barbarbar() {
	baz = new Foo(); // ReferenceError: Foo is not defined
	class Foo {
	}
}
```

So if you try to access it, you get a `ReferenceError`, the same way you get an error accessing a variable you haven't declared.

As a sidenote, anything defined with `let`, `const` and `class` is still [hoisted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#Temporal_dead_zone_and_errors_with_let).
