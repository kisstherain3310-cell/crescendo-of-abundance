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

function measureStage(host: HTMLElement) {
  const rect = host.getBoundingClientRect();
  return {
    cssWidth: Math.max(rect.width || 0, window.innerWidth || 0, 390),
    cssHeight: Math.max(rect.height || 0, window.innerHeight || 0, 640),
  };
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

    tapRef.current = onFruitTap;

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

      const Matter = resolveMatter();
      let engine: MatterNS.Engine | null = null;
      let world: MatterNS.World | null = null;
      const tomatoes: TomatoSprite[] = [];
      const particles: Particle[] = [];
      const walls: MatterNS.Body[] = [];
      let frame = 0;
      let lastWidth = 0;
      let lastHeight = 0;
      let nudge = 0;

      runtimeRef.current = {
        tomatoes,
        particles,
        cssWidth: 390,
        cssHeight: 640,
      };

      const count = Math.max(physics.bodyCount || 0, 18);

      const spawnSprites = (width: number, height: number) => {
        if (Matter && world) {
          tomatoes.forEach((tomato) => {
            if (tomato.body) Matter.Composite.remove(world as MatterNS.World, tomato.body);
          });
        }
        tomatoes.length = 0;
        for (let i = 0; i < count; i += 1) {
          const r = 18 + (i % 5) * 2.4;
          const x = r + 16 + Math.random() * Math.max(width - r * 2 - 32, 40);
          const y = 80 + Math.random() * Math.max(height - 180, 160);
          const sprite: TomatoSprite = {
            x,
            y,
            vx: (Math.random() - 0.5) * 4.5,
            vy: -2 - Math.random() * 5,
            r,
            angle: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.18,
            swatchIndex: i,
            body: null,
          };
          if (Matter && world) {
            const body = Matter.Bodies.circle(x, y, r, {
              restitution: physics.restitution,
              friction: 0.1,
              frictionAir: 0.045,
              density: 0.0015,
              label: "tomato",
            });
            Matter.Body.setAngularVelocity(body, sprite.spin);
            Matter.Body.setVelocity(body, { x: sprite.vx, y: sprite.vy });
            sprite.body = body;
            Matter.Composite.add(world, body);
          }
          tomatoes.push(sprite);
        }
        runtimeRef.current.tomatoes = tomatoes;
        setTomatoCount(tomatoes.length);
        canvas.dataset.tomatoCount = String(tomatoes.length);
        canvas.dataset.physicsReady = tomatoes.length > 0 ? "1" : "0";
      };

      const layoutWalls = (width: number, height: number) => {
        if (!Matter || !world) return;
        walls.forEach((wall) => Matter.Composite.remove(world as MatterNS.World, wall));
        walls.length = 0;
        const options = { isStatic: true, restitution: 0.16, friction: 0.35 };
        walls.push(
          Matter.Bodies.rectangle(width / 2, height + WALL / 2 - 4, width + WALL * 2, WALL, options),
          Matter.Bodies.rectangle(-WALL / 2, height / 2, WALL, height + WALL * 2, options),
          Matter.Bodies.rectangle(width + WALL / 2, height / 2, WALL, height + WALL * 2, options),
        );
        Matter.Composite.add(world, walls);
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
        const sizeChanged =
          Math.abs(cssWidth - lastWidth) > 1 || Math.abs(cssHeight - lastHeight) > 1;
        if (sizeChanged || (Matter && walls.length === 0)) {
          lastWidth = cssWidth;
          lastHeight = cssHeight;
          layoutWalls(cssWidth, cssHeight);
          tomatoes.forEach((tomato) => {
            tomato.x = Math.min(cssWidth - tomato.r, Math.max(tomato.r, tomato.x));
            tomato.y = Math.min(cssHeight - tomato.r, Math.max(tomato.r, tomato.y));
            if (Matter && tomato.body) {
              Matter.Body.setPosition(tomato.body, { x: tomato.x, y: tomato.y });
            }
          });
        }
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
      };

      const stepKinematic = (width: number, height: number) => {
        tomatoes.forEach((tomato) => {
          tomato.vy += 0.18;
          tomato.x += tomato.vx;
          tomato.y += tomato.vy;
          tomato.angle += tomato.spin;
          if (tomato.x < tomato.r) {
            tomato.x = tomato.r;
            tomato.vx = Math.abs(tomato.vx) * 0.7;
          } else if (tomato.x > width - tomato.r) {
            tomato.x = width - tomato.r;
            tomato.vx = -Math.abs(tomato.vx) * 0.7;
          }
          if (tomato.y > height - tomato.r) {
            tomato.y = height - tomato.r;
            tomato.vy = -Math.abs(tomato.vy) * 0.45;
            tomato.vx *= 0.98;
          } else if (tomato.y < tomato.r) {
            tomato.y = tomato.r;
            tomato.vy = Math.abs(tomato.vy);
          }
        });
      };

      const tick = () => {
        frame = window.requestAnimationFrame(tick);
        const width = runtimeRef.current.cssWidth;
        const height = runtimeRef.current.cssHeight;
        if (Matter && engine) {
          Matter.Engine.update(engine, 1000 / 60);
          nudge += 1;
          tomatoes.forEach((tomato) => {
            if (!tomato.body) return;
            tomato.x = tomato.body.position.x;
            tomato.y = tomato.body.position.y;
            tomato.angle = tomato.body.angle;
          });
          if (tomatoes.length > 0 && nudge % 6 === 0) {
            for (let k = 0; k < 5; k += 1) {
              const tomato = tomatoes[(nudge + k * 19) % tomatoes.length];
              if (tomato.body) {
                Matter.Body.setVelocity(tomato.body, {
                  x: (Math.random() - 0.5) * 6,
                  y: -3.2 - Math.random() * 6,
                });
              }
            }
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

      try {
        if (Matter) {
          engine = Matter.Engine.create({ enableSleeping: false });
          engine.gravity.x = 0;
          engine.gravity.y = Math.min(physics.gravity, 0.12);
          engine.gravity.scale = 0.001;
          world = engine.world;
        }
      } catch {
        engine = null;
        world = null;
      }

      const { cssWidth, cssHeight } = fit();
      spawnSprites(cssWidth, cssHeight);
      paint();
      tick();

      const observer = new ResizeObserver(() => {
        const before = tomatoes.length;
        fit();
        if (before === 0) spawnSprites(runtimeRef.current.cssWidth, runtimeRef.current.cssHeight);
      });
      observer.observe(host);
      window.addEventListener("resize", fit);

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
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", fit);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("click", onClick);
        observer.disconnect();
        if (Matter && world && engine) {
          Matter.World.clear(world, false);
          Matter.Engine.clear(engine);
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
