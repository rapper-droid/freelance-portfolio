/**
 * Handing the visitor a file.
 *
 * Five places had their own copy of this six-line browser dance — FLOWSTATE's
 * weekly summary, STILL's SVG, the CSV tool, the flow result and the sandbox
 * export. They agreed by accident, which is not the same as agreeing.
 *
 * The object URL is revoked on the next frame rather than after a fixed
 * second: the click has already been dispatched synchronously, so the browser
 * has the blob, and a timer that outlives the page leaks it.
 */

export function downloadText(
  text: string,
  filename: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // A frame is enough, and unlike a timeout it cannot fire after teardown.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** A filename stamp that sorts, for files somebody keeps several of. */
export const stamp = (nowIso: string) =>
  nowIso.slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
