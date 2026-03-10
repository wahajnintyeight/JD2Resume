'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, Settings, Sparkles, Plus, Bell, User } from 'lucide-react';

// ─── Nav item definitions (DRY: single source of truth) ────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'tailor', label: 'Tailor', href: '/tailor', icon: Sparkles },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
] as const;

// Mobile bottom nav — 5 slots with center upload CTA
const MOBILE_NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/dashboard', icon: LayoutDashboard, isCenter: false },
  { id: 'tailor', label: 'Tailor', href: '/tailor', icon: Sparkles, isCenter: false },
  { id: 'upload', label: 'Upload', href: null, icon: Plus, isCenter: true },
  { id: 'notifications', label: 'Alerts', href: null, icon: Bell, isCenter: false },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, isCenter: false },
] as const;

// Helper: derive active tab id from current path
function getActiveId(pathname: string): string {
  if (pathname.startsWith('/tailor')) return 'tailor';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/resumes')) return 'home';
  if (pathname.startsWith('/builder')) return 'home';
  return 'home'; // dashboard and root
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveId(pathname);

  return (
    <div className="dark min-h-screen app-height bg-[#050505] text-white selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
      {/* Atmospheric background glows */}
      <div className="accent-glow top-[-100px] left-[-100px]" />
      <div className="accent-glow bottom-[-100px] right-[-100px] opacity-10" />

      {/* ── Desktop top nav (hidden on mobile) ── */}
      <header className="hidden md:flex shrink-0 items-center border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl w-full items-center justify-between px-12 py-5">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">ResumeMaster</div>
              <div className="text-[9px] uppercase tracking-widest text-white/40 font-medium -mt-0.5">
                AI Career Tool
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/60 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                activeId === item.id || (item.id === 'dashboard' && activeId === 'home');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`transition-colors hover:text-white ${isActive ? 'text-white' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <User className="h-4 w-4 text-white/60" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sticky header (hidden on desktop) ── */}
      <header className="md:hidden shrink-0 flex items-center justify-between px-5 py-4 sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 safe-top">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">ResumeMaster</span>
        </Link>
        <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <User className="h-4 w-4 text-white/60" />
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-0 relative z-10">
        {children}
      </main>

      {/* ── Mobile bottom nav pill (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-8 z-50 pointer-events-none">
        <div
          className="rounded-full p-2 flex items-center justify-around pointer-events-auto shadow-2xl shadow-black"
          style={{
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {MOBILE_NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeId === tab.id || (tab.id === 'home' && activeId === 'home');

            if (tab.isCenter) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-label="Upload"
                  onClick={() => router.push('/dashboard')}
                  className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 -translate-y-4 border-4 border-[#050505] active:scale-90 transition-transform"
                >
                  <Icon className="w-6 h-6 text-white" />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                onClick={() => tab.href && router.push(tab.href)}
                className={`p-3 transition-all duration-200 ${
                  isActive ? 'text-indigo-400 scale-110' : 'text-white/40'
                }`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
