"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NovaEtapaDialog } from "@/components/etapas/nova-etapa-dialog";
import { BuscaGlobal } from "@/components/layout/busca-global";
import { Notificacoes } from "@/components/layout/notificacoes";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
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
  const [buscaAberta, setBuscaAberta] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 overflow-visible border-b bg-background px-6">
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
      <Button
        variant="outline"
        className="hidden w-64 justify-start text-muted-foreground sm:flex"
        onClick={() => setBuscaAberta(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Buscar...
        <kbd className="ml-auto text-xs">Ctrl K</kbd>
      </Button>
      <Notificacoes />
      <ThemeToggle />
      <Badge variant="secondary">2026.2</Badge>
      <NovaEtapaDialog />
      <UserMenu />
      <BuscaGlobal open={buscaAberta} onOpenChange={setBuscaAberta} />
    </header>
  );
}
