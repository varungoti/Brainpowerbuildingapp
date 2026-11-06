// The printable scenarios must not complete activities or execute confetti.
export default function unexpectedConfetti() { throw new Error("Unexpected confetti in printable UI tests"); }
