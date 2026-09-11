"use client";

import { useEffect, useRef } from "react";

type Point3 = { x: number; y: number; z: number; edge: number };
type ProjectedPoint = Point3 & { sx: number; sy: number; depth: number };

const RINGS = 12;
const SEGMENTS = 36;
const RADIUS = 2.65;
const TARGET_FRAME_MS = 1000 / 30;

function surfaceHeight(x: number, y: number, r: number, time: number) {
  const envelope = Math.pow(Math.max(0, 1 - Math.pow(r / RADIUS, 2.25)), 1.25);
  const saddle = (x * x - y * y) * 0.16;
  const wave = Math.sin(x * 1.48 + time * 0.28) * Math.cos(y * 1.18 - time * 0.19) * 0.72;
  const radial = Math.cos(r * 2.05 - time * 0.22) * 0.28;
  const crown = Math.exp(-r * r * 0.5) * 0.72;
  return (wave + radial + saddle + crown) * envelope;
}

function project(point: Point3, width: number, height: number, time: number): ProjectedPoint {
  const yaw = -0.56 + Math.sin(time * 0.1) * 0.055;
  const pitch = 0.76 + Math.cos(time * 0.09) * 0.025;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;

  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y2 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  const camera = 9.4;
  const perspective = camera / Math.max(4.8, camera - z2);
  const scale = Math.min(width / 7.35, height / 6.55);

  return {
    ...point,
    sx: width * 0.545 + x1 * scale * perspective,
    sy: height * 0.505 + y2 * scale * perspective,
    depth: z2,
  };
}

