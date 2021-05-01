import { isActionRunning } from "./action";
import { $reactive, ObserverConnection, ObserverConnectionSource, Operation } from "./observable";
import { runningReaction } from "./reaction";
import { isTrackingDisabled } from "./untracked";

export type Observer = { trigger: () => void };

let batch: Operation<any>[] = [];

export function clearBatch<T>() {
  reportChangedArray(batch);
  batch = [];
}

function reportChangedArray<T>(operations: Array<Operation<T>>) {
  // create a copy because
  // 1. the set observable[$reactive].connections will be changed while executing reactions (connections will be added / removed)
  // 2. de-duplicate reactions (only run reactions once, for example if it's subscribed to both 'get' and 'iterate')
  const toRun = new Set<Observer>();

  operations.forEach((operation) => {
    if (operation.type === "add" || operation.type === "delete") {
      operation.observable[$reactive].connections.iterate.forEach((connection) => {
        toRun.add(connection);
      });
    }
    operation.observable[$reactive].connections.byKey.get(operation.key)?.forEach((connection) => {
      toRun.add(connection);
    });
  });

  toRun.forEach((observer) => {
    observer.trigger();
  });
}

export function reportChanged<T>(operation: Operation<T>) {
  if (isActionRunning) {
    batch.push(operation);
    return;
  }
  reportChangedArray([operation]);
}

function addConnection<T>(source: ObserverConnectionSource<T>, observer: Observer) {
  if (source.type === "iterate") {
    source.observable[$reactive].connections.iterate.add(observer);
  } else {
    let set = source.observable[$reactive].connections.byKey.get(source.key);
    if (!set) {
      set = new Set<Observer>();
      source.observable[$reactive].connections.byKey.set(source.key, set);
    }
    set.add(observer);
  }
}

export function reportObserved<T extends object>(source: ObserverConnectionSource<T>, implicitObserver: Observer) {
  if (isTrackingDisabled()) {
    return;
  }

  const reaction = runningReaction();
  if (reaction) {
    if (!reaction.registerConnection(source)) {
      addConnection(source, reaction);
    }
  }

  if (implicitObserver) {
    addConnection(source, implicitObserver);
    // implicitObserver.observing.add(source);
  }
}
