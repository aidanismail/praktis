"use client";

import { useRef, useState, type DragEvent } from "react";

type UseFileDropOptions = {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
};

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function useFileDrop({ onFiles, disabled = false }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave also fire for child elements, so count depth to avoid flicker.
  const depth = useRef(0);

  const reset = () => {
    depth.current = 0;
    setIsDragging(false);
  };

  const dropProps = {
    onDragEnter: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      if (!disabled) setIsDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    },
    onDragLeave: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      reset();
      if (!disabled && event.dataTransfer.files.length > 0) {
        onFiles(event.dataTransfer.files);
      }
    },
  };

  return { isDragging: isDragging && !disabled, dropProps };
}
