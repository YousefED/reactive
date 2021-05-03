import { reportObserved, reportChanged } from "./reporting";
import { Observer } from "./observer";
import { hasRunningReaction } from "./reaction";

export const $reactive = Symbol("$reactive");
export const $reactiveproxy = Symbol("$reactiveproxy");

type Admin<T> = {
  connections: {
    iterate: Set<Observer>;
    byKey: Map<string | number, Set<Observer>>;
  };
  proxy: InternalObservable<T>;
  proxiesWithImplicitObserver: Map<Observer, InternalObservable<T>>;
  raw: T;
  shallow: boolean;
};
export type InternalObservable<T> = {
  [$reactive]: Admin<T>;
} & T;

export function isReactive<T>(object: T, implicitObserver?: Observer): object is InternalObservable<T> {
  return !!(
    object &&
    (object as any)[$reactiveproxy] &&
    (object as any)[$reactiveproxy].implicitObserver === implicitObserver
  );
}

function isInternalObservable<T>(object: T): object is InternalObservable<T> {
  return !!(object && !isReactive(object) && (object as any)[$reactive]);
}

export type ObserverConnectionSource<T> = {
  observable: InternalObservable<T>;
} & (
  | {
      key: string | number;
      type: "has" | "get";
    }
  | {
      type: "iterate";
    }
);

export type ObserverConnection<T> = {
  source: ObserverConnectionSource<T>;
  observer: Observer;
};

export type Operation<T> = {
  observable: InternalObservable<T>;
  key: string | number;
} & (
  | {
      value: any;
      type: "add";
    }
  | { type: "update"; value: any; oldValue: any }
  | { type: "delete"; oldValue: any }
);

function observable<T>(object: T, implicitObserver?: Observer, shallow = false) {
  if (isReactive(object, implicitObserver)) {
    return object;
  }

  const observable = _observable(object, shallow);

  if (!implicitObserver) {
    return observable;
  }

  let proxy = observable[$reactive].proxiesWithImplicitObserver.get(implicitObserver);
  if (!proxy) {
    const proxyTraps = {
      implicitObserver,
    } as any;
    Object.setPrototypeOf(proxyTraps, objectProxyTraps);
    proxy = new Proxy<InternalObservable<T>>(observable[$reactive].raw as any, proxyTraps);

    observable[$reactive].proxiesWithImplicitObserver.set(implicitObserver, proxy);
  }
  return proxy;
}
export const reactive = observable;
function _observable<T>(object: T, shallow = false) {
  if (isReactive(object)) {
    return object;
  }

  if (isInternalObservable(object)) {
    return object[$reactive].proxy;
  }

  if (object[$reactive] || object[$reactiveproxy]) {
    throw new Error("unexpected");
  }
  const value: Admin<T> = {
    connections: {
      iterate: new Set<Observer>(),
      byKey: new Map<string | number, Set<Observer>>(),
    },
    proxy: {} as any, // temp
    raw: object,
    proxiesWithImplicitObserver: new Map(),
    shallow,
  };
  Object.defineProperty(object, $reactive, {
    enumerable: false,
    writable: true,
    configurable: true,
    value,
  });
  const proxy = new Proxy<InternalObservable<T>>((object as any) as InternalObservable<T>, objectProxyTraps);
  value.proxy = proxy;
  return proxy;
}

const objectProxyTraps: ProxyHandler<InternalObservable<any>> = {
  // Read:
  has(target: InternalObservable<any>, key: PropertyKey): boolean {
    const result = Reflect.has(target, key);

    if (typeof key === "symbol") {
      return result;
    }

    // register and save (observable.prop -> runningReaction)
    reportObserved({ observable: target, key, type: "has" }, this.implicitObserver);
    return result;
  },
  get(target: InternalObservable<any>, key: PropertyKey, receiver: any): any {
    if (key === $reactiveproxy) {
      // for isObservable
      return { implicitObserver: this.implicitObserver };
    }

    const result = Reflect.get(target, key, receiver);

    if (typeof key === "symbol") {
      return result;
    }

    // register and save (observable.prop -> runningReaction)
    if (key === "length" && Array.isArray(target)) {
      reportObserved({ observable: target as any /* TODO */, type: "iterate" }, this.implicitObserver);
    } else {
      reportObserved({ observable: target, key, type: "get" }, this.implicitObserver);
    }

    if (isInternalObservable(result)) {
      // already has an observable. Call observable() again to make sure we get the right proxy for implicitObserver
      return observable(result, this.implicitObserver);
    }

    if (target[$reactive].shallow) {
      return result;
    }
    // if we are inside a reaction and observable.prop is an object wrap it in an observable too
    // this is needed to intercept property access on that object too (dynamic observable tree)
    // const observableResult = rawToProxy.get(result)
    if (typeof result === "object" && result !== null && !isReactive(result, this.implicitObserver)) {
      // do not violate the none-configurable none-writable prop get handler invariant
      // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
      if (
        (!descriptor || !(descriptor.writable === false && descriptor.configurable === false)) &&
        (hasRunningReaction() || this.implicitObserver)
      ) {
        return observable(result, this.implicitObserver);
      }
    }
    // otherwise return the observable wrapper if it is already created and cached or the raw object
    return result;
  },
  ownKeys(target: InternalObservable<any>) {
    reportObserved({ observable: target, type: "iterate" }, this.implicitObserver);
    return Reflect.ownKeys(target);
  },
  // Write:
  set(target: InternalObservable<any>, key: PropertyKey, value: any, receiver: any): boolean {
    if (typeof key === "symbol") {
      return Reflect.set(target, key, value, receiver);
    }

    // save if the object had a descriptor for this key
    // execute the set operation before running any reaction
    const hadKey = Object.hasOwnProperty.call(target, key);
    // save if the value changed because of this set operation
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);

    // queue a reaction if it's a new property or its value changed
    if (!hadKey) {
      reportChanged({ observable: target, key, value, type: "add" });
    } else if (value !== oldValue) {
      if (key === "length" && Array.isArray(target)) {
        if (oldValue < value) {
          // not necessary as values will still be undefined:
          /*for (let i = oldValue; i <= value; i++) {
            executeObservers({
              observable: target as any,
              key: "" + (i - 1),
              value: undefined,
              type: "add",
            });
          }*/
        } else {
          for (let i = value + 1; i <= oldValue; i++) {
            // TODO: all of these will trigger the "iterate" listeners. That should only be triggered once
            reportChanged({
              observable: target as any,
              key: "" + (i - 1),
              oldValue: undefined, // Note: maybe we've just lost oldValue
              type: "delete",
            });
          }
        }
      } else {
        reportChanged({
          observable: target,
          key,
          value,
          oldValue,
          type: "update",
        });
      }
    }
    return result;
  },
  deleteProperty(target: InternalObservable<any>, key: PropertyKey): boolean {
    if (typeof key === "symbol") {
      return Reflect.deleteProperty(target, key);
    }

    // save if the object had the key
    const hadKey = Object.hasOwnProperty.call(target, key);
    const oldValue = target[key];
    // execute the delete operation before running any reaction
    const result = Reflect.deleteProperty(target, key);
    // only queue reactions for delete operations which resulted in an actual change
    if (hadKey) {
      reportChanged({ observable: target, key, oldValue, type: "delete" });
    }
    return result;
  },
  preventExtensions(target) {
    throw new Error("Dynamic observable objects cannot be frozen");
  },
};
