import { clearBatch } from "./reporting";

let runningActionCount = 0;

export function isActionRunning() {
  return runningActionCount > 0;
}

export function runInAction<T>(func: () => T) {
  runningActionCount++;
  try {
    return func();
  } finally {
    runningActionCount--;

    if (runningActionCount === 0) {
      clearBatch();
    }
  }
}
