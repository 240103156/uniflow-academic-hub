import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Info, Loader2, RotateCcw, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCourses, useImportSyllabus } from "@/hooks/use-academic";
import { getAcademicService } from "@/services";
import { fmtBytes, fmtDateTime } from "@/lib/format";
import { DemoBadge, TypeBadge } from "@/components/academic/badges";
import { PageIntro, Panel } from "@/components/academic/states";
import { cn } from "@/lib/utils";
import type { SyllabusScanResult } from "@/types/academic";

export const Route = createFileRoute("/syllabus")({
  head: () => ({
    meta: [
      { title: "Syllabus Scanner — UniFlow" },
      { name: "description", content: "Upload a course syllabus, review detected deadlines and add them to your calendar." },
      { property: "og:title", content: "Syllabus Scanner — UniFlow" },
      { property: "og:description", content: "Upload a course syllabus, review detected deadlines and add them to your calendar." },
    ],
  }),
  component: SyllabusPage,
});

type Decision = "pending" | "confirmed" | "rejected";
type Phase = "idle" | "processing" | "review" | "done" | "error";

function SyllabusPage() {
  const { data: courses = [] } = useCourses();
  const importer = useImportSyllabus();
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyllabusScanResult | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined | null) {
    if (!f) return;
    setError(null);
    if (!(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setPhase("error"); setError("Only PDF files are supported."); return;
    }
    setFile(f);
    setPhase("idle");
  }

  async function scan() {
    if (!file || !courseId) return;
    setPhase("processing"); setError(null);
    try {
      const r = await getAcademicService().scanSyllabus(file, courseId);
      setResult(r);
      setDecisions(Object.fromEntries(r.events.map((e) => [e.id, "pending" as Decision])));
      setPhase("review");
    } catch (e) {
      setPhase("error"); setError(e instanceof Error ? e.message : "Scan failed");
    }
  }

  async function addToCalendar() {
    if (!result) return;
    const events = result.events.filter((e) => decisions[e.id] === "confirmed");
    try {
      const created = await importer.mutateAsync({ courseId: result.courseId, events });
      setImported(created.length); setPhase("done");
      toast.success(`${created.length} items added to calendar`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  }

  function reset() { setFile(null); setResult(null); setPhase("idle"); setError(null); setDecisions({}); }

  const confirmed = Object.values(decisions).filter((d) => d === "confirmed").length;
  const setAll = (d: Decision) => result && setDecisions(Object.fromEntries(result.events.map((e) => [e.id, d])));

  return (
    <div className="space-y-6">
      <PageIntro title="Syllabus Scanner" description="Turn a syllabus into calendar deadlines. Review every item before it's added." />
      <div className="flex items-start gap-3 rounded-lg border tone-warning p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="text-foreground">Demo mode: the PDF is validated but <strong>not read</strong>. Extracted events below are sample results so you can try the review flow. Real PDF parsing plugs into the same pipeline later.</p>
      </div>

      {phase !== "review" && phase !== "done" && (
        <Panel title="1. Choose course and upload" bodyClassName="p-5 space-y-4">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select a course" /></SelectTrigger>
            <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>)}</SelectContent>
          </Select>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={cn("flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/40", dragging && "border-primary bg-accent/40")}
          >
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <FileUp className="size-6 text-muted-foreground" />
            {file ? (
              <p className="mt-3 text-sm font-medium">{file.name} <span className="font-normal text-muted-foreground">· {fmtBytes(file.size)}</span></p>
            ) : (
              <><p className="mt-3 text-sm font-medium">Drop a PDF syllabus here or click to browse</p><p className="mt-1 text-xs text-muted-foreground">PDF only, up to 20 MB</p></>
            )}
          </div>
          {phase === "error" && error && <p className="flex items-center gap-2 text-sm text-destructive"><XCircle className="size-4" />{error}</p>}
          <div className="flex gap-2">
            <Button onClick={scan} disabled={!file || !courseId || phase === "processing"}>
              {phase === "processing" ? <><Loader2 className="size-4 animate-spin" /> Processing…</> : "Scan syllabus"}
            </Button>
            {file && <Button variant="ghost" onClick={reset} disabled={phase === "processing"}>Clear</Button>}
          </div>
          {phase === "processing" && (
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>Validating file… done</p><p>Generating sample extraction for {courses.find((c) => c.id === courseId)?.name}…</p>
              <div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/2 animate-pulse rounded-full bg-primary" /></div>
            </div>
          )}
        </Panel>
      )}

      {phase === "review" && result && (
        <Panel title={<span className="flex items-center gap-2">2. Review detected events <DemoBadge>Sample results</DemoBadge></span>}
          description={`${result.fileName} · ${courses.find((c) => c.id === result.courseId)?.name}`}
          action={<div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setAll("confirmed")}>Confirm all</Button><Button size="sm" variant="ghost" onClick={() => setAll("rejected")}>Reject all</Button></div>}>
          <Table>
            <TableHeader><TableRow><TableHead className="w-10 pl-5" /><TableHead>Event</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="hidden md:table-cell">Confidence</TableHead><TableHead className="text-right pr-5">Decision</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.events.map((e) => {
                const d = decisions[e.id];
                return (
                  <TableRow key={e.id} className={cn(d === "rejected" && "opacity-50")}>
                    <TableCell className="pl-5"><Checkbox checked={d === "confirmed"} onCheckedChange={(c) => setDecisions((s) => ({ ...s, [e.id]: c ? "confirmed" : "pending" }))} aria-label={`Confirm ${e.title}`} /></TableCell>
                    <TableCell><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.sourceText}</p></TableCell>
                    <TableCell><TypeBadge type={e.type} /></TableCell>
                    <TableCell className="tabular whitespace-nowrap">{fmtDateTime(e.date)}</TableCell>
                    <TableCell className="hidden md:table-cell"><span className={cn("tabular text-xs", e.confidence < 0.8 ? "text-warning" : "text-muted-foreground")}>{Math.round(e.confidence * 100)}%</span></TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant={d === "confirmed" ? "default" : "outline"} className="size-7" onClick={() => setDecisions((s) => ({ ...s, [e.id]: "confirmed" }))} aria-label="Confirm"><CheckCircle2 className="size-3.5" /></Button>
                        <Button size="icon" variant={d === "rejected" ? "destructive" : "outline"} className="size-7" onClick={() => setDecisions((s) => ({ ...s, [e.id]: "rejected" }))} aria-label="Reject"><X className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-5 py-3">
            <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="size-3.5" /> Start over</Button>
            <Button onClick={addToCalendar} disabled={!confirmed || importer.isPending}>
              {importer.isPending ? "Adding…" : `Add ${confirmed} confirmed to calendar`}
            </Button>
          </div>
        </Panel>
      )}

      {phase === "done" && (
        <Panel bodyClassName="flex flex-col items-center px-6 py-12 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="mt-3 font-medium">{imported} items added</p>
          <p className="mt-1 text-sm text-muted-foreground">They now appear on your calendar, assignments list and workload charts.</p>
          <div className="mt-5 flex gap-2">
            <Button asChild variant="outline"><Link to="/calendar">Open calendar</Link></Button>
            <Button onClick={reset}>Scan another</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
