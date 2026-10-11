"use client";

import { useEffect } from "react";

function isFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function isFileInput(target: EventTarget | null) {
  return target instanceof HTMLInputElement && target.type === "file" && !target.disabled;
}

// Without this, a file dropped outside a drop zone makes the browser open it and discard the page.
export function usePreventStrayFileDrop() {
  useEffect(() => {
    const handle = (event: DragEvent) => {
      if (event.defaultPrevented || !isFileDrag(event) || isFileInput(event.target)) return;
      event.preventDefault();
      if (event.type === "dragover" && event.dataTransfer) {
        event.dataTransfer.dropEffect = "none";
      }
    };

    window.addEventListener("dragover", handle);
    window.addEventListener("drop", handle);
    return () => {
      window.removeEventListener("dragover", handle);
      window.removeEventListener("drop", handle);
    };
  }, []);
}
