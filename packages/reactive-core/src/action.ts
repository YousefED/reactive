import { clearBatch } from "./observer";

export let isActionRunning = false;

export function runInAction(func: () => void) {
  isActionRunning = true;
  try {
    func();
  } finally {
    clearBatch();
    isActionRunning = false;
  }
}
