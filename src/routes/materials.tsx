import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ExternalLink, FolderOpen, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCourses, useMaterials } from "@/hooks/use-academic";
import { MATERIAL_LABEL, fmtBytes, fmtDate } from "@/lib/format";
import { CourseTag } from "@/components/academic/badges";
import { EmptyState, ErrorState, ListSkeleton, PageIntro, Panel } from "@/components/academic/states";
import { MaterialIcon } from "@/components/academic/material-icon";
import { cn } from "@/lib/utils";
import type { Material, MaterialType } from "@/types/academic";

export const Route = createFileRoute("/materials")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Materials — UniFlow" },
      { name: "description", content: "Lecture slides, notes and handouts from every course in one library." },
      { property: "og:title", content: "Materials — UniFlow" },
      { property: "og:description", content: "Lecture slides, notes and handouts from every course in one library." },
    ],
  }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const { q } = Route.useSearch();
  const { data, isLoading, error, refetch } = useMaterials();
  const { data: courses = [] } = useCourses();
  const [query, setQuery] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) { setLastQ(q); setQuery(q); }
  const [courseId, setCourseId] = useState("all");
  const [type, setType] = useState<MaterialType | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"grid" | "table">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<Material[] | null>(null);

  const rows = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return (data ?? [])
      .filter((m) => (!ql || m.name.toLowerCase().includes(ql)) && (courseId === "all" || m.courseId === courseId) && (type === "all" || m.type === type))
      .sort((a, b) => (sort === "newest" ? b.uploadedAt.localeCompare(a.uploadedAt) : a.uploadedAt.localeCompare(b.uploadedAt)));
  }, [data, query, courseId, type, sort]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const course = (id: string) => courses.find((c) => c.id === id);
  const selectedItems = (data ?? []).filter((m) => selected.has(m.id));

  return (
    <div>
      <PageIntro title="Lecture Collector" description={`${data?.length ?? "—"} files across ${courses.length} courses · demo metadata`}
        actions={selected.size > 0 && (
          <>
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            <Button onClick={() => setDownloading(selectedItems)}><Download className="size-4" /> Download selected</Button>
          </>
        )} />
      <Panel>
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by file name…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All courses</SelectItem>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as MaterialType | "all")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All types</SelectItem>{Object.entries(MATERIAL_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent>
            </Select>
            <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "table")}>
              <ToggleGroupItem value="table" aria-label="Table view"><List className="size-4" /></ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="size-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <ListSkeleton rows={8} /> : rows.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No files match" description="Adjust the search or filters." />
        ) : view === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-5">
                  <Checkbox checked={allSelected} onCheckedChange={(c) => setSelected(c ? new Set(rows.map((r) => r.id)) : new Set())} aria-label="Select all" />
                </TableHead>
                <TableHead>File</TableHead>
                <TableHead className="hidden lg:table-cell">Course</TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id} data-state={selected.has(m.id) ? "selected" : undefined}>
                  <TableCell className="pl-5"><Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label={`Select ${m.name}`} /></TableCell>
                  <TableCell><div className="flex items-center gap-3"><MaterialIcon type={m.type} /><span className="font-medium">{m.name}</span></div></TableCell>
                  <TableCell className="hidden lg:table-cell"><CourseTag course={course(m.courseId)} /></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{m.topic}</TableCell>
                  <TableCell className="tabular hidden text-muted-foreground sm:table-cell">{fmtBytes(m.size)}</TableCell>
                  <TableCell className="tabular hidden text-muted-foreground md:table-cell">{fmtDate(m.uploadedAt)}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="size-8" onClick={() => setDownloading([m])} aria-label={`Download ${m.name}`}><Download className="size-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((m) => (
              <div key={m.id} className={cn("rounded-lg border p-4 transition-colors", selected.has(m.id) && "border-primary/50 bg-accent/40")}>
                <div className="flex items-start justify-between">
                  <MaterialIcon type={m.type} />
                  <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label={`Select ${m.name}`} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium">{m.name}</p>
                <div className="mt-1"><CourseTag course={course(m.courseId)} /></div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.topic} · {fmtBytes(m.size)}</span>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => setDownloading([m])} aria-label={`Download ${m.name}`}><Download className="size-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Dialog open={!!downloading} onOpenChange={(o) => !o && setDownloading(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Downloads need a real LMS connection</DialogTitle>
            <DialogDescription>
              These {downloading?.length === 1 ? "file is" : `${downloading?.length} files are`} demo metadata only — no file content exists in UniFlow yet.
              Once the browser extension connects to Moodle or Canvas, downloads will fetch the original files.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-60 divide-y overflow-y-auto rounded-md border text-sm">
            {downloading?.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <MaterialIcon type={m.type} className="size-7" />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Open demo source URL"><ExternalLink className="size-3.5" /></a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Source links are demo placeholders.</p>
          <DialogFooter><Button onClick={() => setDownloading(null)}>Got it</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
