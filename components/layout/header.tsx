"use client";

import { Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NovaEtapaDialog } from "@/components/etapas/nova-etapa-dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarMobile } from "@/components/layout/sidebar";

type HeaderProps = {
  title?: string;
};

export function Header({ title = "TCC SICOM" }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0" showCloseButton>
          <SidebarMobile />
        </SheetContent>
      </Sheet>

      <h2 className="flex-1 text-base font-semibold">{title}</h2>
      <Badge variant="secondary">2026.2</Badge>
      <NovaEtapaDialog />
    </header>
  );
}
