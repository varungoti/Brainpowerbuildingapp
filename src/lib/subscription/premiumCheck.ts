export function checkIsPremium(credits: number): boolean {
  if (credits > 0) return true;
  return false;
}
