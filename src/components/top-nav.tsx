import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";
import { useState, useEffect } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Search, BookOpen, LogOut, User as UserIcon, LayoutDashboard, Bell, Library, Settings as SettingsIcon, Sun, Moon, Menu, ShieldCheck, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUnreadCount } from "@/hooks/use-notifications";

const links = [
  { to: "/", label: t("nav.discover") },
  { to: "/rankings", label: t("nav.rankings") },
  { to: "/community", label: t("nav.community") },
  { to: "/contests", label: t("nav.contests") },
  { to: "/dashboard", label: "Create" },
  { to: "/faq", label: "FAQ" },
];

function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('novelhub-theme');
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('novelhub-theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  return { dark, mounted, toggle: () => setDark((d) => !d) };
}

export function TopNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { dark, mounted, toggle: toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data: unreadCount = 0 } = useUnreadCount();

  // Query user profile details
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-nav", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role, avatar_url, display_name").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = (myProfile as any)?.role === "admin";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <Link to="/" className="mb-6 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <img src="/favicon.png" alt="NovelHub Logo" className="h-9 w-9 object-contain" />
              <span className="font-serif text-xl font-bold tracking-wide text-foreground">
                Novel<span className="text-primary italic font-serif font-light">Hub</span>
              </span>
            </Link>
            <nav className="flex flex-col gap-1">
              {links.map((l) => {
                const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <>
                <div className="my-4 h-px bg-border" />
                <nav className="flex flex-col gap-1">
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <UserIcon className="h-4 w-4" /> Profile
                  </Link>
                  <Link to="/library" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Library className="h-4 w-4" /> My Library
                  </Link>
                  <Link to="/inbox" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <SettingsIcon className="h-4 w-4" /> Settings
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </nav>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 group">
          <img src="/favicon.png" alt="NovelHub Logo" className="h-9 w-9 object-contain transition-transform group-hover:rotate-6 duration-300" />
          <span className="font-serif text-xl font-bold tracking-wide text-foreground transition-colors">
            Novel<span className="text-primary italic font-serif font-light">Hub</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/search" className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search novels, authors…" className="h-9 w-64 cursor-pointer pl-9" readOnly />
          </Link>
          {mounted ? (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Toggle theme placeholder">
              <div className="h-5 w-5" />
            </Button>
          )}
          {user ? (
            <>
              <Link to="/notifications">
                <Button size="icon" variant="ghost" aria-label="Notifications" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="sm">Publish</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none ring-offset-2 focus:ring-2 focus:ring-primary overflow-hidden">
                    <Avatar className="h-9 w-9">
                      {myProfile?.avatar_url ? (
                        <img src={myProfile.avatar_url} alt={myProfile.display_name || ""} className="object-cover h-full w-full rounded-full" />
                      ) : (
                        <AvatarFallback>{initials}</AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/library"><Library className="mr-2 h-4 w-4" />My Library</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/inbox"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings"><SettingsIcon className="mr-2 h-4 w-4" />Settings</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
