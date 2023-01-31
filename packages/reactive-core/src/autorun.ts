import { reactive } from "./observable";
import { Reaction } from "./reaction";

export function autorun<T>(
  func: () => T extends Promise<void> ? never : T extends void ? T : never,
  extraOptions?: { name?: string }
): Reaction {
  const options = { name: "unnamed", fireImmediately: true, ...extraOptions };
  const reaction = new Reaction(func, options);

  return reaction;
}

export function autorunAsync<T>(
  func: (reactive: T) => Promise<void>,
  reactiveObject: T,
  extraOptions?: { name?: string }
): Reaction {
  const options = { name: "unnamed", fireImmediately: true, ...extraOptions };
  const reaction = new Reaction(() => {
    func(reactiveObject); // TODO: error handling
  }, options);
  reactiveObject = reactive(reactiveObject, reaction);
  if (options.fireImmediately) {
    reaction.trigger();
  }
  return reaction;
}
