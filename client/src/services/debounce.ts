export function debounce<T extends (...a: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...a: Parameters<T>) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = undefined;
      fn(...a);
    }, ms);
  };
}
