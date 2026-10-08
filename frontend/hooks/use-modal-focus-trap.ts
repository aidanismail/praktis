"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  autoFocus?: boolean;
  /** Element to focus when the modal closes. Defaults to the element that was focused before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const AUTOFOCUS_SELECTOR = "[data-autofocus], [autofocus]";

const modalStack: symbol[] = [];


let lastOutsideFocus: HTMLElement | null = null;
let isTrackingFocus = false;

function trackFocus() {
  if (isTrackingFocus || typeof document === "undefined") return;
  isTrackingFocus = true;
  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[aria-modal="true"]')) return;
      lastOutsideFocus = target;
    },
    true
  );
}

trackFocus();

export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  autoFocus = true,
  returnFocusRef,
}: UseModalFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const returnTargetRef = useRef<HTMLElement | null>(null);
  const returnFocusRefRef = useRef(returnFocusRef);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
    returnFocusRefRef.current = returnFocusRef;
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) return;

    const token = Symbol("modal");
    modalStack.push(token);

    const active = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    returnTargetRef.current =
      active &&
      active !== document.body &&
      !(container && container.contains(active))
        ? active
        : lastOutsideFocus;

    let frame: number | null = null;
    if (autoFocus) {
      frame = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        if (el.contains(document.activeElement)) return;
        const target =
          el.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR) ??
          el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (target) {
          target.focus();
        } else {
          el.focus();
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== token) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        const el = containerRef.current;
        if (!el) return;

        const focusableElements = Array.from(
          el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((node) => node.offsetParent !== null);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !el.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else if (
          document.activeElement === lastElement ||
          !el.contains(document.activeElement)
        ) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (frame !== null) cancelAnimationFrame(frame);

      const index = modalStack.indexOf(token);
      if (index !== -1) modalStack.splice(index, 1);

      const target = returnFocusRefRef.current?.current ?? returnTargetRef.current;
      returnTargetRef.current = null;
      if (target && target.isConnected && typeof target.focus === "function") {
        target.focus();
      }
    };
  }, [isOpen, autoFocus]);

  return containerRef;
}
