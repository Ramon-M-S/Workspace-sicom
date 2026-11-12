"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutDashboard,
  Kanban,
  ListChecks,
  Map,
  Settings,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/etapas", label: "Etapas", icon: ListChecks },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function SidebarContents({
  onNavigate,
  isCollapsed = false,
}: {
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "border-b py-4",
          isCollapsed ? "flex justify-center px-2" : "px-6",
        )}
      >
        <h1 className="text-lg font-semibold">{isCollapsed ? "S" : "SICOM"}</h1>
      </div>
      <nav className={cn("flex flex-col gap-1", isCollapsed ? "p-2" : "p-4")}>
        {navigation.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={ativo ? "page" : undefined}
              aria-label={label}
              title={isCollapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-md py-2 text-sm",
                isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                ativo
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
  }, []);

  useEffect(() => {
    if (isCollapsed !== null) {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  const collapsed = isCollapsed ?? false;

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r bg-muted/40 transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContents isCollapsed={collapsed} />
      <div className="mt-auto border-t p-4">
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn("w-full", collapsed ? "px-0" : "justify-start")}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          onClick={() => setIsCollapsed((atual) => !atual)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          {!collapsed && <span>Recolher</span>}
        </Button>
      </div>
    </aside>
  );
}

export function SidebarMobile({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <SidebarContents onNavigate={onNavigate} />
    </div>
  );
}
