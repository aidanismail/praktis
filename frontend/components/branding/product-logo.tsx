"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
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
  plank: {
    left: number;
    notchX: number;
    placement: "above" | "below";
    anchor: number;
  };
};

const PLANK_PHRASE = "Brooks was here......... so was Bagas...... so was Aidan";
const PLANK_WIDTH = 188;
const PLANK_GAP = 12;
const PLANK_HEIGHT_ESTIMATE = 72;

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

    const bow = Math.min(80, Math.max(35, (ryStart - ryEnd) * 0.15));

    for (let i = 0; i <= RECOVER_STEPS; i++) {
      const p = i / RECOVER_STEPS;
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

      const hPop = Math.min(70, Math.max(40, Math.abs(deltaY) * 0.085));
      const safeDisc = Math.max(0, 4 * hPop * hPop + 4 * hPop * Math.max(20, deltaY));
      const b = -2 * hPop - Math.sqrt(safeDisc);
      const a = deltaY - b;

      const startRot = 38;
      const targetRot = 1080;
      const deltaRot = targetRot - startRot;

      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS; // 0 to 1

        const xProgress = 1 - Math.pow(1 - t, 1.35);
        const x = deltaX * xProgress;

        const y = a * t * t + b * t;

        let scale = 1.0;
        if (t < 0.18) {
          const sProg = t / 0.18;
          scale = startScale + (1.25 - startScale) * sProg;
        } else {
          const sProg = (t - 0.18) / 0.82;
          scale = 1.25 - 0.25 * (1 - Math.pow(1 - sProg, 2));
        }

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
      const starRenderSize = Math.max(Math.round(socketSize * 2.5), 22);
      const startScale = socketSize / starRenderSize;

      const rightPadding = window.innerWidth < 640 ? 44 : 64;
      const bottomPadding = window.innerHeight < 640 ? 44 : 56;
      const targetX = Math.max(80, window.innerWidth - rightPadding);
      const targetY = Math.max(120, window.innerHeight - bottomPadding);

      const deltaX = targetX - socketX;
      const deltaY = targetY - socketY;

      const logoCenterX = rect.left + rect.width / 2;
      const plankLeft = Math.min(
        Math.max(8, logoCenterX - PLANK_WIDTH / 2),
        Math.max(8, window.innerWidth - PLANK_WIDTH - 8),
      );
      const fitsBelow =
        rect.bottom + PLANK_GAP + PLANK_HEIGHT_ESTIMATE <= window.innerHeight;

      setFallenCoords({
        startX: socketX,
        startY: socketY,
        starRenderSize,
        startScale,
        targetX,
        targetY,
        deltaX,
        deltaY,
        plank: {
          left: plankLeft,
          notchX: Math.min(Math.max(16, logoCenterX - plankLeft), PLANK_WIDTH - 16),
          placement: fitsBelow ? "below" : "above",
          anchor: fitsBelow
            ? rect.bottom + PLANK_GAP
            : window.innerHeight - (rect.top - PLANK_GAP),
        },
      });

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      setClickCount(5);
      setStage(prefersReducedMotion ? "fallen" : "falling");
    } else {
      setClickCount(nextCount);
      setStage(`dislodge-${nextCount}` as EasterEggStage);

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
        {...(interactive
          ? {
              role: "button",
              tabIndex: 0,
              "aria-label": alt || "Praktis logo",
              onClick: handleClick,
              onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(e as unknown as MouseEvent);
                }
              }
            }
          : {})}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${
          interactive ? "cursor-pointer" : ""
        } ${className ?? ""}`}
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
                  Click to return
                </div>
              )}
              <span className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-115">
                <AsteriskIcon
                  size={fallenCoords.starRenderSize}
                  className="w-full h-full text-white fallen-asterisk-glyph"
                />
              </span>
            </div>
            {(stage === "falling" || stage === "fallen") && (
              <div
                role="status"
                className="fixed pointer-events-none"
                style={{
                  left: fallenCoords.plank.left,
                  width: PLANK_WIDTH,
                  ...(fallenCoords.plank.placement === "below"
                    ? { top: fallenCoords.plank.anchor }
                    : { bottom: fallenCoords.plank.anchor }),
                }}
              >
                <div
                  className={`logo-plank logo-plank--${fallenCoords.plank.placement}`}
                  style={
                    {
                      "--notch-x": `${fallenCoords.plank.notchX}px`,
                      transformOrigin: `${fallenCoords.plank.notchX}px ${
                        fallenCoords.plank.placement === "below" ? "0%" : "100%"
                      }`,
                    } as CSSProperties
                  }
                >
                  <p className="logo-plank-text">{PLANK_PHRASE}</p>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
