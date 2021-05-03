import { Observer } from "../dist/reactive.modern";
import { reactive } from "./observable";

// Hacky, it's not really an Atom in the sense that it is not the building block of observables
export class Atom {
  private _observable = reactive({ _key: 1 });

  public reportObserved(implicitObserver?: Observer) {
    return (reactive(this._observable, implicitObserver)._key as any) as boolean;
    //return (this._observable._key as any) as boolean;
  }

  public reportChanged() {
    this._observable._key++;
  }
}

export function createAtom(name: string, onBecomeObservedHandler?: () => void, onBecomeUnobservedHandler?: () => void) {
  // TODO: add support for params
  return new Atom();
}
