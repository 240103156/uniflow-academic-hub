import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3, BookOpen, CalendarDays, FileScan, FolderOpen, LayoutDashboard, ListChecks, Settings, ShieldCheck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAlerts } from "@/hooks/use-academic";

export const MAIN_NAV = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assignments", url: "/assignments", icon: ListChecks },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Materials", url: "/materials", icon: FolderOpen },
  { title: "Workload", url: "/workload", icon: BarChart3 },
] as const;

export const TOOL_NAV = [
  { title: "Submission Guardian", url: "/submissions", icon: ShieldCheck },
  { title: "Syllabus Scanner", url: "/syllabus", icon: FileScan },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { data: alerts = [] } = useAlerts();
  const active = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b">
        <Link to="/" className="flex items-center gap-2 px-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">U</div>
          <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">UniFlow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={i.title}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOOL_NAV.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={i.title}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                  {i.url === "/submissions" && alerts.length > 0 && <SidebarMenuBadge>{alerts.length}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={active("/settings")} tooltip="Settings">
              <Link to="/settings"><Settings /><span>Settings</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mx-2 mb-1 rounded-md border border-dashed px-2.5 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span className="font-medium text-foreground">Demo Mode</span> — sample data, no LMS connected.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
