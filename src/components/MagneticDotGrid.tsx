import { useEffect, useRef } from 'react';

interface MagneticDotGridProps {
  theme: 'light' | 'dark';
}

interface GridVertex {
  dx: number;
  dy: number;
  strength: number;
}

interface ClickWave {
  x: number;
  y: number;
  startTime: number;
}

export function MagneticDotGrid({ theme }: MagneticDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spacing = 38;
    const magneticRadius = 175;
    const maxPull = 14;
    const upwardSpeedPxPerSec = 14; // gentle upward scroll

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0;
    let rows = 0;
    let offsetX = 0;
    let vertices: GridVertex[] = [];
    let scrollY = 0;
    const waves: ClickWave[] = [];

    const pointer = {
      tx: -9999,
      ty: -9999,
      x: -9999,
      y: -9999,
      active: false,
    };

    const buildGrid = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / spacing) + 3;
      rows = Math.ceil(height / spacing) + 4;
      offsetX = ((width % spacing) - spacing) / 2;

      vertices = Array.from({ length: rows * cols }, () => ({
        dx: 0,
        dy: 0,
        strength: 0,
      }));
    };

    const getEdgeFade = (y: number) => {
      if (height <= 120) return 1;
      const topFade = Math.min(1, Math.max(0.15, (y + 20) / 70));
      const bottomFade = Math.min(1, Math.max(0.15, (height - y + 10) / 95));
      return Math.min(topFade, bottomFade);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = themeRef.current === 'dark';

      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(162, 223, 32, 0.035)' : 'rgba(7, 23, 11, 0.03)';
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = c * spacing + offsetX;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = 0; r < rows; r++) {
        const y = (r - 1) * spacing;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.fillStyle = isDark ? 'rgba(162, 223, 32, 0.08)' : 'rgba(7, 23, 11, 0.07)';
      for (let r = 0; r < rows; r++) {
        const y = (r - 1) * spacing;
        for (let c = 0; c < cols; c++) {
          const x = c * spacing + offsetX;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    buildGrid();

    if (reducedMotion) {
      drawStatic();
      const ro = new ResizeObserver(() => {
        buildGrid();
        drawStatic();
      });
      if (canvas.parentElement) ro.observe(canvas.parentElement);
      return () => ro.disconnect();
    }

    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // Advance upward grid drift seamlessly
      scrollY += upwardSpeedPxPerSec * dt;
      while (scrollY >= spacing) {
        scrollY -= spacing;
        // Shift vertex displacement rows up by 1 so magnetic offsets stay anchored to moving cells
        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols; c++) {
            const dst = vertices[r * cols + c];
            const src = vertices[(r + 1) * cols + c];
            dst.dx = src.dx;
            dst.dy = src.dy;
            dst.strength = src.strength;
          }
        }
        const lastRowOffset = (rows - 1) * cols;
        for (let c = 0; c < cols; c++) {
          vertices[lastRowOffset + c].dx = 0;
          vertices[lastRowOffset + c].dy = 0;
          vertices[lastRowOffset + c].strength = 0;
        }
      }

      ctx.clearRect(0, 0, width, height);
      const isDark = themeRef.current === 'dark';

      // Smooth pointer tracking
      if (pointer.active) {
        if (pointer.x < -5000) {
          pointer.x = pointer.tx;
          pointer.y = pointer.ty;
        } else {
          pointer.x += (pointer.tx - pointer.x) * 0.2;
          pointer.y += (pointer.ty - pointer.y) * 0.2;
        }
      }

      // Prune finished click waves
      for (let w = waves.length - 1; w >= 0; w--) {
        if (now - waves[w].startTime > 780) {
          waves.splice(w, 1);
        }
      }

      // Subtle magnetic aura around pointer
      if (pointer.active && pointer.x > -1000) {
        const grad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          magneticRadius
        );
        if (isDark) {
          grad.addColorStop(0, 'rgba(162, 223, 32, 0.07)');
          grad.addColorStop(0.55, 'rgba(162, 223, 32, 0.02)');
          grad.addColorStop(1, 'rgba(162, 223, 32, 0)');
        } else {
          grad.addColorStop(0, 'rgba(162, 223, 32, 0.1)');
          grad.addColorStop(0.55, 'rgba(0, 129, 32, 0.025)');
          grad.addColorStop(1, 'rgba(0, 129, 32, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(
          pointer.x - magneticRadius,
          pointer.y - magneticRadius,
          magneticRadius * 2,
          magneticRadius * 2
        );
      }

      // Update vertex magnetic displacements
      const posX = new Float32Array(rows * cols);
      const posY = new Float32Array(rows * cols);

      for (let r = 0; r < rows; r++) {
        const oy = (r - 1) * spacing - scrollY;
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const ox = c * spacing + offsetX;
          const v = vertices[idx];

          let targetDx = 0;
          let targetDy = 0;
          let strength = 0;

          if (pointer.active) {
            const dx = pointer.x - ox;
            const dy = pointer.y - oy;
            const dist = Math.hypot(dx, dy);

            if (dist < magneticRadius && dist > 0.001) {
              const t = 1 - dist / magneticRadius;
              strength = t * t;
              const pull = strength * maxPull;
              targetDx += (dx / dist) * pull;
              targetDy += (dy / dist) * pull;
            }
          }

          for (let w = 0; w < waves.length; w++) {
            const wave = waves[w];
            const elapsed = now - wave.startTime;
            const waveRadius = elapsed * 0.46;
            const dx = ox - wave.x;
            const dy = oy - wave.y;
            const dist = Math.hypot(dx, dy);
            const band = Math.abs(dist - waveRadius);
            if (band < 46 && dist > 0.001) {
              const waveStrength = (1 - band / 46) * (1 - elapsed / 780);
              targetDx += (dx / dist) * waveStrength * 11;
              targetDy += (dy / dist) * waveStrength * 11;
              strength = Math.max(strength, waveStrength * 0.85);
            }
          }

          v.dx += (targetDx - v.dx) * 0.18;
          v.dy += (targetDy - v.dy) * 0.18;
          v.strength += (strength - v.strength) * 0.22;

          posX[idx] = ox + v.dx;
          posY[idx] = oy + v.dy;
        }
      }

      // 1. Draw base deformed grid lines in a single fast path
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark
        ? 'rgba(162, 223, 32, 0.038)'
        : 'rgba(7, 23, 11, 0.032)';
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const rowBase = r * cols;
        ctx.moveTo(posX[rowBase], posY[rowBase]);
        for (let c = 1; c < cols; c++) {
          ctx.lineTo(posX[rowBase + c], posY[rowBase + c]);
        }
      }
      for (let c = 0; c < cols; c++) {
        ctx.moveTo(posX[c], posY[c]);
        for (let r = 1; r < rows; r++) {
          const idx = r * cols + c;
          ctx.lineTo(posX[idx], posY[idx]);
        }
      }
      ctx.stroke();

      // 2. Highlight grid segments near the magnetic cursor
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const s = vertices[idx].strength;
          if (s <= 0.04) continue;

          const x1 = posX[idx];
          const y1 = posY[idx];
          const edgeFade = getEdgeFade(y1);

          if (c + 1 < cols) {
            const rightIdx = idx + 1;
            const segStrength = Math.max(s, vertices[rightIdx].strength);
            const alpha = segStrength * (isDark ? 0.18 : 0.14) * edgeFade;
            ctx.strokeStyle = isDark
              ? `rgba(152, 255, 0, ${alpha.toFixed(3)})`
              : `rgba(0, 129, 32, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(posX[rightIdx], posY[rightIdx]);
            ctx.stroke();
          }

          if (r + 1 < rows) {
            const downIdx = idx + cols;
            const segStrength = Math.max(s, vertices[downIdx].strength);
            const alpha = segStrength * (isDark ? 0.18 : 0.14) * edgeFade;
            ctx.strokeStyle = isDark
              ? `rgba(152, 255, 0, ${alpha.toFixed(3)})`
              : `rgba(0, 129, 32, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(posX[downIdx], posY[downIdx]);
            ctx.stroke();
          }
        }
      }

      // 3. Draw intersection dots & subtle magnetic cursor links
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = posX[idx];
          const y = posY[idx];
          const s = vertices[idx].strength;
          const edgeFade = getEdgeFade(y);
          const radius = 1.45 + s * 1.9;

          if (s > 0.04) {
            const alpha = ((isDark ? 0.11 : 0.09) + s * 0.44) * edgeFade;
            ctx.fillStyle = isDark
              ? `rgba(152, 255, 0, ${alpha.toFixed(3)})`
              : `rgba(0, 129, 32, ${alpha.toFixed(3)})`;

            if (pointer.active && Math.hypot(pointer.x - x, pointer.y - y) < 82) {
              ctx.lineWidth = 0.85;
              ctx.strokeStyle = isDark
                ? `rgba(162, 223, 32, ${(s * 0.12 * edgeFade).toFixed(3)})`
                : `rgba(0, 129, 32, ${(s * 0.09 * edgeFade).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(pointer.x, pointer.y);
              ctx.stroke();
            }
          } else {
            const breath =
              0.5 + 0.5 * Math.sin(now * 0.0014 + x * 0.014 + y * 0.014);
            const baseAlpha = ((isDark ? 0.07 : 0.055) + breath * 0.025) * edgeFade;
            ctx.fillStyle = isDark
              ? `rgba(162, 223, 32, ${baseAlpha.toFixed(3)})`
              : `rgba(7, 23, 11, ${baseAlpha.toFixed(3)})`;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(render);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;

      if (lx >= -60 && lx <= rect.width + 60 && ly >= -60 && ly <= rect.height + 60) {
        pointer.tx = lx;
        pointer.ty = ly;
        pointer.active = true;
      } else {
        pointer.active = false;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      if (lx >= 0 && lx <= rect.width && ly >= 0 && ly <= rect.height) {
        waves.push({ x: lx, y: ly, startTime: performance.now() });
      }
    };

    const onMouseLeave = () => {
      pointer.active = false;
    };

    const ro = new ResizeObserver(() => {
      buildGrid();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full z-0"
    />
  );
}
