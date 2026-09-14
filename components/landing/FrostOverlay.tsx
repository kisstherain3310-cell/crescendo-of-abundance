"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

export type FrostOverlayHandle = {
  clear: () => void;
  reset: () => void;
};

type FrostOverlayProps = {
  interactive: boolean;
  onTap: (clientX: number, clientY: number) => void;
  onWipedChange: (wiped: boolean) => void;
};

const BRUSH = 48;
const TAP_THRESHOLD = 10;
const WIPE_DISTANCE = 72;
const WIPE_STAMPS = 16;

function makeNoise() {
  const noise = document.createElement("canvas");
  noise.width = 128;
  noise.height = 128;
  const nctx = noise.getContext("2d");
  if (!nctx) return noise;
  const image = nctx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 210 + Math.random() * 40;
    image.data[i] = v;
    image.data[i + 1] = v + 10;
    image.data[i + 2] = v + 18;
    image.data[i + 3] = 50 + Math.random() * 40;
  }
  nctx.putImageData(image, 0, 0);
  return noise;
}

function paintFrost(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(236, 246, 255, 0.58)");
  gradient.addColorStop(0.45, "rgba(214, 232, 245, 0.62)");
  gradient.addColorStop(1, "rgba(198, 220, 236, 0.66)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = ctx.createPattern(makeNoise(), "repeat") || gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

function brushAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.72)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export const FrostOverlay = forwardRef<FrostOverlayHandle, FrostOverlayProps>(
  function FrostOverlay({ interactive, onTap, onWipedChange }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const onTapRef = useRef(onTap);
    const onWipedChangeRef = useRef(onWipedChange);
    const wipedRef = useRef(false);
    const enoughWipeRef = useRef(false);
    const filledRef = useRef(false);
    const dprRef = useRef(1);
    const interactiveRef = useRef(interactive);

    onTapRef.current = onTap;
    onWipedChangeRef.current = onWipedChange;
    interactiveRef.current = interactive;

    const applyPointerMode = (enabled: boolean) => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      const mode = enabled ? "auto" : "none";
      if (host) host.style.pointerEvents = mode;
      if (canvas) canvas.style.pointerEvents = mode;
    };

    const markWiped = () => {
      if (wipedRef.current) return;
      wipedRef.current = true;
      canvasRef.current?.classList.add("frost-cleared");
      applyPointerMode(false);
      onWipedChangeRef.current(true);
    };

    const clearFrost = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      filledRef.current = true;
      markWiped();
    };

    const resetFrost = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const host = hostRef.current;
      if (!canvas || !ctx || !host) return;
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      paintFrost(ctx, width, height);
      canvas.dataset.frostFilled = "1";
      canvas.classList.remove("frost-cleared");
      filledRef.current = true;
      wipedRef.current = false;
      enoughWipeRef.current = false;
      applyPointerMode(true);
      onWipedChangeRef.current(false);
    };

    useImperativeHandle(ref, () => ({
      clear: clearFrost,
      reset: resetFrost,
    }));

    useEffect(() => {
      if (!interactive) {
        wipedRef.current = true;
        canvasRef.current?.classList.add("frost-cleared");
      }
      applyPointerMode(interactive);
    }, [interactive]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const boot = window.__FROST_BOOT__;
      const existing = boot?.canvas ?? document.getElementById("frost-boot-canvas");
      const canvas =
        existing instanceof HTMLCanvasElement
          ? existing
          : document.createElement("canvas");
      if (!(existing instanceof HTMLCanvasElement)) {
        canvas.id = "frost-boot-canvas";
        canvas.setAttribute("aria-hidden", "true");
      }
      if (canvas.parentElement !== host) {
        host.appendChild(canvas);
      }
      canvasRef.current = canvas;
      filledRef.current = canvas.dataset.frostFilled === "1";
      wipedRef.current = !interactiveRef.current;

      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "30";
      canvas.style.touchAction = "none";
      canvas.style.cursor = "crosshair";
      canvas.style.display = "block";
      canvas.style.userSelect = "none";
      canvas.style.setProperty("-webkit-user-select", "none");
      canvas.style.setProperty("-webkit-touch-callout", "none");

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctxRef.current = ctx;

      const syncSize = (preserve: boolean) => {
        const rect = host.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = Math.max(1, rect.width);
        const cssH = Math.max(1, rect.height);
        const nextW = Math.max(1, Math.floor(cssW * dpr));
        const nextH = Math.max(1, Math.floor(cssH * dpr));
        dprRef.current = dpr;

        if (canvas.width === nextW && canvas.height === nextH) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          return { cssW, cssH };
        }

        let backup: HTMLCanvasElement | null = null;
        if (preserve && canvas.width > 1 && canvas.height > 1) {
          backup = document.createElement("canvas");
          backup.width = canvas.width;
          backup.height = canvas.height;
          const bctx = backup.getContext("2d");
          if (bctx) bctx.drawImage(canvas, 0, 0);
        }

        canvas.width = nextW;
        canvas.height = nextH;
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        if (backup) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.drawImage(backup, 0, 0, nextW, nextH);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { cssW, cssH };
      };

      const ensureFilled = () => {
        const { cssW, cssH } = syncSize(filledRef.current);
        if (filledRef.current || wipedRef.current) return;
        paintFrost(ctx, cssW, cssH);
        canvas.dataset.frostFilled = "1";
        filledRef.current = true;
      };

      ensureFilled();
      applyPointerMode(interactiveRef.current && !wipedRef.current);

      let pointerId: number | null = null;
      let startX = 0;
      let startY = 0;
      let moved = 0;
      let lastX = 0;
      let lastY = 0;
      let strokeCells = 0;

      const localPoint = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      };

      const stamp = (x: number, y: number) => {
        ctx.save();
        ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        brushAt(ctx, x, y, BRUSH);
        ctx.restore();
      };

      const onPointerDown = (event: PointerEvent) => {
        if (wipedRef.current) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        pointerId = event.pointerId;
        try {
          host.setPointerCapture(event.pointerId);
        } catch {
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch {
            /* capture is optional on some browsers */
          }
        }
        const point = localPoint(event);
        startX = point.x;
        startY = point.y;
        lastX = point.x;
        lastY = point.y;
        moved = 0;
        strokeCells = 0;
        stamp(point.x, point.y);
        strokeCells += 1;
      };

      const onPointerMove = (event: PointerEvent) => {
        if (wipedRef.current) return;
        if (pointerId !== event.pointerId) return;
        event.preventDefault();
        const point = localPoint(event);
        const dx = point.x - lastX;
        const dy = point.y - lastY;
        const dist = Math.hypot(dx, dy);
        moved += dist;
        if (dist > 3) {
          const steps = Math.ceil(dist / 8);
          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            stamp(lastX + dx * t, lastY + dy * t);
          }
          strokeCells += steps;
        }
        lastX = point.x;
        lastY = point.y;
        if (moved > WIPE_DISTANCE || strokeCells > WIPE_STAMPS) {
          enoughWipeRef.current = true;
        }
      };

      const endPointer = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        const point = localPoint(event);
        const travel = Math.hypot(point.x - startX, point.y - startY);
        const wasTap = travel < TAP_THRESHOLD && moved < TAP_THRESHOLD;
        pointerId = null;
        try {
          if (host.hasPointerCapture(event.pointerId)) {
            host.releasePointerCapture(event.pointerId);
          }
        } catch {
          /* ignore */
        }
        if (enoughWipeRef.current) {
          markWiped();
        } else if (wasTap) {
          onTapRef.current(event.clientX, event.clientY);
        }
      };

      const pointerOpts: AddEventListenerOptions = { passive: false };
      host.addEventListener("pointerdown", onPointerDown, pointerOpts);
      host.addEventListener("pointermove", onPointerMove, pointerOpts);
      const onLostCapture = (event: PointerEvent) => {
        if (pointerId === event.pointerId) pointerId = null;
      };

      host.addEventListener("pointerup", endPointer);
      host.addEventListener("pointercancel", endPointer);
      host.addEventListener("lostpointercapture", onLostCapture);

      const observer = new ResizeObserver(() => {
        syncSize(filledRef.current || wipedRef.current);
        if (!filledRef.current && !wipedRef.current) {
          const rect = host.getBoundingClientRect();
          paintFrost(ctx, Math.max(1, rect.width), Math.max(1, rect.height));
          canvas.dataset.frostFilled = "1";
          filledRef.current = true;
        }
      });
      observer.observe(host);

      return () => {
        host.removeEventListener("pointerdown", onPointerDown);
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerup", endPointer);
        host.removeEventListener("pointercancel", endPointer);
        host.removeEventListener("lostpointercapture", onLostCapture);
        observer.disconnect();
        if (canvas.parentElement === host && document.body) {
          document.body.appendChild(canvas);
          canvas.style.position = "fixed";
        }
      };
    // Wipe handlers close over refs; this effect must adopt the boot canvas once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={hostRef}
        className={cn(
          "absolute inset-0 z-30 overflow-hidden touch-none select-none",
          interactive ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden
      />
    );
  },
);
