/**
 * Wheel handling for the horizontal rows (product sections, announcements).
 *
 * Some browsers redirect a vertical wheel over an `overflow-x` element sideways
 * instead of letting it bubble, so vertical intent has to be forwarded to the
 * page by hand. The catch is telling the two apart: a trackpad swipe wanders
 * off-axis mid-flick, so deciding per event lets us cancel a horizontal scroll
 * halfway through — which is what makes a row feel like it's fighting back.
 *
 * So the axis is decided once, on the first event of a gesture, and held until
 * the gesture goes quiet.
 */

const GESTURE_GAP = 180; // ms of quiet that ends a gesture

/** Attach the handler to `el`; returns the detach function. */
export function bindRowWheel(el: HTMLElement): () => void {
  let axis: "x" | "y" | null = null;
  let lastWheel = -Infinity;

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return; // pinch-zoom
    if (e.timeStamp - lastWheel > GESTURE_GAP) axis = null;
    lastWheel = e.timeStamp;

    if (axis === null) {
      if (e.deltaX === 0 && e.deltaY === 0) return;
      axis = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) ? "x" : "y";
    }
    // Horizontal: hands off, so the native scroll keeps its momentum.
    if (axis === "x") return;
    // Line/page deltas aren't pixels; converting them ourselves would either
    // crawl or jump, so leave those to the browser's own smooth scrolling.
    if (e.deltaMode !== 0) return;
    e.preventDefault();
    window.scrollBy({ top: e.deltaY });
  };

  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}
