import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import logoSidebar from "@/assets/logo-sidebar-transparent.png";
import {
  CalendarCheck,
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Settings2,
  LogOut,
  WalletCards,
  Menu,
} from "lucide-react";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Agendamentos",
      path: "/class-sessions",
      icon: CalendarDays,
    },
    {
      label: "Alunos",
      path: "/students",
      icon: Users,
    },
    {
      label: "Ajustar Agenda",
      path: "/ajustar-agenda",
      icon: CalendarCheck,
    },
    {
      label: "Planos",
      path: "/plans",
      icon: ClipboardList,
    },
    {
      label: "Ajustes da Turma",
      path: "/ajustes-agenda",
      icon: Settings2,
    },
    {
      label: "Financeiro",
      path: "/financial",
      icon: WalletCards,
    },
  ];

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col justify-between">
        <div className="p-4 sm:p-6">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
           <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full">
            <img
              src={logoSidebar}
              alt="Logo da clínica"
              className="h-[120%] w-[120%] object-cover"
            />
          </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                Studio Move
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Painel administrativo
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "h-11 w-full justify-start gap-3 rounded-xl text-sm font-medium",
                    !isActive && "hover:bg-muted"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 pt-0 sm:p-6 sm:pt-0">
          <Button
            variant="destructive"
            className="h-11 w-full justify-start gap-3 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Sair</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col justify-between border-r bg-background lg:flex xl:w-72">
          <SidebarContent />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b bg-background px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Painel Administrativo
                </h1>
              </div>

              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="left"
                    className="w-[290px] p-0 sm:w-[320px]"
                  >
                    <SheetTitle className="sr-only">
                      Menu de navegação
                    </SheetTitle>

                    <ScrollArea className="h-full">
                      <SidebarContent />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <section className="flex-1 p-4 sm:p-6 xl:p-8">{children}</section>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;