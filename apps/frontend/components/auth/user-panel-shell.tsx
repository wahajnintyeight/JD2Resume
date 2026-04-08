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
  User as UserIcon,
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
        'group relative flex items-center overflow-hidden transition-all duration-300 ease-out',
        isCollapsed ? 'h-12 w-12 justify-center rounded-xl' : 'h-11 w-full rounded-xl px-3',
        isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-all duration-300',
          isCollapsed ? 'h-5 w-5' : 'mr-3 h-4.5 w-4.5',
          isActive && 'drop-shadow-sm'
        )}
      />

      <span
        className={cn(
          'whitespace-nowrap text-sm font-bold transition-all duration-300',
          isCollapsed ? 'w-0 translate-x-4 opacity-0' : 'w-auto translate-x-0 opacity-100'
        )}
      >
        {children}
      </span>

      {isActive && !isCollapsed && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80 shadow-sm" />
      )}
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] p-6">
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #06b6d4 1px, transparent 1px),
              linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-tr from-fuchsia-500/15 via-pink-500/15 to-cyan-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative flex flex-col items-center gap-6 border-2 border-cyan-400/30 bg-slate-950/80 backdrop-blur-md px-12 py-10 shadow-[0_32px_120px_rgba(2,6,23,0.72)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          
          <div className="relative flex h-16 w-16 items-center justify-center border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm">
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse" />
            <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent animate-spin relative z-10" />
          </div>
          
          <div className="space-y-2 text-center">
            <p className="font-mono text-sm font-bold tracking-[0.25em] text-cyan-300 uppercase">
              Syncing Workspace
            </p>
            <p className="font-mono text-xs text-cyan-400/70 tracking-wider">
              // Loading your professional pipeline...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && pathname === '/') {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 dark:bg-[#050505] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.15),transparent)]" />
        <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] p-0 shadow-2xl">
          <div className="relative space-y-8 p-10 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Zap className="h-7 w-7" />
            </div>
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Professional Engine
              </span>
              <div className="space-y-2">
                <h2 className="font-sans text-3xl font-bold italic tracking-tight text-slate-900 dark:text-white md:text-4xl">
                  Access Required<span className="text-indigo-600">.</span>
                </h2>
                <p className="mx-auto max-w-sm font-sans text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Authenticate to access your resume pipeline, builder workspace, and AI-powered
                  tailoring system.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <a href={loginUrl} className="block">
                <Button className="h-12 w-full rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                  Sign in with Google
                </Button>
              </a>
              <p className="px-2 text-xs leading-5 text-slate-500 dark:text-slate-500 font-medium">
                Secure OAuth authentication • End-to-end encrypted
              </p>
            </div>
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#050505] md:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.06),transparent)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.12),transparent)]" />

      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] px-5 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-sans text-base font-bold italic tracking-tight text-slate-900 dark:text-white">
              JD2Resume
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
              Workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/20"
            title="Log out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <aside
        className={cn(
          'relative z-20 hidden h-full shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] transition-all duration-500 ease-in-out md:flex',
          isCollapsed ? 'w-20 items-center' : 'w-72'
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] shadow-lg text-slate-400 dark:text-slate-500 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/20"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className={cn('flex h-full w-full flex-col gap-6 p-5', isCollapsed && 'items-center')}>
          <div
            className={cn(
              'flex items-center gap-3 transition-all duration-500',
              isCollapsed ? 'justify-center' : 'px-1'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Zap size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col transition-all duration-500">
                <span className="text-lg font-bold italic tracking-tight text-slate-900 dark:text-white">
                  JD2Resume
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-500">
                  Professional Engine
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'relative group flex items-center overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-all duration-500',
              isCollapsed ? 'h-12 w-12 justify-center rounded-xl' : 'h-16 w-full rounded-xl px-3'
            )}
          >
            <div className="relative shrink-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className={cn(
                    'rounded-lg object-cover transition-all duration-500',
                    isCollapsed ? 'h-8 w-8' : 'h-10 w-10'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 transition-all duration-500',
                    isCollapsed ? 'h-8 w-8' : 'h-10 w-10'
                  )}
                >
                  <UserIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0A0A0A] bg-emerald-500" />
            </div>

            {!isCollapsed && (
              <div className="ml-3 flex min-w-0 flex-col transition-all duration-500">
                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user.name || user.email?.split('@')[0]}
                </span>
                 
              </div>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-3">
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

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-all duration-500 hover:border-rose-200 dark:hover:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400',
              isCollapsed
                ? 'h-11 w-11 rounded-xl p-0'
                : 'h-11 w-full justify-start gap-3 rounded-xl px-3'
            )}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="text-sm font-bold">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex w-[20rem] max-w-[85%] flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] p-6 shadow-2xl animate-in slide-in-from-left duration-500">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="relative mb-8 flex items-center gap-3 pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-sans text-xl font-bold italic tracking-tight text-slate-900 dark:text-white">
                  JD2Resume
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-500">
                  Professional Engine
                </span>
              </div>
            </div>

            <div className="relative mb-6 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="h-12 w-12 rounded-lg border border-slate-200 dark:border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10">
                    <UserIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-sans text-sm font-bold text-slate-900 dark:text-white">
                    {user.name || user.email?.split('@')[0]}
                  </div>
                  <div className="truncate text-xs text-slate-600 dark:text-slate-400">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex flex-1 flex-col gap-3">
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
              className="mt-5 flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 font-bold text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/20"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </Button>
          </aside>
        </div>
      )}

      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
