import { useStdout } from "ink";

export const OUTER_PAD = 3;

export function useInnerWidth(): number {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 100;
  return Math.max(40, cols - OUTER_PAD * 2);
}
