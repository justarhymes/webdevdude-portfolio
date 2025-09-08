"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

function usePrefersReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    ref.current = !!mq?.matches;
    const onChange = () => (ref.current = !!mq?.matches);
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);
  return ref;
}

/**
 * SlideDown
 * - Animates the container's HEIGHT (0 → content height), which *physically pushes* content below.
 * - Also fades & translates the inner content for a clearer "dropping in" feel.
 * - Respects prefers-reduced-motion (no animation).
 */
export default function SlideDown({
  children,
  duration = 380, // ms
  easing = "cubic-bezier(0.22, 0.61, 0.36, 1)", // easeOutCubic-ish
  offset = 24, // px, visual inner slide distance
}: {
  children: React.ReactNode;
  duration?: number;
  easing?: string;
  offset?: number;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const reduceRef = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // No-animation path (accessibility)
    if (reduceRef.current) {
      outer.style.height = "auto";
      outer.style.overflow = "visible";
      setOpened(true);
      return;
    }

    // Prepare outer for height animation
    outer.style.overflow = "hidden";
    outer.style.height = "0px";
    outer.style.willChange = "height";
    outer.style.transition = `height ${duration}ms ${easing}`;

    // Start on next frame so browsers catch the initial 0px
    const startId = requestAnimationFrame(() => {
      const h = inner.getBoundingClientRect().height;
      outer.style.height = `${h}px`;
      setOpened(true);
    });

    // While the animation runs, track size changes (e.g., image loads)
    let ended = false;
    const ro = new ResizeObserver(() => {
      if (ended) return;
      const h = inner.getBoundingClientRect().height;
      outer.style.height = `${h}px`;
    });

    ro.observe(inner);

    const onEnd = () => {
      if (ended) return;
      ended = true;
      outer.style.height = "auto";
      outer.style.overflow = "visible";
      outer.style.willChange = "auto";
      outer.removeEventListener("transitionend", onEnd);
      ro.disconnect();
    };

    outer.addEventListener("transitionend", onEnd);

    return () => {
      cancelAnimationFrame(startId);
      outer.removeEventListener("transitionend", onEnd);
      ro.disconnect();
    };
  }, [duration, easing, reduceRef]);

  return (
    <div ref={outerRef}>
      <div
        ref={innerRef}
        style={
          reduceRef.current
            ? undefined
            : {
                opacity: opened ? 1 : 0,
                transform: opened
                  ? "translateY(0)"
                  : `translateY(-${offset}px)`,
                transition: `opacity ${Math.max(
                  120,
                  duration - 80
                )}ms ${easing}, transform ${Math.max(
                  120,
                  duration - 80
                )}ms ${easing}`,
                willChange: "opacity, transform",
              }
        }>
        {children}
      </div>
    </div>
  );
}
