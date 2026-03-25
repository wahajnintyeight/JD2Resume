'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { fetchAuthMe, logout, type AuthUser } from '@/lib/api/auth';
import { API_BASE } from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block w-full px-4 py-2 font-mono text-sm uppercase font-bold text-blue-700 hover:bg-blue-50 border border-black shadow-sw-default transition-all rounded-none"
    >
      {children}
    </Link>
  );
}

export default function UserPanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | 'loading'>('loading');
  const loginUrl = `${API_BASE}/auth/google/login`;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const me = await fetchAuthMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (user === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="font-mono text-sm text-gray-600">Checking session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F0E8]">
        <Card className="w-full max-w-md border-2 border-black bg-[#F0F0E8]">
          <div className="p-6 space-y-3">
            <h2 className="font-mono uppercase font-bold text-lg text-blue-700">
              Sign in required
            </h2>
            <p className="text-sm">Please sign in to manage your resumes and settings.</p>
            <a href={loginUrl}>
              <Button className="w-full bg-blue-700 text-white border-2 border-black shadow-sw-default hover:bg-blue-800 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all rounded-none">
                Sign in with Google
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F0E8] overflow-x-hidden">
      <aside className="w-full md:w-72 shrink-0 border-r-0 md:border-r border-black bg-[#F0F0E8] border-b md:border-b-0">
        <div className="p-4 space-y-4 w-full overflow-hidden">
          <div className="border-2 border-black bg-white p-4 shadow-sw-default rounded-none">
            <div className="font-mono uppercase text-xs font-bold text-blue-700">User</div>
            <div className="mt-2 font-serif font-bold text-lg text-gray-900 line-clamp-1">
              {user.name || user.email || 'Signed in'}
            </div>
            {user.picture ? (
              <img
                src={user.picture}
                alt="avatar"
                className="mt-3 w-10 h-10 rounded-none border border-black object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-2 w-full overflow-hidden">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/settings">Settings</NavLink>
            <NavLink href="/builder">Builder</NavLink>
            <NavLink href="/tailor">Tailor</NavLink>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-2 border-black hover:bg-white bg-white shadow-sw-default rounded-none"
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}

