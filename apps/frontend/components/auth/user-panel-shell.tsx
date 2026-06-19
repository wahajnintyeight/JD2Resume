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
  Sparkles,
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
        'group relative flex items-center overflow-hidden transition-all duration-300',
        isCollapsed ? 'h-11 w-11 justify-center rounded-lg' : 'h-11 w-full rounded-lg px-3.5',
        isActive
          ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 ring-1 ring-transparent hover:ring-white/5'
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-all duration-300',
          isCollapsed ? 'h-4.5 w-4.5' : 'mr-3 h-4.5 w-4.5',
          isActive && 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
        )}
      />

      <span
        className={cn(
          'whitespace-nowrap font-["Geist",_system-ui] text-sm font-medium transition-all duration-300',
          isCollapsed ? 'w-0 translate-x-4 opacity-0' : 'w-auto translate-x-0 opacity-100'
        )}
      >
        {children}
      </span>

      {isActive && !isCollapsed && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        {/* Ambient effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06),transparent_50%)]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-tr from-violet-500/8 via-purple-500/8 to-transparent blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />

        <div className="relative flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl px-12 py-10 shadow-[0_32px_120px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-blue-400/20 blur-xl animate-pulse rounded-lg" />
            <div className="h-8 w-8 rounded border-2 border-blue-400 border-t-transparent animate-spin relative z-10" />
          </div>

          <div className="space-y-2 text-center">
            <p className="font-['Geist',_system-ui] text-sm font-semibold tracking-wide text-blue-300">
              Loading Workspace
            </p>
            <p className="font-['Geist_Mono',_monospace] text-xs text-slate-500">
              Preparing your environment...
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08),transparent_50%)]" />

        <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-0 shadow-[0_32px_120px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="relative space-y-8 p-10 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.2)]">
              <Zap className="h-7 w-7" />
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span className="font-['Geist',_system-ui] text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  Professional Platform
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="font-['Playfair_Display',_Georgia,_serif] text-4xl font-bold tracking-tight text-slate-100 md:text-5xl">
                  Welcome Back
                </h2>
                <p className="mx-auto max-w-sm font-['Geist',_system-ui] text-sm leading-relaxed text-slate-400">
                  Sign in to access your resume workspace, AI-powered tailoring tools, and
                  professional document builder.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <a href={loginUrl} className="block">
                <Button className="h-12 w-full rounded-xl font-['Geist',_system-ui] text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_0_24px_rgba(59,130,246,0.3)] hover:shadow-[0_0_32px_rgba(59,130,246,0.4)] transition-all duration-300">
                  Sign in with Google
                </Button>
              </a>
              <p className="px-2 font-['Geist',_system-ui] text-xs leading-relaxed text-slate-500">
                Secure OAuth authentication • Privacy protected
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 md:flex-row">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(139,92,246,0.06),transparent_50%)]" />

      {/* Mobile Header */}
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-slate-900/80 backdrop-blur-xl px-5 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/30 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.2)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-['Playfair_Display',_Georgia,_serif] text-base font-bold tracking-tight text-slate-100">
              JD2Resume
            </div>
            <div className="font-['Geist',_system-ui] text-[9px] font-medium uppercase tracking-wider text-slate-500">
              Workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-10 w-10 rounded-lg bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-500/20 transition-all duration-300"
            title="Log out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="h-10 w-10 rounded-lg bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 hover:ring-white/10 transition-all duration-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'relative z-20 hidden h-full shrink-0 flex-col border-r border-white/5 bg-slate-900/80 backdrop-blur-xl transition-all duration-500 ease-in-out md:flex',
          isCollapsed ? 'w-20 items-center' : 'w-72'
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-lg text-slate-500 transition-all duration-300 hover:text-blue-400 hover:border-blue-400/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className={cn('flex h-full w-full flex-col gap-6 p-5', isCollapsed && 'items-center')}>
          {/* Logo */}
          <div
            className={cn(
              'flex items-center gap-3 transition-all duration-500',
              isCollapsed ? 'justify-center' : 'px-1'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/30 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.2)]">
              <Zap size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col transition-all duration-500">
                <span className="font-['Playfair_Display',_Georgia,_serif] text-lg font-bold tracking-tight text-slate-100">
                  JD2Resume
                </span>
                <span className="font-['Geist',_system-ui] text-[9px] font-medium uppercase tracking-[0.15em] text-slate-500">
                  Professional Platform
                </span>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div
            className={cn(
              'relative group flex items-center overflow-hidden rounded-lg bg-white/[0.02] ring-1 ring-white/5 backdrop-blur-sm transition-all duration-500',
              isCollapsed ? 'h-12 w-12 justify-center' : 'h-16 w-full px-3'
            )}
          >
            <div className="relative shrink-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className={cn(
                    'rounded-lg object-cover ring-1 ring-white/10 transition-all duration-500',
                    isCollapsed ? 'h-8 w-8' : 'h-10 w-10'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-all duration-500',
                    isCollapsed ? 'h-8 w-8' : 'h-10 w-10'
                  )}
                >
                  <UserIcon className="h-4 w-4 text-slate-500" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            </div>

            {!isCollapsed && (
              <div className="ml-3 flex min-w-0 flex-col transition-all duration-500">
                <span className="truncate font-['Geist',_system-ui] text-sm font-semibold text-slate-200">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <span className="truncate font-['Geist',_system-ui] text-xs text-slate-500">
                  {user.email}
                </span>
              </div>
            )}
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

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              'ring-1 ring-white/5 bg-white/[0.02] transition-all duration-500 hover:ring-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400',
              isCollapsed
                ? 'h-11 w-11 rounded-lg p-0'
                : 'h-11 w-full justify-start gap-3 rounded-lg px-3.5'
            )}
          >
            <LogOut size={18} />
            {!isCollapsed && (
              <span className="font-['Geist',_system-ui] text-sm font-medium">Sign Out</span>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex w-[20rem] max-w-[85%] flex-col border-r border-white/5 bg-slate-900/95 backdrop-blur-xl p-6 shadow-[0_32px_120px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-500">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.02] ring-1 ring-white/5 text-slate-400 transition-all hover:text-slate-200 hover:bg-white/[0.04] hover:ring-white/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="relative mb-8 flex items-center gap-3 pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/30 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.2)]">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <span className="block font-['Playfair_Display',_Georgia,_serif] text-xl font-bold tracking-tight text-slate-100">
                  JD2Resume
                </span>
                <span className="block font-['Geist',_system-ui] text-[9px] font-medium uppercase tracking-[0.15em] text-slate-500">
                  Professional Platform
                </span>
              </div>
            </div>

            <div className="relative mb-6 overflow-hidden rounded-lg bg-white/[0.02] ring-1 ring-white/5 backdrop-blur-sm p-4">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="h-12 w-12 rounded-lg ring-1 ring-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg ring-1 ring-white/10 bg-white/5">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-['Geist',_system-ui] text-sm font-semibold text-slate-200">
                    {user.name || user.email?.split('@')[0]}
                  </div>
                  <div className="truncate font-['Geist',_system-ui] text-xs text-slate-500">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex flex-1 flex-col gap-2">
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
              className="mt-5 flex h-11 w-full items-center justify-start gap-3 rounded-lg ring-1 ring-white/5 bg-white/[0.02] px-3.5 font-['Geist',_system-ui] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-500/20 transition-all duration-300"
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
