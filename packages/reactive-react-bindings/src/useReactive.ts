import { useMemo, useReducer } from "react";
import { reactive } from "reactive";

export function useReactive<T>(stateObject: T): T {
  const [, forceUpdate] = useReducer((c) => c + 1, 0);

  const ret = useMemo(() => {
    return reactive(stateObject, {
      trigger: () => {
        forceUpdate();
      },
    });
  }, []);

  return ret;
}
