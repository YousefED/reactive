import { $reactive, ObserverConnection } from "./observable";

export class Observer {
  public observing: Set<ObserverConnection<object>> = new Set();

  constructor(public readonly trigger: () => void) {}

  public removeObservers() {
    this.observing.forEach((val) => {
      const connections = val.source.observable[$reactive].connections;
      if (val.source.type === "iterate") {
        connections.iterate.delete(this);
      } else {
        connections.byKey.get(val.source.key).delete(this);
      }
    });
    this.observing.clear();
  }
}
