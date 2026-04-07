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
        'group relative flex w-full items-center gap-3 overflow-hidden rounded-[1.35rem] border px-4 py-3.5 text-sm font-semibold tracking-[-0.015em] transition-all duration-300 ease-out',
        isActive
          ? 'border-transparent bg-[linear-gradient(135deg,rgba(37,99,235,0.96),rgba(99,102,241,0.92),rgba(168,85,247,0.88))] text-white shadow-[0_22px_50px_rgba(79,70,229,0.28)] ring-1 ring-white/25'
          : 'border-white/70 bg-white/72 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-white hover:bg-white/88 hover:text-slate-900 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-14 rounded-r-full opacity-0 blur-2xl transition duration-300',
          isActive
            ? 'bg-white/40 opacity-70'
            : 'bg-sky-200/50 group-hover:opacity-60'
        )}
      />
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
          isCollapsed ? 'h-11 w-11' : 'h-10 w-10',
          isActive
            ? 'bg-white/18 text-white shadow-inner shadow-white/10'
            : 'bg-slate-100/80 text-slate-500 group-hover:bg-sky-50 group-hover:text-primary'
        )}
      >
        <Icon className={cn('shrink-0', isCollapsed ? 'h-5.5 w-5.5' : 'h-5 w-5')} />
      </span>
      {!isCollapsed && <span className="relative truncate">{children}</span>}
      {isActive && !isCollapsed && (
        <span className="relative ml-auto h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_45%,#eef2ff_100%)] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.12),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.1),transparent_30%)]" />
        <div className="relative flex flex-col items-center gap-5 rounded-[2rem] border border-white/60 bg-white/70 px-10 py-9 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#2563eb,#6366f1,#8b5cf6)] shadow-[0_24px_50px_rgba(79,70,229,0.3)]">
            <div className="h-8 w-8 rounded-full border-[3px] border-white/90 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-sans text-base font-semibold tracking-tight text-slate-900">
              Syncing your workspace
            </p>
            <p className="font-sans text-sm text-slate-500">
              Preparing your dashboard with your latest resume data.
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#eef2ff_100%)] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.16),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(192,132,252,0.16),transparent_22%),radial-gradient(circle_at_60%_100%,rgba(56,189,248,0.12),transparent_28%)]" />
        <Card
          variant="glass"
          className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-0 shadow-[0_40px_120px_rgba(15,23,42,0.16)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" />
          <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-fuchsia-200/40 blur-3xl" />
          <div className="absolute -left-8 bottom-6 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative space-y-8 p-10 text-center md:p-12">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#2563eb,#6366f1,#a855f7)] text-white shadow-[0_28px_60px_rgba(79,70,229,0.28)]">
              <Zap className="h-8 w-8 fill-current" />
            </div>
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-sky-100 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
                Resume workspace
              </span>
              <div className="space-y-2">
                <h2 className="font-sans text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Welcome back
                </h2>
                <p className="mx-auto max-w-sm font-sans text-sm leading-6 text-slate-500 md:text-[15px]">
                  Continue tailoring, refining, and tracking your resume flow with a softer,
                  polished workspace.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[1.5rem] border border-white/70 bg-white/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <a href={loginUrl} className="block">
                <Button className="h-13 w-full rounded-[1.35rem] text-base font-semibold shadow-[0_24px_50px_rgba(79,70,229,0.22)]">
                  Sign in with Google
                </Button>
              </a>
              <p className="px-2 text-xs leading-5 text-slate-500">
                Secure sign-in unlocks your dashboard, builder, and tailored resume workflows.
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_38%,#eef2ff_100%)] md:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.1),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.09),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.08),transparent_24%)]" />

      <header className="relative z-20 flex h-20 shrink-0 items-center justify-between border-b border-white/60 bg-white/68 px-5 backdrop-blur-2xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#2563eb,#6366f1,#a855f7)] text-white shadow-[0_18px_35px_rgba(79,70,229,0.28)]">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="font-sans text-lg font-bold tracking-tight text-slate-950">JD2Resume</div>
            <div className="text-xs font-medium text-slate-500">Personal workspace</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-[1.15rem] border border-white/60 bg-white/65 text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:bg-rose-50 hover:text-rose-600"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-[1.15rem] border border-white/60 bg-white/65 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:bg-white hover:text-slate-950"
          >
            <Menu className="h-5.5 w-5.5" />
          </Button>
        </div>
      </header>

      <aside
        className={cn(
          'relative z-20 hidden h-full shrink-0 flex-col border-r border-white/55 bg-white/62 backdrop-blur-2xl transition-all duration-500 ease-out md:flex',
          isCollapsed ? 'w-28' : 'w-[21rem]'
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/55 to-transparent" />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/90 text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.12)] transition-all duration-300 hover:scale-105 hover:text-primary"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="relative flex flex-1 flex-col gap-7 p-6">
          <div
            className={cn(
              'flex items-center gap-3 transition-all duration-300',
              isCollapsed ? 'justify-center' : 'px-1'
            )}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(135deg,#2563eb,#6366f1,#a855f7)] text-white shadow-[0_24px_50px_rgba(79,70,229,0.26)]">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="block font-sans text-2xl font-bold tracking-tight text-slate-950">
                  JD2Resume
                </span>
                <span className="block text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
                  Focused career studio
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/64 shadow-[0_18px_46px_rgba(15,23,42,0.08)] backdrop-blur-xl',
              isCollapsed ? 'p-3' : 'p-4'
            )}
          >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/90 to-transparent" />
            <div
              className={cn(
                'relative flex items-center gap-3',
                isCollapsed ? 'flex-col text-center' : 'flex-row'
              )}
            >
              <div className="relative shrink-0">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="h-14 w-14 rounded-[1.25rem] border border-white/80 object-cover shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/80 bg-white/90 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                    <UserIcon className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-[1rem] font-semibold text-slate-950">
                    {user.name || user.email?.split('@')[0]}
                  </div>
                  <div className="truncate text-sm text-slate-500">{user.email}</div>
                  <div className="mt-2 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Professional
                  </div>
                </div>
              )}

              {isCollapsed && (
                <div className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Pro
                </div>
              )}
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2.5">
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
              'w-full rounded-[1.35rem] border border-white/65 bg-white/68 font-semibold text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_20px_44px_rgba(244,63,94,0.14)]',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-4'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/28 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex w-[22rem] max-w-[88%] flex-col border-r border-white/65 bg-white/80 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl animate-in slide-in-from-left duration-500">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-white/70 bg-white/90 text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative mb-8 flex items-center gap-3 pt-5">
              <div className="flex h-13 w-13 items-center justify-center rounded-[1.45rem] bg-[linear-gradient(135deg,#2563eb,#6366f1,#a855f7)] text-white shadow-[0_20px_40px_rgba(79,70,229,0.26)]">
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <div>
                <span className="block font-sans text-2xl font-bold tracking-tight text-slate-950">
                  JD2Resume
                </span>
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                  Personal workspace
                </span>
              </div>
            </div>

            <div className="relative mb-6 overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/72 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="h-13 w-13 rounded-[1.15rem] border border-white/80 object-cover shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
                  />
                ) : (
                  <div className="flex h-13 w-13 items-center justify-center rounded-[1.15rem] border border-white/80 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    <UserIcon className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-sans text-base font-semibold text-slate-950">
                    {user.name || user.email?.split('@')[0]}
                  </div>
                  <div className="truncate text-sm text-slate-500">{user.email}</div>
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
              className="mt-5 flex h-12 w-full items-center justify-start gap-3 rounded-[1.35rem] border border-white/70 bg-white/72 px-4 font-semibold text-slate-500 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-5 w-5" />
              Log out
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
