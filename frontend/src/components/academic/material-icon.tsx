import { FileArchive, FileCode2, FileText, FileVideo, Presentation, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialType } from "@/types/academic";

const MAP: Record<MaterialType, { icon: typeof FileText; tone: string }> = {
  pdf: { icon: FileText, tone: "tone-danger" },
  pptx: { icon: Presentation, tone: "tone-warning" },
  docx: { icon: FileType2, tone: "tone-info" },
  zip: { icon: FileArchive, tone: "tone-muted" },
  ipynb: { icon: FileCode2, tone: "tone-success" },
  video: { icon: FileVideo, tone: "tone-primary" },
};

export function MaterialIcon({ type, className }: { type: MaterialType; className?: string }) {
  const { icon: Icon, tone } = MAP[type];
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md border", tone, className)}>
      <Icon className="size-4" />
    </span>
  );
}
