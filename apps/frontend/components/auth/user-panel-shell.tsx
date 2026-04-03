import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  PenTool, 
  Zap, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';

import { useAuth } from '@/lib/context/auth-context';
import { API_BASE } from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function NavLink({
  href,
  children,
  icon: Icon,
  isCollapsed,
  isActive,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ElementType;
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 font-sans text-sm font-bold transition-all duration-200 rounded-xl",
        isActive 
          ? "bg-primary text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] scale-[1.02]" 
          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-primary border border-slate-100 shadow-sm"
      )}
    >
      <Icon className={cn("shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
      {!isCollapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

export default function UserPanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loginUrl = `${API_BASE}/auth/google/login`;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/10" />
          <p className="font-sans text-sm text-slate-500 font-semibold tracking-tight">Syncing your workspace...</p>
        </div>
      </div>
    );
  }

  // Allow public access to landing page
  if (!user && pathname === '/') {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md bg-white shadow-2xl rounded-3xl">
          <div className="p-10 space-y-8 text-center">
            <div className="space-y-2">
              <h2 className="font-sans text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>
              <p className="font-sans text-sm text-slate-500 font-medium">
                Please sign in to access your workspace
              </p>
            </div>
            <div className="h-px bg-slate-100 w-full" />
            <a href={loginUrl} className="block">
              <Button className="w-full h-12 rounded-2xl font-bold text-base shadow-lg">
                Sign in with Google
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/builder', label: 'Builder', icon: PenTool },
    { href: '/tailor', label: 'Tailor', icon: Zap },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Mobile Header */}
      <header className="flex h-20 shrink-0 items-center justify-between bg-white px-6 md:hidden border-b border-slate-100">
        <div className="font-sans text-2xl font-black tracking-tight text-primary">
          JD2Resume
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-2xl bg-slate-50 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </Button>
      </header>

      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "relative hidden h-full shrink-0 flex-col bg-white border-r border-slate-100 transition-all duration-500 ease-in-out md:flex",
          isCollapsed ? "w-24" : "w-80"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-400 hover:text-primary hover:border-primary transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="flex flex-1 flex-col gap-8 p-6">
          {/* Brand/Logo */}
          <div className={cn(
            "flex items-center gap-3 transition-all",
            isCollapsed ? "justify-center" : "px-2"
          )}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            {!isCollapsed && (
              <span className="font-sans text-2xl font-black tracking-tight text-slate-900">
                JD2Resume
              </span>
            )}
          </div>

          {/* User Profile */}
          <div className={cn(
            "bg-slate-50/50 rounded-2xl border border-slate-100 transition-all",
            isCollapsed ? "p-2" : "p-4"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              isCollapsed ? "flex-col" : "flex-row"
            )}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="avatar"
                  className="h-12 w-12 rounded-xl border-2 border-white shadow-md object-cover shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                  <UserIcon className="h-6 w-6 text-slate-400" />
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-base font-bold text-slate-900">
                    {user.name || user.email?.split('@')[0]}
                  </div>
                  <div className="font-sans text-[10px] font-bold uppercase text-slate-400 tracking-wider">Professional</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink 
                key={item.href} 
                href={item.href} 
                icon={item.icon}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "group w-full rounded-2xl font-bold text-slate-500 hover:text-destructive hover:bg-destructive/5 transition-all duration-200",
              isCollapsed ? "px-0 justify-center" : "justify-start gap-3 px-4"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar/Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex w-80 max-w-[85%] flex-col bg-white p-8 shadow-2xl animate-in slide-in-from-left duration-500">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <span className="font-sans text-2xl font-black tracking-tight text-slate-900">
                JD2Resume
              </span>
            </div>

            <nav className="flex flex-1 flex-col gap-4">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  href={item.href} 
                  icon={item.icon}
                  isCollapsed={false}
                  isActive={pathname === item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="mt-auto flex w-full items-center justify-start gap-4 rounded-2xl px-4 h-12 font-bold text-slate-500 hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </Button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

