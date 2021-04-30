import { reactive } from "./observable";
import { Reaction } from "./reaction";

export function autorun<T>(
  func: () => T extends Promise<void> ? never : T extends void ? T : never,
  extraOptions?: { fireImmediately?: boolean; name?: string }
): Reaction {
  const options = Object.assign({ fireImmediately: true, name: "unnamed" }, extraOptions);
  const reaction = new Reaction(func, options);
  if (options.fireImmediately) {
    reaction.trigger();
  }
  return reaction;
}

export function autorunAsync<T>(
  func: (reactive: T) => Promise<void>,
  reactiveObject: T,
  extraOptions?: { fireImmediately?: boolean; name?: string }
): Reaction {
  const options = Object.assign({ fireImmediately: true, name: "unnamed" }, extraOptions);
  const reaction = new Reaction(() => {
    func(reactiveObject); // TODO: error handling
  }, options);
  reactiveObject = reactive(reactiveObject, reaction);
  (reactiveObject as any).bla = 4;
  if (options.fireImmediately) {
    reaction.trigger();
  }
  return reaction;
}
