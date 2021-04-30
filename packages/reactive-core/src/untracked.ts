let disableTracking = false;

export function isTrackingDisabled() {
  return disableTracking;
}

export function untracked(fn: () => void) {
  disableTracking = true;
  try {
    fn();
  } finally {
    disableTracking = false;
  }
}

export function untrackedCB(fn: () => void) {
  return () => untracked(fn);
}
