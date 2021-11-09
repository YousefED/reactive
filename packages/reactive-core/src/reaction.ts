import { Observer } from "./observer";

let runningReactions: Reaction[] = [];
export class Reaction extends Observer {
  private isInitial = true;

  constructor(
    private func: () => void | Promise<void>,
    private options: { fireImmediately: boolean; name: string },
    private effect?: () => void | Promise<void>
  ) {
    super(() => this._trigger());

    if (!effect && !this.options.fireImmediately) {
      throw new Error("if no effect function passed, should always fireImmediately");
    }
    // fire reaction
    this.reaction();
  }

  private reaction = () => {
    runningReactions.push(this);

    try {
      this.func();
    } finally {
      runningReactions.pop();
    }

    if (this.effect && (!this.isInitial || this.options.fireImmediately)) {
      this.effect();
    }
    this.isInitial = false;
  };

  private _trigger() {
    // TODO: catch errors
    if (runningReactions.includes(this)) {
      throw new Error("already running reaction");
    }
    this.removeObservers();
    this.reaction();
  }
}

export function hasRunningReaction() {
  return !!runningReactions.length;
}

export function runningReaction() {
  return runningReactions.length ? runningReactions[runningReactions.length - 1] : undefined;
}

export function reaction(
  func: () => any | Promise<any>,
  effect: () => void | Promise<void>,
  options?: { fireImmediately?: boolean; name?: string }
) {
  const newOptions = { name: "unnamed", fireImmediately: true, ...options };
  const r = new Reaction(func, newOptions, effect);
  return r;
}
