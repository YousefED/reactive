import { moduleNameMapper } from "jest.config";
import { $reactive, InternalObservable, ObserverConnection, ObserverConnectionSource } from "./observable";
import { Observer } from "./observer";

let runningReactions: Reaction[] = [];

export class Reaction implements Observer {
  public observingToDispose = new Map<
    InternalObservable<object>,
    {
      iterate: false | true;
      byKey: Set<string | number>;
    }
  >();

  public observing = new Map<
    InternalObservable<object>,
    {
      iterate: false | true;
      byKey: Set<string | number>;
    }
  >();

  constructor(private func: () => void | Promise<void>, private options: { name: string }) {}

  public registerConnection<T extends object>(source: ObserverConnectionSource<T>) {
    let existing = this.observing.get(source.observable);
    if (!existing) {
      existing = {
        byKey: new Set(),
        iterate: false,
      };
      this.observing.set(source.observable, existing);
    }
    if (source.type === "iterate") {
      if (this.observingToDispose.get(source.observable)?.iterate) {
        this.observingToDispose.get(source.observable).iterate = false;
      }
      const wasRegistered = existing.iterate;
      existing.iterate = true;
      return !!wasRegistered;
    } else {
      if (this.observingToDispose.get(source.observable)?.byKey.has(source.key)) {
        this.observingToDispose.get(source.observable).byKey.delete(source.key);
      }

      let existingKey = existing.byKey.has(source.key);
      if (!existingKey) {
        existing.byKey.add(source.key);
        return false;
      } else {
        return true;
      }
    }
  }

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
    this.observingToDispose = this.observing;
    this.observing = new Map();
    this.reaction();

    this.observingToDispose.forEach((val, key) => {
      if (val.iterate) {
        key[$reactive].connections.iterate.delete(this);
      }
      val.byKey.forEach((subkey) => {
        key[$reactive].connections.byKey.delete(subkey);
      });
    });
    this.observingToDispose = new Map();
  }
}

export function hasRunningReaction() {
  return !!runningReactions.length;
}

export function runningReaction() {
  return runningReactions.length ? runningReactions[runningReactions.length - 1] : undefined;
}
