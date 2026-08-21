/**
 * Disables browser value-stepping on <input type="number"> elements:
 * - Mouse wheel no longer changes the value (the input blurs so the page scrolls normally)
 * - ArrowUp / ArrowDown no longer increment or decrement (values are typed manually only)
 *
 * Mounted once at app startup. Returns a cleanup function.
 */
export function disableNumberInputStepping(): () => void {
  const handleWheel = (event: WheelEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      target.type === 'number' &&
      document.activeElement === target
    ) {
      // Blur instead of preventDefault: the first wheel tick releases focus,
      // subsequent ticks scroll the page naturally.
      target.blur();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement &&
      active.type === 'number' &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault();
    }
  };

  document.addEventListener('wheel', handleWheel, { passive: true });
  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', handleKeyDown);
  };
}
