import { $reactive, InternalObservable, ObserverConnection, ObserverConnectionSource } from "./observable";

export class Observer {
  public observing = new Map<
    InternalObservable<object>,
    {
      iterate: false | true;
      byKey: Set<string | number>;
    }
  >();

  constructor(public readonly trigger: () => void) {}

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
      existing.iterate = true;
    } else {
      existing.byKey.add(source.key);
    }
  }

  public removeObservers() {
    this.observing.forEach((val, key) => {
      if (val.iterate) {
        key[$reactive].connections.iterate.delete(this);
      }
      val.byKey.forEach((subkey) => {
        key[$reactive].connections.byKey.get(subkey).delete(this);
      });
    });
    this.observing.clear();
  }
}
