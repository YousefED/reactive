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
        toRun.add(connection.observer);
      });
    }
    operation.observable[$reactive].connections.byKey.get(operation.key)?.forEach((connection) => {
      toRun.add(connection.observer);
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

function addConnection<T>(connection: ObserverConnection<T>) {
  const source = connection.source;
  if (source.type === "iterate") {
    source.observable[$reactive].connections.iterate.add(connection);
  } else {
    let set = source.observable[$reactive].connections.byKey.get(source.key);
    if (!set) {
      set = new Set<ObserverConnection<T>>();
      source.observable[$reactive].connections.byKey.set(source.key, set);
    }
    set.add(connection);
  }
}

export function reportObserved<T extends object>(source: ObserverConnectionSource<T>, implicitObserver: Observer) {
  if (isTrackingDisabled()) {
    return;
  }

  const reaction = runningReaction();
  if (reaction) {
    const connection = { source, observer: reaction };
    addConnection(connection);
    reaction.observing.add(connection);
  }

  if (implicitObserver) {
    addConnection({ source, observer: implicitObserver });
    // implicitObserver.observing.add(source);
  }
}
