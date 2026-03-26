'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { useAuth } from '@/lib/context/auth-context';
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
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const loginUrl = `${API_BASE}/auth/google/login`;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F0E8]">
        <p className="font-mono text-sm text-gray-600">Checking session...</p>
      </div>
    );
  }

  // Allow public access to landing page
  if (!user && pathname === '/') {
    return <div className="min-h-screen w-full bg-[#F0F0E8]">{children}</div>;
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F0F0E8] md:flex-row">
      <aside className="w-full shrink-0 border-b border-black bg-[#F0F0E8] md:w-72 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-none border-2 border-black bg-white p-4 shadow-sw-default">
            <div className="font-mono text-xs font-bold uppercase text-blue-700">User</div>
            <div className="mt-2 line-clamp-1 font-serif text-lg font-bold text-gray-900">
              {user.name || user.email || 'Signed in'}
            </div>
            {user.picture ? (
              <img
                src={user.picture}
                alt="avatar"
                className="mt-3 h-10 w-10 border border-black object-cover rounded-none"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/settings">Settings</NavLink>
            <NavLink href="/builder">Builder</NavLink>
            <NavLink href="/tailor">Tailor</NavLink>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full rounded-none border-2 border-black bg-white shadow-sw-default hover:bg-white"
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

