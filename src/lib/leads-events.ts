/** Browser event so leads tables refresh after assign from the bell menu, etc. */
export const LEADS_CHANGED_EVENT = "essentia:leads-changed";

export function emitLeadsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LEADS_CHANGED_EVENT));
}

export function onLeadsChanged(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(LEADS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(LEADS_CHANGED_EVENT, handler);
}
