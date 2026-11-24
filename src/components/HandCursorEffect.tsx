import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [role="tab"], input, select, textarea, label, [data-interactive], td.cursor-pointer';

export function HandCursorEffect() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const handSvgRef = useRef<SVGSVGElement | null>(null);
  const burstLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!finePointer) return;

    const root = document.documentElement;
    root.classList.add('custom-hand-cursor');

    const cursorEl = cursorRef.current;
    const svgEl = handSvgRef.current;
    const burstLayer = burstLayerRef.current;
    if (!cursorEl || !svgEl || !burstLayer) {
      return () => {
        root.classList.remove('custom-hand-cursor');
      };
    }

    let x = -100;
    let y = -100;
    let visible = false;
    let isHover = false;
    let isPressed = false;
    let rafId = 0;

    const applyTransform = () => {
      rafId = 0;
      if (!visible) {
        cursorEl.style.opacity = '0';
        return;
      }
      cursorEl.style.opacity = '1';
      // Hotspot aligned to tip of index finger (x - 10, y - 3)
      cursorEl.style.transform = `translate3d(${x - 10}px, ${y - 3}px, 0)`;

      const scale = isPressed ? 0.84 : isHover ? 1.08 : 1;
      const rotate = isPressed ? -10 : isHover ? -3 : 0;
      const translateY = isPressed ? 2 : 0;
      svgEl.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
    };

    const scheduleRender = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyTransform);
      }
    };

    const spawnClickBurst = (cx: number, cy: number, compact = false) => {
      if (reducedMotion || !burstLayer) return;

      const burst = document.createElement('div');
      burst.className = 'hand-click-burst';
      burst.style.left = `${cx}px`;
      burst.style.top = `${cy}px`;
      if (compact) {
        burst.setAttribute('data-compact', 'true');
      }

      const ringPrimary = document.createElement('span');
      ringPrimary.className = 'hand-click-ring';
      burst.appendChild(ringPrimary);

      if (!compact) {
        const ringSecondary = document.createElement('span');
        ringSecondary.className = 'hand-click-ring-secondary';
        burst.appendChild(ringSecondary);

        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
          const spark = document.createElement('span');
          spark.className = 'hand-click-spark';
          const angle = i * (360 / sparkCount) + 15;
          spark.style.setProperty('--spark-angle', `${angle}deg`);
          burst.appendChild(spark);
        }
      }

      burstLayer.appendChild(burst);
      window.setTimeout(() => {
        burst.remove();
      }, 480);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
        return;
      }
      x = e.clientX;
      y = e.clientY;
      visible = true;

      const target = e.target as HTMLElement | null;
      const interactive = Boolean(target?.closest(INTERACTIVE_SELECTOR));
      if (interactive !== isHover) {
        isHover = interactive;
        cursorEl.setAttribute('data-hover', interactive ? 'true' : 'false');
      }
      scheduleRender();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
        return;
      }
      x = e.clientX;
      y = e.clientY;
      visible = true;
      isPressed = true;
      cursorEl.setAttribute('data-pressed', 'true');
      scheduleRender();
      spawnClickBurst(e.clientX, e.clientY, false);
    };

    const onPointerUp = () => {
      if (!isPressed) return;
      isPressed = false;
      cursorEl.setAttribute('data-pressed', 'false');
      scheduleRender();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTypingTarget =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      if (!isTypingTarget) return;
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        if (visible && x > 0 && y > 0) {
          spawnClickBurst(x, y, true);
        } else {
          const rect = activeEl.getBoundingClientRect();
          spawnClickBurst(rect.left + Math.min(rect.width - 16, 36), rect.top + rect.height / 2, true);
        }
      }
    };

    const onMouseLeave = () => {
      visible = false;
      isPressed = false;
      cursorEl.setAttribute('data-pressed', 'false');
      scheduleRender();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      root.classList.remove('custom-hand-cursor');
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <>
      <div
        ref={burstLayerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
      />
      <div
        ref={cursorRef}
        aria-hidden="true"
        data-hover="false"
        data-pressed="false"
        className="hand-cursor-wrapper pointer-events-none fixed left-0 top-0 z-[9999] opacity-0 transition-opacity duration-150 will-change-transform"
      >
        <svg
          ref={handSvgRef}
          width="30"
          height="32"
          viewBox="0 0 28 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="origin-[10px_3px] transition-transform duration-100 ease-out drop-shadow-[0_3px_8px_rgba(7,23,11,0.28)]"
        >
          {/* Crisp white pointing hand silhouette */}
          <path
            d="M10.2 2.2C9.1 2.2 8.2 3.1 8.2 4.2V14.4L6.3 12.6C5.4 11.7 4 11.8 3.2 12.7C2.5 13.5 2.5 14.8 3.3 15.6L8.4 21.1C9.5 22.4 11.1 23.2 12.8 23.2H17.3C20.2 23.2 22.5 20.9 22.5 18V12.2C22.5 11.1 21.6 10.2 20.5 10.2C20 10.2 19.6 10.4 19.2 10.7V10.1C19.2 9 18.3 8.1 17.2 8.1C16.6 8.1 16.1 8.3 15.8 8.7V8.4C15.8 7.3 14.9 6.4 13.8 6.4C13.2 6.4 12.6 6.7 12.2 7.2V4.2C12.2 3.1 11.3 2.2 10.2 2.2Z"
            fill="#FFFFFF"
            stroke="#07170B"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle finger crease details */}
          <path
            d="M12.2 10.4V14.2M15.8 10.7V14.2M19.2 11.4V14.4"
            stroke="#07170B"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>
    </>
  );
}
