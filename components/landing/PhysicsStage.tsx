"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Matter from "matter-js";
import { swatchAt } from "@/lib/tomatoPalette";
import type { PhysicsConfig, TomatoSwatch } from "@/lib/types";

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
  maxLife: number;
  r: number;
  color: string;
};

type TomatoBody = Matter.Body & {
  swatchIndex: number;
};

const WALL = 80;

function bodyRadius(body: Matter.Body) {
  return body.circleRadius ?? (body.bounds.max.x - body.bounds.min.x) / 2;
}

function drawTomato(
  ctx: CanvasRenderingContext2D,
  body: TomatoBody,
  swatch: TomatoSwatch,
) {
  const radius = Math.max(bodyRadius(body), 12);
  const { x, y } = body.position;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.angle);

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
    const runtimeRef = useRef<{
      tomatoes: TomatoBody[];
      particles: Particle[];
      cssWidth: number;
      cssHeight: number;
    } | null>(null);

    tapRef.current = onFruitTap;

    const tapAtPoint = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const runtime = runtimeRef.current;
      if (!canvas || !runtime) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const hits = Matter.Query.point(runtime.tomatoes, { x, y });
      let hit = hits[0] as TomatoBody | undefined;
      if (!hit) {
        let best = Number.POSITIVE_INFINITY;
        for (const body of runtime.tomatoes) {
          const radius = bodyRadius(body) + 36;
          const dist = Math.hypot(body.position.x - x, body.position.y - y);
          if (dist < radius && dist < best) {
            best = dist;
            hit = body;
          }
        }
      }
      if (!hit) return;

      const swatch = swatchAt(hit.swatchIndex);
      for (let i = 0; i < 18; i += 1) {
        const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
        const speed = 2.4 + Math.random() * 3.6;
        runtime.particles.push({
          x: hit.position.x,
          y: hit.position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          life: 1,
          maxLife: 1,
          r: 2 + Math.random() * 3.2,
          color: i % 3 === 0 ? swatch.spark : swatch.mid,
        });
      }
      Matter.Body.applyForce(hit, hit.position, {
        x: (Math.random() - 0.5) * 0.012,
        y: -0.018,
      });
      tapRef.current({
        seed: hit.id + hit.swatchIndex * 13,
        x: hit.position.x,
        y: hit.position.y,
      });
    };

    useImperativeHandle(ref, () => ({
      tapAt: tapAtPoint,
    }));

    useEffect(() => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = Matter.Engine.create({ enableSleeping: false });
      engine.gravity.x = 0;
      engine.gravity.y = Math.min(physics.gravity, 0.12);
      engine.gravity.scale = 0.001;
      const world = engine.world;
      const tomatoes: TomatoBody[] = [];
      const particles: Particle[] = [];
      const walls: Matter.Body[] = [];
      let spawned = false;
      let frame = 0;
      let lastTick = 0;
      let lastWidth = 0;
      let lastHeight = 0;
      let nudge = 0;

      runtimeRef.current = {
        tomatoes,
        particles,
        cssWidth: 0,
        cssHeight: 0,
      };

      const clearWalls = () => {
        walls.forEach((wall) => Matter.Composite.remove(world, wall));
        walls.length = 0;
      };

      const layoutWalls = (width: number, height: number) => {
        clearWalls();
        const options = { isStatic: true, restitution: 0.16, friction: 0.35 };
        walls.push(
          Matter.Bodies.rectangle(
            width / 2,
            height + WALL / 2 - 4,
            width + WALL * 2,
            WALL,
            options,
          ),
          Matter.Bodies.rectangle(-WALL / 2, height / 2, WALL, height + WALL * 2, options),
          Matter.Bodies.rectangle(
            width + WALL / 2,
            height / 2,
            WALL,
            height + WALL * 2,
            options,
          ),
        );
        Matter.Composite.add(world, walls);
      };

      const spawnTomatoes = (width: number, height: number) => {
        tomatoes.splice(0, tomatoes.length).forEach((body) => {
          Matter.Composite.remove(world, body);
        });
        const count = physics.bodyCount;
        for (let i = 0; i < count; i += 1) {
          const radius = 18 + (i % 5) * 2.4;
          const x = radius + 16 + Math.random() * Math.max(width - radius * 2 - 32, 40);
          const y = 90 + Math.random() * Math.max(height - 150, 120);
          const body = Matter.Bodies.circle(x, y, radius, {
            restitution: physics.restitution,
            friction: 0.1,
            frictionAir: 0.045,
            density: 0.0015,
            label: "tomato",
          }) as TomatoBody;
          body.swatchIndex = i;
          Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);
          Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 4.5,
            y: -2 - Math.random() * 5,
          });
          tomatoes.push(body);
        }
        Matter.Composite.add(world, tomatoes);
      };

      const fit = () => {
        const rect = host.getBoundingClientRect();
        const cssWidth = Math.max(1, rect.width);
        const cssHeight = Math.max(1, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(cssWidth * dpr);
        canvas.height = Math.floor(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (runtimeRef.current) {
          runtimeRef.current.cssWidth = cssWidth;
          runtimeRef.current.cssHeight = cssHeight;
        }
        const sizeChanged =
          Math.abs(cssWidth - lastWidth) > 1 || Math.abs(cssHeight - lastHeight) > 1;
        if (sizeChanged || walls.length === 0) {
          lastWidth = cssWidth;
          lastHeight = cssHeight;
          layoutWalls(cssWidth, cssHeight);
          tomatoes.forEach((body) => {
            const radius = bodyRadius(body);
            const x = Math.min(cssWidth - radius, Math.max(radius, body.position.x));
            const y = Math.min(cssHeight - radius, Math.max(radius, body.position.y));
            Matter.Body.setPosition(body, { x, y });
          });
        }
        return { cssWidth, cssHeight };
      };

      const tick = (now: number) => {
        frame = window.requestAnimationFrame(tick);
        if (spawned) {
          Matter.Engine.update(engine, 1000 / 60);
          nudge += 1;
          if (tomatoes.length > 0 && nudge % 6 === 0) {
            for (let k = 0; k < 5; k += 1) {
              const body = tomatoes[(nudge + k * 19) % tomatoes.length];
              Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 6,
                y: -3.2 - Math.random() * 6,
              });
            }
          }
        }
        const width = runtimeRef.current?.cssWidth ?? 1;
        const height = runtimeRef.current?.cssHeight ?? 1;
        drawBackground(ctx, width, height);
        tomatoes.forEach((body) => {
          drawTomato(ctx, body, swatchAt(body.swatchIndex));
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

      const tryStart = () => {
        const { cssWidth, cssHeight } = fit();
        if (spawned || cssWidth < 40 || cssHeight < 40) return;
        spawnTomatoes(cssWidth, cssHeight);
        spawned = true;
        lastTick = performance.now();
        if (!frame) tick(lastTick);
      };

      tryStart();
      const observer = new ResizeObserver(() => {
        if (!spawned) {
          tryStart();
          return;
        }
        fit();
      });
      observer.observe(host);
      window.addEventListener("resize", tryStart);

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
        const travel = Math.hypot(
          event.clientX - pointerStartX,
          event.clientY - pointerStartY,
        );
        if (travel < 16) {
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
        window.removeEventListener("resize", tryStart);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("click", onClick);
        observer.disconnect();
        Matter.World.clear(world, false);
        Matter.Engine.clear(engine);
        runtimeRef.current = null;
      };
    }, [physics.bodyCount, physics.dropRatio, physics.gravity, physics.restitution]);

    return (
      <div ref={hostRef} className="absolute inset-0 z-0 bg-[#14080b]">
        <canvas ref={canvasRef} className="block h-full w-full cursor-pointer" />
      </div>
    );
  },
);
