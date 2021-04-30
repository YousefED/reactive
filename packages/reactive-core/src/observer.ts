import { $reactive, ObserverConnectionSource, Operation } from "./observable";
import { runningReaction } from "./reaction";
import { isTrackingDisabled } from "./untracked";

export type Observer = { trigger: () => void };

export function reportChanged<T>(operation: Operation<T>) {
  // create a copy because
  // 1. the set observable[$reactive].connections will be changed while executing reactions (connections will be added / removed)
  // 2. de-duplicate reactions (only run reactions once, for example if it's subscribed to both 'get' and 'iterate')
  const toRun = new Set<Observer>();

  operation.observable[$reactive].connections.forEach((connection) => {
    if (connection.source.type === "iterate") {
      if (operation.type === "add" || operation.type === "delete") {
        toRun.add(connection.observer);
      }
    } else if (connection.source.key === operation.key) {
      toRun.add(connection.observer);
    }
  });
  toRun.forEach((observer) => {
    observer.trigger();
  });
}

export function reportObserved<T>(source: ObserverConnectionSource<T>, implicitObserver: Observer) {
  if (isTrackingDisabled()) {
    return;
  }

  const reaction = runningReaction();
  if (reaction) {
    source.observable[$reactive].connections.add({ source, observer: reaction });
    reaction.observing.add(source);
  }

  if (implicitObserver) {
    source.observable[$reactive].connections.add({ source, observer: implicitObserver });
    // implicitObserver.observing.add(source);
  }
}