function drawOrbit(ctx: CanvasRenderingContext2D, width: number, height: number, rx: number, ry: number, rotation: number, alpha: number) {
  ctx.save();
  ctx.translate(width * 0.545, height * 0.515);
  ctx.rotate(rotation);
  ctx.strokeStyle = `rgba(62, 110, 190, ${alpha})`;
  ctx.lineWidth = 0.9;
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function buildMesh(width: number, height: number, time: number) {
  const rings: ProjectedPoint[][] = [];
  for (let ring = 0; ring <= RINGS; ring += 1) {
    const r = (ring / RINGS) * RADIUS;
    const line: ProjectedPoint[] = [];
    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const angle = (segment / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const edge = Math.max(0, 1 - ring / RINGS);
      const z = surfaceHeight(x, y, r, time);
      line.push(project({ x, y, z, edge }, width, height, time));
    }
    rings.push(line);
  }
  return rings;
}

function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.clearRect(0, 0, width, height);

  const halo = ctx.createRadialGradient(width * 0.56, height * 0.48, 0, width * 0.56, height * 0.48, Math.min(width, height) * 0.58);
  halo.addColorStop(0, "rgba(91, 174, 255, 0.15)");
  halo.addColorStop(0.42, "rgba(117, 130, 239, 0.065)");
  halo.addColorStop(0.76, "rgba(127, 218, 238, 0.025)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  drawOrbit(ctx, width, height, width * 0.37, height * 0.105, -0.18, 0.16);
  drawOrbit(ctx, width, height, width * 0.30, height * 0.155, 0.52, 0.105);
  drawOrbit(ctx, width, height, width * 0.255, height * 0.19, -0.72, 0.075);

  const mesh = buildMesh(width, height, time);
  const cells: Array<{ points: ProjectedPoint[]; depth: number; height: number; edge: number }> = [];

  for (let ring = 0; ring < RINGS; ring += 1) {
    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const next = (segment + 1) % SEGMENTS;
      const quad = [mesh[ring][segment], mesh[ring][next], mesh[ring + 1][next], mesh[ring + 1][segment]];
      cells.push({
        points: quad,
        depth: quad.reduce((sum, point) => sum + point.depth, 0) / 4,
        height: quad.reduce((sum, point) => sum + point.z, 0) / 4,
        edge: quad.reduce((sum, point) => sum + point.edge, 0) / 4,
      });
    }
  }

  cells.sort((a, b) => a.depth - b.depth);
  for (const cell of cells) {
    const h = Math.max(0, Math.min(1, (cell.height + 1.35) / 2.7));
    const depth = Math.max(0, Math.min(1, (cell.depth + 2.4) / 4.8));
    const red = Math.round(55 + h * 76 + depth * 12);
    const green = Math.round(118 + h * 78 + depth * 20);
    const blue = Math.round(204 + h * 42);
    const alpha = (0.07 + h * 0.14 + depth * 0.04) * (0.52 + cell.edge * 0.48);
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(cell.points[0].sx, cell.points[0].sy);
    for (let index = 1; index < cell.points.length; index += 1) ctx.lineTo(cell.points[index].sx, cell.points[index].sy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalCompositeOperation = "screen";
  const highlight = ctx.createRadialGradient(width * 0.56, height * 0.43, 0, width * 0.56, height * 0.43, Math.min(width, height) * 0.24);
  highlight.addColorStop(0, "rgba(255,255,255,0.24)");
  highlight.addColorStop(0.35, "rgba(105,202,255,0.08)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  ctx.setLineDash([]);
  ctx.lineWidth = Math.max(0.65, Math.min(1.05, width / 980));

  for (let ring = 2; ring <= RINGS; ring += 2) {
    const alpha = 0.08 + (1 - ring / RINGS) * 0.17;
    ctx.strokeStyle = `rgba(46, 102, 181, ${alpha})`;
    ctx.beginPath();
    mesh[ring].forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.sx, point.sy);
      else ctx.lineTo(point.sx, point.sy);
    });
    ctx.closePath();
    ctx.stroke();
  }

  for (let segment = 0; segment < SEGMENTS; segment += 4) {
    ctx.strokeStyle = "rgba(91, 143, 216, 0.145)";
    ctx.beginPath();
    for (let ring = 1; ring <= RINGS; ring += 1) {
      const point = mesh[ring][segment];
      if (ring === 1) ctx.moveTo(point.sx, point.sy);
      else ctx.lineTo(point.sx, point.sy);
    }
    ctx.stroke();
  }

  for (let index = 0; index < 7; index += 1) {
    const angle = time * (0.105 + index * 0.0045) + (index / 7) * Math.PI * 2;
    const x = width * 0.545 + Math.cos(angle) * width * 0.34;
    const y = height * 0.515 + Math.sin(angle) * height * 0.096;
    const radius = 1.5 + (index % 3) * 0.55;
    const dot = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, radius * 2.5);
    dot.addColorStop(0, "rgba(255,255,255,0.98)");
    dot.addColorStop(0.28, "rgba(75,165,235,0.88)");
    dot.addColorStop(1, "rgba(75,165,235,0)");
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function AnimatedMathSurface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let previousFrame = 0;
    let visible = true;
    let stopped = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(330, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(context, width, height, performance.now() / 1000);
    };

    const animate = (timestamp: number) => {
      if (stopped) return;
      frame = window.requestAnimationFrame(animate);
      if (!visible || document.hidden || reducedMotion.matches || timestamp - previousFrame < TARGET_FRAME_MS) return;
      previousFrame = timestamp;
      drawScene(context, width, height, timestamp / 1000);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; }, { rootMargin: "120px" });
    intersectionObserver.observe(container);

    const redraw = () => drawScene(context, width, height, performance.now() / 1000);
    document.addEventListener("visibilitychange", redraw);
    reducedMotion.addEventListener("change", redraw);
    resize();
    frame = window.requestAnimationFrame(animate);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", redraw);
      reducedMotion.removeEventListener("change", redraw);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[390px] w-full overflow-hidden sm:min-h-[460px] lg:min-h-[550px]" aria-label="Animated three-dimensional mathematical surface" role="img">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_47%,rgba(69,144,236,0.07),transparent_32%),radial-gradient(circle_at_77%_36%,rgba(133,102,238,0.04),transparent_27%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-[var(--ax-canvas)] to-transparent" />
      <div className="pointer-events-none absolute right-[8%] top-[14%] font-serif text-[clamp(13px,1.25vw,18px)] italic text-[#6687bd]/48">∇ · F = 0</div>
      <div className="pointer-events-none absolute left-[13%] top-[18%] font-serif text-[clamp(12px,1.15vw,17px)] italic text-[#7192c5]/42">e<sup>iπ</sup> + 1 = 0</div>
      <div className="pointer-events-none absolute bottom-[16%] left-[9%] font-serif text-[clamp(13px,1.35vw,20px)] italic text-[#5b76b6]/46">∫<sub>a</sub><sup>b</sup> f(x) dx</div>
      <div className="pointer-events-none absolute bottom-[12%] right-[6%] font-serif text-[clamp(11px,1.1vw,16px)] italic text-[#7588b6]/40">ds² = dx² + dy² + dz²</div>
      <div className="pointer-events-none absolute right-[4%] top-[48%] font-serif text-[clamp(11px,1vw,15px)] italic text-[#657fb7]/42">d/dx sin x = cos x</div>
    </div>
  );
}
