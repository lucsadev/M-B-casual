/**
 * useImageDrag — Infinite swipe/drag gesture for a sliding image carousel.
 *
 * Works with mouse drag on desktop and one-finger swipe on mobile browsers via
 * Pointer Events. Horizontal drags past a threshold flip to the next/previous
 * slide; vertical drags are ignored so the page can keep scrolling (the
 * container should set `touch-action: pan-y`).
 *
 * Infinite loop via cloned slides: the caller renders a track of
 * `[clone(last), slide0, ..., slideN-1, clone(first)]` and positions it with
 * `trackIndex`. Swiping into a clone animates normally, then on `transitionend`
 * the hook swaps to the equivalent real slide without a transition, so the
 * cycle never visibly jumps backward.
 */
import { useEffect, useRef, useState } from 'react';

/** Fraction of the container width needed to flip to the adjacent slide. */
const THRESHOLD_RATIO = 0.25;
/** Maximum horizontal pull (as a fraction of width) while a slide is dragged. */
const MAX_DRAG_RATIO = 0.4;
/** Fallback container width used only in test environments with no layout. */
const FALLBACK_WIDTH = 320;

interface UseImageDragOptions {
  /** Total number of real slides/images. */
  count: number;
  /** Currently active logical slide index (0..count-1). */
  index: number;
  /** Called with the new logical index when the slide changes. */
  onIndexChange: (next: number) => void;
}

export function useImageDrag({
  count,
  index,
  onIndexChange,
}: UseImageDragOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ startX: number; active: boolean } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Position inside the cloned track:
  // 0 = clone of the last slide, 1..count = real slides, count+1 = clone of the first.
  const [trackIndex, setTrackIndexState] = useState(1);
  const [noTransition, setNoTransition] = useState(true);
  const trackIndexRef = useRef(1);

  function setTrackIndex(next: number) {
    trackIndexRef.current = next;
    setTrackIndexState(next);
  }

  // When the logical index changes from outside (thumbnail click, slug reset),
  // snap the track to the matching position without animation.
  useEffect(() => {
    const expected = index + 1;
    if (trackIndexRef.current !== expected) {
      setNoTransition(true);
      setTrackIndex(expected);
    }
  }, [index]);

  // When a swipe animates into a clone (wrap), transitionend swaps to the
  // equivalent real slide with no transition and reports the logical index.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onTransitionEnd() {
      const current = trackIndexRef.current;
      if (current === count + 1) {
        setNoTransition(true);
        setTrackIndex(1);
        onIndexChange(0);
      } else if (current === 0) {
        setNoTransition(true);
        setTrackIndex(count);
        onIndexChange(count - 1);
      }
    }
    el.addEventListener('transitionend', onTransitionEnd);
    return () => el.removeEventListener('transitionend', onTransitionEnd);
  }, [count, onIndexChange]);

  function measureWidth(): number {
    const w = containerRef.current?.clientWidth ?? 0;
    return w > 0 ? w : FALLBACK_WIDTH;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (count <= 1) return;
    gestureRef.current = { startX: e.clientX, active: true };
    setDx(0);
    setDragging(true);
    // Keep receiving move/up events even if the pointer leaves the element.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function handlePointerMove(e: React.PointerEvent) {
    const gesture = gestureRef.current;
    if (!gesture?.active) return;
    const width = measureWidth();
    const max = width * MAX_DRAG_RATIO;
    const raw = e.clientX - gesture.startX;
    setDx(Math.max(-max, Math.min(max, raw)));
  }

  function handlePointerUp(e: React.PointerEvent) {
    const gesture = gestureRef.current;
    if (!gesture?.active) return;
    gestureRef.current = null;

    const width = measureWidth();
    const delta = e.clientX - gesture.startX;
    const threshold = width * THRESHOLD_RATIO;

    let next = index;
    if (delta <= -threshold) next = index + 1;
    else if (delta >= threshold) next = index - 1;

    setDragging(false);

    if (next === index) {
      setDx(0);
      return;
    }

    setNoTransition(false); // animate toward the target slide
    if (next === -1 || next === count) {
      // Wrap: slide into the clone; transitionend completes the cycle.
      setTrackIndex(trackIndexRef.current + (next - index));
    } else {
      setTrackIndex(next + 1);
      onIndexChange(next);
    }
    setDx(0);
  }

  function handlePointerCancel() {
    gestureRef.current = null;
    setDragging(false);
    setDx(0);
  }

  return {
    containerRef,
    dx,
    dragging,
    trackIndex,
    noTransition,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
