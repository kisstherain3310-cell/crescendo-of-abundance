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

function drawTomato(
  ctx: CanvasRenderingContext2D,
  body: TomatoBody,
  swatch: TomatoSwatch,
) {
  const radius = body.circleRadius ?? 16;
  const { x, y } = body.position;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.angle);

  ctx.beginPath();
  ctx.ellipse(3, radius * 0.18, radius * 0.95, radius * 0.82, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fill();

  const pulp = ctx.createRadialGradient(
    -radius * 0.32,
    -radius * 0.34,
    radius * 0.08,
    0,
    0,
    radius,
  );
  pulp.addColorStop(0, swatch.highlight);
  pulp.addColorStop(0.42, swatch.mid);
  pulp.addColorStop(1, swatch.shadow);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = pulp;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    -radius * 0.3,
    -radius * 0.36,
    radius * 0.28,
    radius * 0.16,
    -0.45,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fill();

  ctx.fillStyle = swatch.calyx;
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.12);
    ctx.quadraticCurveTo(radius * 0.16, -radius * 0.52, 0, -radius * 0.72);
    ctx.quadraticCurveTo(-radius * 0.1, -radius * 0.4, 0, -radius * 0.12);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#2a1014");
  sky.addColorStop(0.45, "#43151a");
  sky.addColorStop(1, "#14080b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.15,
    20,
    width * 0.5,
    height * 0.2,
    width * 0.7,
  );
  glow.addColorStop(0, "rgba(255, 92, 64, 0.22)");
  glow.addColorStop(1, "rgba(255, 92, 64, 0)");
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

    useImperativeHandle(ref, () => ({
      tapAt(clientX, clientY) {
        const canvas = canvasRef.current;
        const runtime = runtimeRef.current;
        if (!canvas || !runtime) return;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const hits = Matter.Query.point(runtime.tomatoes, { x, y });
        const hit = hits[0] as TomatoBody | undefined;
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
      },
    }));

    useEffect(() => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = Matter.Engine.create({
        gravity: { x: 0, y: physics.gravity, scale: 0.001 },
        enableSleeping: true,
      });
      const world = engine.world;
      const runner = Matter.Runner.create();
      const tomatoes: TomatoBody[] = [];
      const particles: Particle[] = [];
      const walls: Matter.Body[] = [];

      runtimeRef.current = {
        tomatoes,
        particles,
        cssWidth: 0,
        cssHeight: 0,
      };

      const clearWalls = () => {
        if (walls.length === 0) return;
        Matter.World.remove(world, walls);
        walls.length = 0;
      };

      const layoutWalls = (width: number, height: number) => {
        clearWalls();
        const options = { isStatic: true, restitution: 0.12, friction: 0.4 };
        walls.push(
          Matter.Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, options),
          Matter.Bodies.rectangle(-WALL / 2, height / 2, WALL, height + WALL * 2, options),
          Matter.Bodies.rectangle(width + WALL / 2, height / 2, WALL, height + WALL * 2, options),
          Matter.Bodies.rectangle(width / 2, -WALL / 2, width + WALL * 2, WALL, {
            ...options,
            restitution: 0.02,
          }),
        );
        Matter.World.add(world, walls);
      };

      const spawnTomatoes = (width: number, height: number) => {
        tomatoes.splice(0, tomatoes.length).forEach((body) => {
          Matter.World.remove(world, body);
        });
        const count = physics.bodyCount;
        for (let i = 0; i < count; i += 1) {
          const radius = 11 + (i % 7) * 1.4 + (i % 3);
          const body = Matter.Bodies.circle(
            24 + Math.random() * Math.max(width - 48, 40),
            -40 - Math.random() * height * 0.55,
            radius,
            {
              restitution: physics.restitution,
              friction: 0.18,
              frictionAir: 0.012,
              density: 0.0018,
              label: "tomato",
            },
          ) as TomatoBody;
          body.swatchIndex = i;
          Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);
          tomatoes.push(body);
        }
        Matter.World.add(world, tomatoes);
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
        layoutWalls(cssWidth, cssHeight);
        tomatoes.forEach((body) => {
          const radius = body.circleRadius ?? 16;
          const x = Math.min(cssWidth - radius, Math.max(radius, body.position.x));
          const y = Math.min(cssHeight - radius, Math.max(radius, body.position.y));
          Matter.Body.setPosition(body, { x, y });
        });
        return { cssWidth, cssHeight };
      };

      const first = fit();
      spawnTomatoes(first.cssWidth, first.cssHeight);
      Matter.Runner.run(runner, engine);

      let frame = 0;
      const tick = () => {
        frame = window.requestAnimationFrame(tick);
        const width = runtimeRef.current?.cssWidth ?? first.cssWidth;
        const height = runtimeRef.current?.cssHeight ?? first.cssHeight;
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
      tick();

      const onResize = () => {
        fit();
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        Matter.Runner.stop(runner);
        Matter.World.clear(world, false);
        Matter.Engine.clear(engine);
        runtimeRef.current = null;
      };
    }, [physics.bodyCount, physics.gravity, physics.restitution]);

    return (
      <div ref={hostRef} className="absolute inset-0 z-0 bg-[#14080b]">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    );
  },
);
