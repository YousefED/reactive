# Reactive

[![npm version](https://badge.fury.io/js/%40reactivedata%2Freactive.svg)](https://badge.fury.io/js/%40reactivedata%2Freactive) [![Coverage Status](https://coveralls.io/repos/github/YousefED/reactive/badge.svg?branch=workflow)](https://coveralls.io/github/YousefED/reactive?branch=workflow)

A super simple, yet powerful and performant library for State Management / Reactive Programming.

## Example with React

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

### Credits

Reactive builds on Reactive Programming concepts. In particular, it's inspired by and builds upon the amazing work by [MobX](https://mobx.js.org/) and [NX Observe](https://github.com/nx-js/observer-util).
