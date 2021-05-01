# Reactive

[![npm version](https://badge.fury.io/js/%40reactivedata%2Freactive.svg)](https://badge.fury.io/js/%40reactivedata%2Freactive) [![Coverage Status](https://coveralls.io/repos/github/YousefED/reactive/badge.svg?branch=workflow)](https://coveralls.io/github/YousefED/reactive?branch=workflow)

A super simple, yet powerful and performant library for State Management / Reactive Programming.

## Using React

```
import { useReactive } from "@reactivedata/react";

export default function App() {
  const state = useReactive({
    clickCount: 0
  });

  return (
    <div>
        <p>The button has been clicked <strong>{state.clickCount} times!</strong></p>
        <button onClick={() => state.clickCount++} />
    </div>
  );
}
```

<sup>View on [CodeSandbox](https://codesandbox.io/s/reactivedatareact-basic-example-ihgu9?file=/src/App.tsx)</sup>

Pass in any object to `useReactive` to create a Reactive state. Any properties (even nested) can be mutated, and your component will update automatically.

### Advanced example

```
const state = useReactive({
    players: [
        { name: "Peter"}
    ]
})
```

Adding players (`state.players.push`) or modifying a name (`state.players[0].name = "John"`) will all work out-of-the-box.

## Without React

Reactive is perfectly usable without React, and actually has 0 external dependencies.

### Simple example

```
import { reactive, autorun } from "@reactivedata/reactive";

const data = reactive({
    players: [
        { name: "Peter"}
    ]
});

autorun(() => {
    console.log(`There are ${data.length} players, the first player name is ${data.players[0].name}`);
});

data.players.push({ name: "Paul" });
data.players[0].name = "John";
```

Will print:

```
There are 1 players, the first player name is Paul
There are 2 players, the first player name is Paul
There are 2 players, the first player name is John
```

<sup>View on [CodeSandbox](https://codesandbox.io/s/reactivedatareactive-basic-example-b3fs3)</sup>

## API

- `reactive`
- `autorun`
- `autorunAsync`
- `untracked`
- `runInAction`

(to be documented)

<sup>The API surface is inspired by MobX, but with support for `autorunAsync` and an easier React interface.</sup>

### Credits ❤️

Reactive builds on Reactive Programming concepts. In particular, it's inspired by and builds upon the amazing work by [MobX](https://mobx.js.org/) and [NX Observe](https://github.com/nx-js/observer-util).
