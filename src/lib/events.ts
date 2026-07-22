// Custom events for cross-component communication
export const AUTH_MODAL_EVENT = "auth-modal-toggle";

export function dispatchAuthModalEvent(open: boolean, tab?: "login" | "register") {
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: { open, tab } }));
}

export function onAuthModalToggle(callback: (open: boolean, tab?: "login" | "register") => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ open: boolean; tab?: "login" | "register" }>).detail;
    callback(detail.open, detail.tab);
  };
  window.addEventListener(AUTH_MODAL_EVENT, handler);
  return () => window.removeEventListener(AUTH_MODAL_EVENT, handler);
}
