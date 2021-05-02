import { useMemo, useReducer } from "react";
import { reactive } from "@reactivedata/reactive";

export function useReactive<T>(stateObject: T, deps?: React.DependencyList): T {
  const [, forceUpdate] = useReducer((c) => c + 1, 0);

  const ret = useMemo(() => {
    return reactive(stateObject, {
      trigger: () => {
        forceUpdate();
      },
    });
  }, deps || []);

  return ret;
}

export function useReactives<T extends any[]>(stateObjects: T, deps?: React.DependencyList): T {
  const [, forceUpdate] = useReducer((c) => c + 1, 0);
  const trigger = {
    trigger: () => {
      forceUpdate();
    },
  };

  return useMemo(() => {
    return stateObjects.map((stateObject) => {
      return reactive(stateObject, trigger);
    });
  }, deps || []) as T;
}
