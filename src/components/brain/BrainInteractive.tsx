import React from "react";
import { BrainCanvas } from "@/components/brain/BrainCanvas";

type Props = {
  scores: Record<string, number>;
  className?: string;
};

export function BrainInteractive({ scores, className = "" }: Props) {
  return <BrainCanvas scores={scores} className={className} />;
}
