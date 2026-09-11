"use client";

import { useEffect, useRef } from "react";

type FrostOverlayProps = {
  onTap: (clientX: number, clientY: number) => void;
  onWipedChange: (wiped: boolean) => void;
};

const BRUSH = 46;
const TAP_THRESHOLD = 10;

function brushAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(0.65, "rgba(0,0,0,0.55)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function FrostOverlay({ onTap, onWipedChange }: FrostOverlayProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onTapRef = useRef(onTap);
  const onWipedChangeRef = useRef(onWipedChange);
  onTapRef.current = onTap;
  onWipedChangeRef.current = onWipedChange;

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

    const fillIfNeeded = () => {
      if (canvas.dataset.frostFilled === "1") return;
      const ctxFill = canvas.getContext("2d");
      if (!ctxFill) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctxFill.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gradient = ctxFill.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "rgba(236, 246, 255, 0.58)");
      gradient.addColorStop(1, "rgba(198, 220, 236, 0.66)");
      ctxFill.globalCompositeOperation = "source-over";
      ctxFill.fillStyle = gradient;
      ctxFill.fillRect(0, 0, rect.width, rect.height);
      canvas.dataset.frostFilled = "1";
    };
    fillIfNeeded();

    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "30";
    canvas.style.touchAction = "none";
    canvas.style.cursor = "crosshair";
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let wiped = false;
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
      ctx.globalCompositeOperation = "destination-out";
      brushAt(ctx, x, y, BRUSH);
      ctx.globalCompositeOperation = "source-over";
    };

    const markWiped = () => {
      if (wiped) return;
      wiped = true;
      onWipedChangeRef.current(true);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      const point = localPoint(event);
      startX = point.x;
      startY = point.y;
      lastX = point.x;
      lastY = point.y;
      moved = 0;
      stamp(point.x, point.y);
      strokeCells += 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const point = localPoint(event);
      const dx = point.x - lastX;
      const dy = point.y - lastY;
      const dist = Math.hypot(dx, dy);
      moved += dist;
      if (dist > 4) {
        const steps = Math.ceil(dist / 10);
        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          stamp(lastX + dx * t, lastY + dy * t);
        }
        strokeCells += steps;
      }
      lastX = point.x;
      lastY = point.y;
      if (moved > 28 || strokeCells > 8) markWiped();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      const point = localPoint(event);
      const travel = Math.hypot(point.x - startX, point.y - startY);
      if (travel < TAP_THRESHOLD && moved < TAP_THRESHOLD) {
        onTapRef.current(event.clientX, event.clientY);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-30 overflow-hidden"
      aria-hidden
    />
  );
}
