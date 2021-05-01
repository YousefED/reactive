import { $reactive, ObserverConnection } from "./observable";
import { Observer } from "./observer";

let runningReactions: Reaction[] = [];

export class Reaction implements Observer {
  public observing = new Set<ObserverConnection<object>>();
  constructor(private func: () => void | Promise<void>, private options: { name: string }) {}

  private reaction = () => {
    runningReactions.push(this);

    try {
      this.func();
    } finally {
      runningReactions.pop();
    }
  };

  public trigger() {
    // TODO: catch errors
    if (runningReactions.includes(this)) {
      throw new Error("already running reaction");
    }
    this.observing.forEach((val) => {
      const connections = val.source.observable[$reactive].connections;
      if (val.source.type === "iterate") {
        connections.iterate.delete(this);
      } else {
        connections.byKey.get(val.source.key).delete(this);
      }
    });
    this.observing.clear();
    this.reaction();
  }
}

export function hasRunningReaction() {
  return !!runningReactions.length;
}

export function runningReaction() {
  return runningReactions.length ? runningReactions[runningReactions.length - 1] : undefined;
}
