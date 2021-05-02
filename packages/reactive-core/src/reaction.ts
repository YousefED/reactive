import { Observer } from "./observer";

let runningReactions: Reaction[] = [];
export class Reaction extends Observer {
  constructor(private func: () => void | Promise<void>, private options: { name: string }) {
    super(() => this._trigger());
  }

  private reaction = () => {
    runningReactions.push(this);

    try {
      this.func();
    } finally {
      runningReactions.pop();
    }
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
