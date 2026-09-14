"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import MatterNS from "matter-js";
import { swatchAt } from "@/lib/tomatoPalette";
import type { PhysicsConfig, TomatoSwatch } from "@/lib/types";

type MatterLib = {
  Engine: typeof MatterNS.Engine;
  World: typeof MatterNS.World;
  Composite: typeof MatterNS.Composite;
  Bodies: typeof MatterNS.Bodies;
  Body: typeof MatterNS.Body;
  Query: typeof MatterNS.Query;
};

function resolveMatter(): MatterLib | null {
  try {
    const root = MatterNS as unknown as { default?: unknown } & Record<string, unknown>;
    const candidates = [root, root.default];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const pack = candidate as Partial<MatterLib>;
      if (
        typeof pack.Engine?.create === "function" &&
        typeof pack.Bodies?.circle === "function" &&
        typeof pack.Composite?.add === "function" &&
        typeof pack.Body?.setVelocity === "function"
      ) {
        return pack as MatterLib;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export type PhysicsStageHandle = {
  tapAt: (clientX: number, clientY: number) => void;
};

type PhysicsStageProps = {
  physics: PhysicsConfig;
  onFruitTap: (payload: { seed: number; x: number; y: number }) => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  color: string;
};

type TomatoSprite = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  spin: number;
  swatchIndex: number;
  body: MatterNS.Body | null;
};

const WALL = 80;
const MIN_TOMATOES = 18;

function measureStage(host: HTMLElement) {
  const rect = host.getBoundingClientRect();
  return {
    cssWidth: Math.max(rect.width || 0, window.innerWidth || 0, 390),
    cssHeight: Math.max(rect.height || 0, window.innerHeight || 0, 640),
  };
}

function onStage(x: number, y: number, width: number, height: number, pad = 48) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= -pad &&
    y >= -pad &&
    x <= width + pad &&
    y <= height + pad
  );
}

