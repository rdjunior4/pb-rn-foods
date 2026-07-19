// Custom events for cross-component communication
export const AUTH_MODAL_EVENT = "auth-modal-toggle";

export function dispatchAuthModalEvent(open: boolean) {
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: { open } }));
}

export function onAuthModalToggle(callback: (open: boolean) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ open: boolean }>).detail;
    callback(detail.open);
  };
  window.addEventListener(AUTH_MODAL_EVENT, handler);
  return () => window.removeEventListener(AUTH_MODAL_EVENT, handler);
}
