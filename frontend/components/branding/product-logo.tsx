"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AsteriskIcon } from "@/components/ui/asterisk-loader";

const emptySubscribe = () => () => {};

type ProductLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  size?: number;
  interactive?: boolean;
};

type EasterEggStage =
  | "idle"
  | "dislodge-1"
  | "dislodge-2"
  | "dislodge-3"
  | "dislodge-4"
  | "falling"
  | "fallen"
  | "recovering";

type FallenCoords = {
  startX: number;
  startY: number;
  starRenderSize: number;
  startScale: number;
  targetX: number;
  targetY: number;
  deltaX: number;
  deltaY: number;
};

export function ProductLogo({
  alt = "Praktis",
  className,
  priority = false,
  size = 32,
  interactive = true,
}: ProductLogoProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [stage, setStage] = useState<EasterEggStage>("idle");
  const [clickCount, setClickCount] = useState(0);
  const [fallenCoords, setFallenCoords] = useState<FallenCoords | null>(null);

  const logoRef = useRef<HTMLSpanElement | null>(null);
  const portalStarRef = useRef<HTMLDivElement | null>(null);
  const activeAnimationRef = useRef<Animation | null>(null);

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoRecoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (autoRecoverTimerRef.current) clearTimeout(autoRecoverTimerRef.current);
  }, []);

  const triggerRecover = useCallback(() => {
    clearAllTimers();
    if (!portalStarRef.current || !fallenCoords) {
      setStage("idle");
      setClickCount(0);
      setFallenCoords(null);
      return;
    }

    setStage("recovering");

    const el = portalStarRef.current;
    const { deltaX, deltaY, startX, startY, startScale } = fallenCoords;

    // Dynamically calculate current logo position to align with where the logo is right now
    const rect = logoRef.current?.getBoundingClientRect();
    const currentStartX = rect ? rect.left + rect.width * 0.7135 : startX;
    const currentStartY = rect ? rect.top + rect.height * 0.385 : startY;

    const returnDeltaX = currentStartX - startX;
    const returnDeltaY = currentStartY - startY;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setStage("idle");
      setClickCount(0);
      setFallenCoords(null);
      return;
    }

    const RECOVER_STEPS = 32;
    const recoverKeyframes: Keyframe[] = [];

    const rxStart = deltaX;
    const ryStart = deltaY;
    const rxEnd = returnDeltaX;
    const ryEnd = returnDeltaY;

    // Upward arc bow height during flight
    const bow = Math.min(80, Math.max(35, (ryStart - ryEnd) * 0.15));

    for (let i = 0; i <= RECOVER_STEPS; i++) {
      const p = i / RECOVER_STEPS;
      // Apple-like smooth exponential ease-out
      const t = 1 - Math.pow(1 - p, 2.6);

      const x = rxStart + (rxEnd - rxStart) * t;
      const y = ryStart + (ryEnd - ryStart) * t - bow * 4 * t * (1 - t);

      let scale = 1.0;
      if (t < 0.45) {
        scale = 1.0 + 0.25 * (t / 0.45);
      } else {
        const sProg = (t - 0.45) / 0.55;
        scale = 1.25 - (1.25 - startScale) * sProg;
      }

      const rot = 1080 * (1 - t);

      recoverKeyframes.push({
        transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`,
        offset: p,
      });
    }

    const anim = el.animate(recoverKeyframes, {
      duration: 750,
      easing: "linear",
      fill: "forwards",
    });

    activeAnimationRef.current = anim;
    anim.onfinish = () => {
      setStage("idle");
      setClickCount(0);
      setFallenCoords(null);
      activeAnimationRef.current = null;
    };
  }, [clearAllTimers, fallenCoords]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (activeAnimationRef.current) {
        activeAnimationRef.current.cancel();
      }
    };
  }, [clearAllTimers]);

  // Handle cross-screen falling animation via Web Animations API
  useEffect(() => {
    if (stage === "falling" && portalStarRef.current && fallenCoords) {
      const el = portalStarRef.current;
      const { deltaX, deltaY, startScale } = fallenCoords;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        return;
      }

      if (activeAnimationRef.current) {
        activeAnimationRef.current.cancel();
      }

      const STEPS = 40;
      const keyframes: Keyframe[] = [];

      // Initial upward pop height (scaled to vertical distance)
      const hPop = Math.min(70, Math.max(40, Math.abs(deltaY) * 0.085));
      // Parabolic equation: y(t) = a*t^2 + b*t
      const safeDisc = Math.max(0, 4 * hPop * hPop + 4 * hPop * Math.max(20, deltaY));
      const b = -2 * hPop - Math.sqrt(safeDisc);
      const a = deltaY - b;

      const startRot = 38;
      const targetRot = 1080;
      const deltaRot = targetRot - startRot;

      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS; // 0 to 1

        // Horizontal position: smooth ease-out into bottom right corner
        const xProgress = 1 - Math.pow(1 - t, 1.35);
        const x = deltaX * xProgress;

        // Vertical position: exact physical parabola
        const y = a * t * t + b * t;

        // Scale: expands during initial pop, then settles smoothly to 1.0 (~24px)
        let scale = 1.0;
        if (t < 0.18) {
          const sProg = t / 0.18;
          scale = startScale + (1.25 - startScale) * sProg;
        } else {
          const sProg = (t - 0.18) / 0.82;
          scale = 1.25 - 0.25 * (1 - Math.pow(1 - sProg, 2));
        }

        // Rotation: continuous aerodynamic tumble
        const rProg = 1 - Math.pow(1 - t, 1.35);
        const rot = startRot + deltaRot * rProg;

        keyframes.push({
          transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`,
          offset: t,
        });
      }

      const anim = el.animate(keyframes, {
        duration: 1950,
        easing: "linear",
        fill: "forwards",
      });

      activeAnimationRef.current = anim;
      anim.onfinish = () => {
        setStage("fallen");
        activeAnimationRef.current = null;
      };
    }
  }, [stage, fallenCoords]);

  // Auto-recover back to logo after 8.0s of being fallen
  useEffect(() => {
    if (stage === "fallen") {
      autoRecoverTimerRef.current = setTimeout(() => {
        triggerRecover();
      }, 8000);
    }
    return () => {
      if (autoRecoverTimerRef.current) clearTimeout(autoRecoverTimerRef.current);
    };
  }, [stage, triggerRecover]);

  function handleClick(e: MouseEvent) {
    if (!interactive) return;

    // Prevent navigation if logo is nested inside a navigation button or link
    e.stopPropagation();

    if (stage === "falling" || stage === "recovering") {
      return;
    }

    if (stage === "fallen") {
      triggerRecover();
      return;
    }

    const nextCount = clickCount + 1;
    clearAllTimers();

    if (nextCount >= 5) {
      const rect = logoRef.current?.getBoundingClientRect();
      if (!rect) return;

      const socketX = rect.left + rect.width * 0.7135;
      const socketY = rect.top + rect.height * 0.385;
      const socketSize = rect.width * 0.1425;
      // Scale up to a crisp 22px+ star glyph in the viewport (~100%+ bigger than socket)
      const starRenderSize = Math.max(Math.round(socketSize * 2.5), 22);
      const startScale = socketSize / starRenderSize;

      // Target: bottom right of the screen (responsive insets)
      const rightPadding = window.innerWidth < 640 ? 44 : 64;
      const bottomPadding = window.innerHeight < 640 ? 44 : 56;
      const targetX = Math.max(80, window.innerWidth - rightPadding);
      const targetY = Math.max(120, window.innerHeight - bottomPadding);

      const deltaX = targetX - socketX;
      const deltaY = targetY - socketY;

      setFallenCoords({
        startX: socketX,
        startY: socketY,
        starRenderSize,
        startScale,
        targetX,
        targetY,
        deltaX,
        deltaY,
      });

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      setClickCount(5);
      setStage(prefersReducedMotion ? "fallen" : "falling");
    } else {
      setClickCount(nextCount);
      setStage(`dislodge-${nextCount}` as EasterEggStage);

      // Inactivity timeout: if the user stops clicking, return to resting idle
      resetTimerRef.current = setTimeout(() => {
        setStage("idle");
        setClickCount(0);
      }, 2500);
    }
  }

  function getAsteriskClass(currentStage: EasterEggStage) {
    switch (currentStage) {
      case "dislodge-1":
        return "animate-asterisk-dislodge-1";
      case "dislodge-2":
        return "animate-asterisk-dislodge-2";
      case "dislodge-3":
        return "animate-asterisk-dislodge-3";
      case "dislodge-4":
        return "animate-asterisk-dislodge-4";
      default:
        return "";
    }
  }

  const isDetached =
    isClient &&
    (stage === "falling" || stage === "fallen" || stage === "recovering") &&
    fallenCoords !== null;

  return (
    <>
      <span
        ref={logoRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e as unknown as MouseEvent);
          }
        }}
        className={`relative inline-flex items-center justify-center shrink-0 select-none cursor-pointer ${className ?? ""}`}
        style={{ width: size, height: size }}
        title={
          clickCount > 0 && clickCount < 5
            ? clickCount === 4
              ? "Careful, it's about to pop off!"
              : `${clickCount}/5 clicks...`
            : stage === "fallen"
              ? "Click to put the star back!"
              : alt || "Praktis"
        }
        aria-label={alt || "Praktis logo"}
      >
        {stage === "idle" ? (
          <Image
            src="/logo.png"
            alt={alt}
            width={size}
            height={size}
            priority={priority}
            sizes={`${size}px`}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <>
            <Image
              src="/logo-base.png"
              alt={alt}
              width={size}
              height={size}
              priority={priority}
              sizes={`${size}px`}
              className="w-full h-full object-contain pointer-events-none"
            />
            {stage !== "falling" && stage !== "fallen" && stage !== "recovering" && (
              <span
                className={`absolute flex items-center justify-center pointer-events-none ${getAsteriskClass(stage)}`}
                style={{
                  top: "38.5%",
                  left: "71.35%",
                  width: "14.25%",
                  height: "14.25%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <AsteriskIcon className="w-full h-full text-white" />
              </span>
            )}
          </>
        )}
      </span>

      {isDetached &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 pointer-events-none z-[99999]"
            aria-live="polite"
          >
            <div
              ref={portalStarRef}
              role="button"
              tabIndex={stage === "fallen" ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (stage === "fallen") triggerRecover();
              }}
              onKeyDown={(e) => {
                if (stage === "fallen" && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerRecover();
                }
              }}
              className={`fixed pointer-events-auto select-none flex items-center justify-center ${
                stage === "fallen" ? "cursor-pointer group" : "cursor-default"
              }`}
              style={{
                left: fallenCoords.startX,
                top: fallenCoords.startY,
                width: fallenCoords.starRenderSize,
                height: fallenCoords.starRenderSize,
                marginLeft: -fallenCoords.starRenderSize / 2,
                marginTop: -fallenCoords.starRenderSize / 2,
                transformOrigin: "center center",
                transform:
                  stage === "fallen"
                    ? `translate3d(${fallenCoords.deltaX}px, ${fallenCoords.deltaY}px, 0) scale(1.0) rotate(1080deg)`
                    : undefined,
              }}
              title={
                stage === "fallen"
                  ? "Click to snap star back into Praktis logo"
                  : undefined
              }
              aria-label={
                stage === "fallen"
                  ? "Dislodged logo asterisk star. Click to return to logo."
                  : undefined
              }
            >
              {stage === "fallen" && (
                <div className="absolute -top-7 right-0 whitespace-nowrap rounded-full bg-slate-900/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-medium text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Click to return ↺
                </div>
              )}
              <span className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-115">
                <AsteriskIcon
                  size={fallenCoords.starRenderSize}
                  className="w-full h-full text-white fallen-asterisk-glyph"
                />
              </span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
