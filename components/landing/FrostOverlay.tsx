"use client";

import { useEffect, useRef } from "react";
import { isFrostUiTarget } from "@/lib/frostUi";

type FrostOverlayProps = {
  revealed: boolean;
  onTap: (clientX: number, clientY: number) => void;
  onRevealed: () => void;
};

const BRUSH = 56;
const TAP_THRESHOLD = 10;
const FROST_ALPHA = 18;

function fillFrost(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(236, 246, 255, 0.4)");
  gradient.addColorStop(0.45, "rgba(214, 232, 245, 0.44)");
  gradient.addColorStop(1, "rgba(198, 220, 236, 0.48)");
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const noise = document.createElement("canvas");
  noise.width = 128;
  noise.height = 128;
  const nctx = noise.getContext("2d");
  if (nctx) {
    const image = nctx.createImageData(128, 128);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 210 + Math.random() * 40;
      image.data[i] = v;
      image.data[i + 1] = v + 10;
      image.data[i + 2] = v + 18;
      image.data[i + 3] = 50 + Math.random() * 40;
    }
    nctx.putImageData(image, 0, 0);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = ctx.createPattern(noise, "repeat") || gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}

function brushAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.85)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function teardownBootLayer() {
  const boot = window.__FROST_BOOT__;
  boot?.canvas?.remove();
  document.getElementById("frost-boot-canvas")?.remove();
  document.getElementById("frost-boot-ui")?.remove();
  if (boot) {
    boot.canvas = undefined;
  }
}

export function FrostOverlay({
  revealed,
  onTap,
  onRevealed,
}: FrostOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTapRef = useRef(onTap);
  const onRevealedRef = useRef(onRevealed);
  const revealedRef = useRef(revealed);
  const runtimeRef = useRef<{ clearAll: () => void } | null>(null);

  useEffect(() => {
    onTapRef.current = onTap;
    onRevealedRef.current = onRevealed;
    revealedRef.current = revealed;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let wiped = Boolean(window.__FROST_BOOT__?.cleared);
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let dpr = 1;

    const markRevealed = () => {
      if (wiped) return;
      wiped = true;
      onRevealedRef.current();
    };

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width || window.innerWidth);
      const cssHeight = Math.max(1, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { cssWidth, cssHeight };
    };

    const clearAll = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      canvas.style.pointerEvents = "none";
      canvas.style.opacity = "0";
      canvas.style.visibility = "hidden";
      canvas.style.zIndex = "-1";
      teardownBootLayer();
      markRevealed();
    };

    const boot = window.__FROST_BOOT__;
    if (revealedRef.current || boot?.cleared) {
      syncSize();
      clearAll();
    } else {
      const { cssWidth, cssHeight } = syncSize();
      if (boot?.canvas && boot.filled) {
        ctx.drawImage(boot.canvas, 0, 0, cssWidth, cssHeight);
      } else {
        fillFrost(ctx, cssWidth, cssHeight);
      }
    }
    teardownBootLayer();

    runtimeRef.current = { clearAll };

    const localPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const hasFrostAt = (x: number, y: number) => {
      if (canvas.width < 2 || canvas.height < 2) return false;
      const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(x * dpr)));
      const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(y * dpr)));
      return ctx.getImageData(px, py, 1, 1).data[3] > FROST_ALPHA;
    };

    const stamp = (x: number, y: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      brushAt(ctx, x, y, BRUSH);
      ctx.restore();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (revealedRef.current || isFrostUiTarget(event.target)) return;
      const point = localPoint(event);
      if (!hasFrostAt(point.x, point.y)) {
        pointerId = event.pointerId;
        startX = point.x;
        startY = point.y;
        lastX = point.x;
        lastY = point.y;
        moved = 0;
        return;
      }
      pointerId = event.pointerId;
      startX = point.x;
      startY = point.y;
      lastX = point.x;
      lastY = point.y;
      moved = 0;
      stamp(point.x, point.y);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
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
      }
      lastX = point.x;
      lastY = point.y;
      if (moved > 20) markRevealed();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      if (revealedRef.current || isFrostUiTarget(event.target)) return;
      const point = localPoint(event);
      const travel = Math.hypot(point.x - startX, point.y - startY);
      if (travel < TAP_THRESHOLD && moved < TAP_THRESHOLD) {
        onTapRef.current(event.clientX, event.clientY);
      }
    };

    const onCleared = () => {
      clearAll();
    };

    // Paint-only canvas: wipe from the document so chrome stays clickable
    // even if a leftover boot canvas is stacked above the React tree.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("frost-skip", onCleared);
    window.addEventListener("frost:cleared", onCleared);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      clearAll();
    }

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("frost-skip", onCleared);
      window.removeEventListener("frost:cleared", onCleared);
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!revealed) return;
    runtimeRef.current?.clearAll();
  }, [revealed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${
        revealed ? "invisible z-0 opacity-0" : "z-10"
      }`}
      style={revealed ? { display: "none" } : undefined}
      aria-hidden
    />
  );
}
