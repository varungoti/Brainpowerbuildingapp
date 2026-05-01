import type { PrintableGuide } from "../../lib/printables/guideTypes";
import { PrintableGuidePreview } from "./PrintableGuidePreview";

export function PrintableGuideDocument({ guide }: { guide: PrintableGuide }) {
  return <PrintableGuidePreview guide={guide} />;
}
