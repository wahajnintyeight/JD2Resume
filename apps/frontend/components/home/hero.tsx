'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Github, Sparkles } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/lib/context/auth-context';
import { API_BASE } from '@/lib/api/client';

export default function Hero() {
  const { t } = useTranslations();
  const { user: authUser, status } = useAuth();

  const loginUrl = `${API_BASE}/auth/google/login`;

  const primaryButtonClass =
    'group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-200';
  const secondaryButtonClass =
    'group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white/10';

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#09090f] text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#111322] via-[#09090f] to-[#07070b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.30),_transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.16),_transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen  items-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI resume optimization for modern hiring
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl">
              <span className="block">{t('home.brandLine1')}</span>
              <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                {t('home.brandLine2')}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Turn generic resumes into recruiter-ready applications with sharper titles, JD-aligned
              bullets, stronger projects, and cleaner keyword coverage.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a
                href="https://github.com/srbhr/Resume-Matcher"
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButtonClass}
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>

              <a
                href="https://resumematcher.fyi"
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButtonClass}
              >
                <FileText className="h-4 w-4" />
                {t('home.docs')}
              </a>

              {authUser && status !== 'loading' ? (
                <Link href="/dashboard" className={primaryButtonClass}>
                  {t('home.launchApp')}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <a href={loginUrl} className={primaryButtonClass} aria-label="Sign in with Google">
                  Sign in with Google
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/10 to-cyan-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Resume signal boost</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                    recruiter scan dashboard
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">
                      Match confidence
                    </span>
                    <span className="text-2xl font-bold text-white">92%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target role</p>
                    <p className="mt-2 text-sm font-semibold text-white">Backend Engineer</p>
                    <p className="mt-1 text-sm text-slate-400">Title normalized from internal naming</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Keyword coverage</p>
                    <p className="mt-2 text-sm font-semibold text-white">Redis · Go · RabbitMQ</p>
                    <p className="mt-1 text-sm text-slate-400">Critical skills surfaced earlier</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Improved bullet</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    Built Go services for live GPS stream processing using RabbitMQ, Redis, and
                    Elasticsearch, improving low-latency event handling and making distributed-systems
                    ownership obvious in recruiter screens.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['JD-tailored', 'ATS-friendly', 'Impact-led', 'Project-focused'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
