"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Pixels of track that scroll each second — keeps speed steady regardless of how many copies. */
const SCROLL_PX_PER_SECOND = 36;

function renderCards(items: ReactNode[], keyPrefix: string) {
  return items.map((child, itemIndex) => {
    const content = isValidElement(child)
      ? cloneElement(child as ReactElement, {
          key: `${keyPrefix}-${itemIndex}`,
        })
      : child;

    return (
      <div
        key={`${keyPrefix}-wrap-${itemIndex}`}
        className="w-[min(15.5rem,72vw)] shrink-0"
        data-doctor-card
      >
        {content}
      </div>
    );
  });
}

export function DoctorsSlider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const halfRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Cap copies so we don't multiply ~2MB doctor photos into dozens of <Image>s.
  const [copies, setCopies] = useState(2);
  const [halfWidth, setHalfWidth] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count === 0) return;

    const update = () => {
      const card = container.querySelector<HTMLElement>("[data-doctor-card]");
      const cardWidth = card?.offsetWidth ?? 248;
      const gap = 16;
      const unit = cardWidth + gap;
      const viewport = container.offsetWidth;
      // Each marquee half must be wider than the viewport so no empty stretch appears.
      const needed = Math.ceil((viewport * 2) / (unit * count));
      setCopies(Math.min(2, Math.max(1, needed)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const half = halfRef.current;
    if (!half) return;

    const measure = () => setHalfWidth(half.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(half);
    return () => observer.disconnect();
  }, [copies, count]);

  const sequence = useMemo(() => {
    return Array.from({ length: copies }, (_, copyIndex) =>
      renderCards(items, `c${copyIndex}`),
    ).flat();
  }, [copies, items]);

  const durationSeconds =
    halfWidth > 0 ? Math.max(halfWidth / SCROLL_PX_PER_SECOND, 20) : 48;

  if (count === 0) return null;

  const shouldAnimate = !reduceMotion && halfWidth > 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={cn(
          "flex w-max",
          shouldAnimate && "animate-doctors-marquee",
          paused && "animation-paused",
        )}
        style={
          shouldAnimate
            ? {
                animationDuration: `${durationSeconds}s`,
                ["--doctors-marquee-distance" as string]: `${halfWidth}px`,
              }
            : undefined
        }
      >
        <div ref={halfRef} className="flex shrink-0 gap-4 pr-4">
          {sequence}
        </div>
        {shouldAnimate && (
          <div className="flex shrink-0 gap-4 pr-4" aria-hidden>
            {Array.from({ length: copies }, (_, copyIndex) =>
              renderCards(items, `d${copyIndex}`),
            ).flat()}
          </div>
        )}
      </div>
    </div>
  );
}