function drawTomato(
  ctx: CanvasRenderingContext2D,
  tomato: TomatoSprite,
  swatch: TomatoSwatch,
) {
  const radius = Math.max(tomato.r, 12);
  ctx.save();
  ctx.translate(tomato.x, tomato.y);
  ctx.rotate(tomato.angle);

  ctx.beginPath();
  ctx.ellipse(4, radius * 0.22, radius * 0.98, radius * 0.86, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40, 0, 8, 0.35)";
  ctx.fill();

  const pulp = ctx.createRadialGradient(
    -radius * 0.28,
    -radius * 0.32,
    radius * 0.12,
    0,
    0,
    radius,
  );
  pulp.addColorStop(0, swatch.spark);
  pulp.addColorStop(0.18, swatch.highlight);
  pulp.addColorStop(0.55, swatch.mid);
  pulp.addColorStop(1, swatch.shadow);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = pulp;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = swatch.shadow;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(
    -radius * 0.28,
    -radius * 0.34,
    radius * 0.32,
    radius * 0.2,
    -0.45,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();

  ctx.save();
  ctx.translate(0, -radius * 0.82);
  ctx.fillStyle = swatch.calyx;
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 0.09, -radius * 0.05, 0, -radius * 0.28);
    ctx.quadraticCurveTo(-radius * 0.09, -radius * 0.05, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#1f4d1c";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#5a2428");
  sky.addColorStop(0.45, "#7a3030");
  sky.addColorStop(1, "#3a1518");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.2,
    20,
    width * 0.5,
    height * 0.25,
    width * 0.75,
  );
  glow.addColorStop(0, "rgba(255, 140, 90, 0.28)");
  glow.addColorStop(1, "rgba(255, 80, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

export const PhysicsStage = forwardRef<PhysicsStageHandle, PhysicsStageProps>(
  function PhysicsStage({ physics, onFruitTap }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tapRef = useRef(onFruitTap);
    const [tomatoCount, setTomatoCount] = useState(0);
    const runtimeRef = useRef<{
      tomatoes: TomatoSprite[];
      particles: Particle[];
      cssWidth: number;
      cssHeight: number;
    }>({ tomatoes: [], particles: [], cssWidth: 390, cssHeight: 640 });

    useLayoutEffect(() => {
      tapRef.current = onFruitTap;
    }, [onFruitTap]);

    const tapAtPoint = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const runtime = runtimeRef.current;
      if (!canvas || runtime.tomatoes.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      let hit: TomatoSprite | undefined;
      let best = Number.POSITIVE_INFINITY;
      for (const tomato of runtime.tomatoes) {
        const dist = Math.hypot(tomato.x - x, tomato.y - y);
        if (dist < tomato.r + 36 && dist < best) {
          best = dist;
          hit = tomato;
        }
      }
      if (!hit) return;

      const swatch = swatchAt(hit.swatchIndex);
      for (let i = 0; i < 18; i += 1) {
        const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
        const speed = 2.4 + Math.random() * 3.6;
        runtime.particles.push({
          x: hit.x,
          y: hit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          life: 1,
          r: 2 + Math.random() * 3.2,
          color: i % 3 === 0 ? swatch.spark : swatch.mid,
        });
      }
      hit.vy -= 4;
      hit.vx += (Math.random() - 0.5) * 3;
      tapRef.current({
        seed: hit.swatchIndex * 13 + Math.round(hit.x + hit.y),
        x: hit.x,
        y: hit.y,
      });
    };

    useImperativeHandle(ref, () => ({
      tapAt: tapAtPoint,
    }));

    useLayoutEffect(() => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let cancelled = false;
      const tomatoes: TomatoSprite[] = [];
      const particles: Particle[] = [];
      const walls: MatterNS.Body[] = [];
      let frame = 0;
      let lastWidth = 0;
      let lastHeight = 0;
      let nudge = 0;
      let matterLive = false;
      let engine: MatterNS.Engine | null = null;
      let world: MatterNS.World | null = null;
      let Matter: MatterLib | null = null;

      runtimeRef.current = {
        tomatoes,
        particles,
        cssWidth: 390,
        cssHeight: 640,
      };

      const count = Math.max(physics.bodyCount || 0, MIN_TOMATOES);

      const syncCount = () => {
        const n = tomatoes.length;
        canvas.dataset.tomatoCount = String(n);
        canvas.dataset.physicsReady = n > 0 ? "1" : "0";
        host.dataset.tomatoCount = String(n);
        setTomatoCount(n);
      };

      const clampTomato = (tomato: TomatoSprite, width: number, height: number) => {
        const minX = tomato.r;
        const maxX = Math.max(tomato.r, width - tomato.r);
        const minY = tomato.r;
        const maxY = Math.max(tomato.r, height - tomato.r);
        if (!Number.isFinite(tomato.x) || !Number.isFinite(tomato.y)) {
          tomato.x = width * 0.5;
          tomato.y = height * 0.35;
          tomato.vx = (Math.random() - 0.5) * 3;
          tomato.vy = -2;
        }
        if (tomato.x < minX) {
          tomato.x = minX;
          tomato.vx = Math.abs(tomato.vx) * 0.7;
        } else if (tomato.x > maxX) {
          tomato.x = maxX;
          tomato.vx = -Math.abs(tomato.vx) * 0.7;
        }
        if (tomato.y > maxY) {
          tomato.y = maxY;
          tomato.vy = -Math.abs(tomato.vy) * 0.45;
          tomato.vx *= 0.98;
        } else if (tomato.y < minY) {
          tomato.y = minY;
          tomato.vy = Math.abs(tomato.vy);
        }
      };

      const spawnSprites = (width: number, height: number) => {
        tomatoes.length = 0;
        const cols = Math.max(3, Math.ceil(Math.sqrt(count * (width / Math.max(height, 1)))));
        const rows = Math.max(3, Math.ceil(count / cols));
        const cellW = width / cols;
        const cellH = Math.max(36, (height - 96) / rows);
        for (let i = 0; i < count; i += 1) {
          const r = 16 + (i % 5) * 2.4;
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = Math.min(
            width - r - 8,
            Math.max(r + 8, cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.28),
          );
          const y = Math.min(
            height - r - 12,
            Math.max(r + 24, 72 + cellH * row + (Math.random() - 0.5) * 18),
          );
          tomatoes.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 3.2,
            vy: -1.2 - Math.random() * 3.5,
            r,
            angle: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.14,
            swatchIndex: i,
            body: null,
          });
        }
        runtimeRef.current.tomatoes = tomatoes;
        syncCount();
      };

      const fit = () => {
        const { cssWidth, cssHeight } = measureStage(host);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
        canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        runtimeRef.current.cssWidth = cssWidth;
        runtimeRef.current.cssHeight = cssHeight;
        tomatoes.forEach((tomato) => clampTomato(tomato, cssWidth, cssHeight));
        return { cssWidth, cssHeight };
      };

      const paint = () => {
        const width = runtimeRef.current.cssWidth;
        const height = runtimeRef.current.cssHeight;
        drawBackground(ctx, width, height);
        tomatoes.forEach((tomato) => {
          drawTomato(ctx, tomato, swatchAt(tomato.swatchIndex));
        });
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const particle = particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.12;
          particle.life -= 0.035;
          if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = Math.max(particle.life, 0);
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        canvas.dataset.tomatoCount = String(tomatoes.length);
        canvas.dataset.physicsReady = tomatoes.length > 0 ? "1" : "0";
      };

      const stepKinematic = (width: number, height: number) => {
        tomatoes.forEach((tomato) => {
          tomato.vy += 0.18;
          tomato.x += tomato.vx;
          tomato.y += tomato.vy;
          tomato.angle += tomato.spin;
          clampTomato(tomato, width, height);
        });
      };

      const layoutWalls = (width: number, height: number) => {
        const lib = Matter;
        const matterWorld = world;
        if (!lib || !matterWorld) return;
        walls.forEach((wall) => {
          try {
            lib.Composite.remove(matterWorld, wall);
          } catch {
            /* ignore */
          }
        });
        walls.length = 0;
        const options = { isStatic: true, restitution: 0.16, friction: 0.35 };
        walls.push(
          lib.Bodies.rectangle(width / 2, height + WALL / 2 - 4, width + WALL * 2, WALL, options),
          lib.Bodies.rectangle(-WALL / 2, height / 2, WALL, height + WALL * 2, options),
          lib.Bodies.rectangle(width + WALL / 2, height / 2, WALL, height + WALL * 2, options),
        );
        lib.Composite.add(matterWorld, walls);
      };

      const attachBodies = (width: number, height: number) => {
        const lib = Matter;
        const matterWorld = world;
        if (!lib || !matterWorld) return;
        layoutWalls(width, height);
        tomatoes.forEach((tomato) => {
          try {
            const body = lib.Bodies.circle(tomato.x, tomato.y, tomato.r, {
              restitution: Math.min(physics.restitution, 0.42),
              friction: 0.16,
              frictionAir: 0.06,
              density: 0.0015,
              label: "tomato",
            });
            lib.Body.setAngularVelocity(body, tomato.spin);
            lib.Body.setVelocity(body, { x: tomato.vx, y: tomato.vy });
            tomato.body = body;
            lib.Composite.add(matterWorld, body);
          } catch {
            tomato.body = null;
          }
        });
      };

      const disableMatter = () => {
        matterLive = false;
        tomatoes.forEach((tomato) => {
          tomato.body = null;
        });
      };

      const tick = () => {
        if (cancelled) return;
        frame = window.requestAnimationFrame(tick);
        const width = runtimeRef.current.cssWidth;
        const height = runtimeRef.current.cssHeight;
        if (tomatoes.length < MIN_TOMATOES) {
          spawnSprites(width, height);
        }
        if (matterLive && Matter && engine) {
          try {
            Matter.Engine.update(engine, 1000 / 60);
            let escaped = 0;
            tomatoes.forEach((tomato) => {
              if (!tomato.body) return;
              const x = tomato.body.position.x;
              const y = tomato.body.position.y;
              if (!onStage(x, y, width, height)) {
                escaped += 1;
                return;
              }
              tomato.x = x;
              tomato.y = y;
              tomato.angle = tomato.body.angle;
              clampTomato(tomato, width, height);
            });
            if (escaped > 8) {
              disableMatter();
              stepKinematic(width, height);
            } else {
              nudge += 1;
              if (tomatoes.length > 0 && nudge % 8 === 0) {
                for (let k = 0; k < 4; k += 1) {
                  const tomato = tomatoes[(nudge + k * 19) % tomatoes.length];
                  if (tomato.body && Matter) {
                    Matter.Body.setVelocity(tomato.body, {
                      x: (Math.random() - 0.5) * 4.5,
                      y: -2.4 - Math.random() * 4.5,
                    });
                  }
                }
              }
            }
          } catch {
            disableMatter();
            stepKinematic(width, height);
          }
        } else {
          stepKinematic(width, height);
          nudge += 1;
          if (tomatoes.length > 0 && nudge % 12 === 0) {
            const tomato = tomatoes[nudge % tomatoes.length];
            tomato.vy = -4 - Math.random() * 5;
            tomato.vx += (Math.random() - 0.5) * 3;
          }
        }
        paint();
      };

      const { cssWidth, cssHeight } = fit();
      spawnSprites(cssWidth, cssHeight);
      paint();

      try {
        Matter = resolveMatter();
        if (Matter) {
          engine = Matter.Engine.create({ enableSleeping: false });
          engine.gravity.x = 0;
          engine.gravity.y = Math.min(physics.gravity, 0.08);
          engine.gravity.scale = 0.001;
          world = engine.world;
          attachBodies(cssWidth, cssHeight);
          matterLive = tomatoes.some((tomato) => tomato.body);
        }
      } catch {
        disableMatter();
        engine = null;
        world = null;
        Matter = null;
      }

      tick();

      const onResize = () => {
        if (cancelled) return;
        const { cssWidth: nextW, cssHeight: nextH } = fit();
        const sizeChanged =
          Math.abs(nextW - lastWidth) > 1 || Math.abs(nextH - lastHeight) > 1;
        lastWidth = nextW;
        lastHeight = nextH;
        if (sizeChanged && matterLive) {
          try {
            layoutWalls(nextW, nextH);
            tomatoes.forEach((tomato) => {
              if (Matter && tomato.body) {
                Matter.Body.setPosition(tomato.body, { x: tomato.x, y: tomato.y });
              }
            });
          } catch {
            disableMatter();
          }
        }
        if (tomatoes.length < MIN_TOMATOES) spawnSprites(nextW, nextH);
        paint();
      };
      lastWidth = cssWidth;
      lastHeight = cssHeight;
      const observer = new ResizeObserver(onResize);
      observer.observe(host);
      window.addEventListener("resize", onResize);

      let pointerStartX = 0;
      let pointerStartY = 0;
      let lastTapAt = 0;
      const requestTap = (clientX: number, clientY: number) => {
        const now = performance.now();
        if (now - lastTapAt < 250) return;
        lastTapAt = now;
        tapAtPoint(clientX, clientY);
      };
      const onPointerDown = (event: PointerEvent) => {
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
      };
      const onPointerUp = (event: PointerEvent) => {
        if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) < 16) {
          requestTap(event.clientX, event.clientY);
        }
      };
      const onClick = (event: MouseEvent) => {
        requestTap(event.clientX, event.clientY);
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("click", onClick);

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("click", onClick);
        observer.disconnect();
        try {
          if (Matter && world && engine) {
            Matter.World.clear(world, false);
            Matter.Engine.clear(engine);
          }
        } catch {
          /* ignore */
        }
      };
    }, [physics.bodyCount, physics.dropRatio, physics.gravity, physics.restitution]);

    return (
      <div
        ref={hostRef}
        className="absolute inset-0 z-0 h-full w-full bg-[#3a1518]"
        data-tomato-count={tomatoCount}
      >
        <canvas
          ref={canvasRef}
          data-physics-stage="1"
          data-tomato-count={tomatoCount}
          data-physics-ready={tomatoCount > 0 ? "1" : "0"}
          className="block h-full w-full cursor-pointer"
        />
      </div>
    );
  },
);
