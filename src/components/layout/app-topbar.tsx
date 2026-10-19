import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpen, FileText, ListChecks, Moon, Search, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useTheme } from "@/components/theme-provider";
import { useAlerts, useAssignments, useCourses, useMaterials } from "@/hooks/use-academic";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { DemoBadge } from "@/components/academic/badges";
import { cn } from "@/lib/utils";

const TITLES: [string, string][] = [
  ["/assignments", "Assignments"],
  ["/calendar", "Calendar"],
  ["/courses", "Courses"],
  ["/materials", "Materials"],
  ["/workload", "Workload"],
  ["/settings", "Settings"],
  ["/submissions", "Submission Guardian"],
  ["/syllabus", "Syllabus Scanner"],
];

export function AppTopbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const title = path === "/" ? "Dashboard" : (TITLES.find(([p]) => path.startsWith(p))?.[1] ?? "UniFlow");
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <h1 className="truncate text-sm font-semibold">{title}</h1>
      <DemoBadge className="hidden sm:inline-flex">Demo Mode</DemoBadge>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden h-8 w-64 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="size-3.5" />
          Search…
          <kbd className="ml-auto rounded border bg-background px-1.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search className="size-4" />
        </Button>
        <Notifications />
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Avatar className="ml-1 size-7">
          <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">AS</AvatarFallback>
        </Avatar>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function Notifications() {
  const { data: alerts = [] } = useAlerts();
  const { data: assignments = [] } = useAssignments();
  const { openDetail } = useAssignmentUI();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {alerts.length > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {alerts.length === 0 && <p className="p-4 text-sm text-muted-foreground">You're all caught up.</p>}
          {alerts.slice(0, 6).map((al) => (
            <button
              key={al.id}
              onClick={() => { setOpen(false); openDetail(al.assignmentId); }}
              className="flex w-full gap-3 border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-muted/50"
            >
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", al.severity === "critical" ? "bg-destructive" : "bg-warning")} />
              <span className="leading-snug">{al.message}</span>
            </button>
          ))}
        </div>
        <Link to="/submissions" onClick={() => setOpen(false)} className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/50">
          View all in Submission Guardian ({assignments.length ? alerts.length : 0})
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: assignments = [] } = useAssignments();
  const { data: courses = [] } = useCourses();
  const { data: materials = [] } = useMaterials();
  const { openDetail } = useAssignmentUI();
  const navigate = useNavigate();
  const close = () => onOpenChange(false);
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search assignments, courses, materials…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Courses">
          {courses.map((c) => (
            <CommandItem key={c.id} value={`course ${c.name} ${c.code}`}
              onSelect={() => { close(); navigate({ to: "/courses/$courseId", params: { courseId: c.id } }); }}>
              <BookOpen className="size-4" /> {c.name} <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Assignments">
          {assignments.map((a) => (
            <CommandItem key={a.id} value={`assignment ${a.title} ${a.id}`} onSelect={() => { close(); openDetail(a.id); }}>
              <ListChecks className="size-4" /> {a.title}
              <span className="ml-auto text-xs text-muted-foreground">{courses.find((c) => c.id === a.courseId)?.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Materials">
          {materials.map((m) => (
            <CommandItem key={m.id} value={`material ${m.name}`}
              onSelect={() => { close(); navigate({ to: "/materials", search: { q: m.name } }); }}>
              <FileText className="size-4" /> {m.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
