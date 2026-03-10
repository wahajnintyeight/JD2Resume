'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileText,
  Trash2,
  Settings,
  Plus,
  CheckCircle2,
  Info,
  Search,
  ChevronRight,
  Bell,
  User,
  LayoutDashboard,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import { fetchResumeList, deleteResume, type ResumeListItem } from '@/lib/api/resume';
import { useIsMobile } from '@/hooks/use-mobile';

type ResumeItem = {
  id: string;
  name: string;
  date: string;
  isMaster: boolean;
  size: string;
};

export default function Dashboard() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const isMobile = useIsMobile();
  const router = useRouter();

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await fetchResumeList(true);
      const mappedResumes: ResumeItem[] = data.map((r: ResumeListItem) => ({
        id: r.resume_id,
        name: r.filename || r.title || 'Untitled',
        date: new Date(r.updated_at || r.created_at).toLocaleDateString(),
        isMaster: r.is_master,
        size: '1.2 MB', // Mock size
      }));
      setResumes(mappedResumes);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const removeResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await deleteResume(id);
      await loadResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const openResume = (id: string) => router.push(`/resumes/${id}`);
  const goTailor = () => router.push('/tailor');
  const goSettings = () => router.push('/settings');
  const goDashboard = () => router.push('/dashboard');

  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {isMobile ? (
          <MobileDashboard
            key="mobile"
            resumes={filteredResumes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onRemove={removeResume}
            onCreateFromJd={goTailor}
            onOpenResume={openResume}
            onGoDashboard={goDashboard}
            onGoSettings={goSettings}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            loading={loading}
          />
        ) : (
          <DesktopDashboard
            key="desktop"
            resumes={filteredResumes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onRemove={removeResume}
            onCreateFromJd={goTailor}
            onOpenResume={openResume}
            onGoDashboard={goDashboard}
            onGoSettings={goSettings}
            loading={loading}
          />
        )}
      </AnimatePresence>

      <ResumeUploadDialog
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          setIsUploadModalOpen(false);
          loadResumes();
        }}
      />
    </main>
  );
}

interface DesktopDashboardProps {
  resumes: ResumeItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  onRemove: (id: string) => void;
  onCreateFromJd: () => void;
  onOpenResume: (id: string) => void;
  onGoDashboard: () => void;
  onGoSettings: () => void;
  loading: boolean;
}

function DesktopDashboard({
  resumes,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onRemove,
  onCreateFromJd,
  onOpenResume,
  onGoDashboard,
  onGoSettings,
  loading,
}: DesktopDashboardProps) {
  const hasMaster = resumes.some((resume) => resume.isMaster);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative z-10 flex flex-col min-h-screen"
    >

      <div className="flex-1 mx-auto w-full max-w-7xl px-8 py-20 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-20">
        <div className="space-y-20">
          <section>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Workspace Overview</span>
              </div>
              <h1 className="text-8xl font-bold leading-[0.88] tracking-tighter text-white">
                Your Career,<br />Refined.
              </h1>
              <p className="mt-8 max-w-xl text-xl text-white/40 font-medium leading-relaxed">
                Manage your professional identity with precision. Tailor your master resume to any job description in seconds.
              </p>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-12 flex flex-wrap gap-4"
            >
              <Button size="lg" onClick={onCreateFromJd} className="group">
                <Plus className="h-5 w-5" />
                Tailor from JD
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={onUploadClick}>
                <Upload className="h-5 w-5" />
                Upload Master
              </Button>
            </motion.div>
          </section>

          <section className="space-y-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white">Documents</h2>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/20">
                  {resumes.length} items in your library
                </p>
              </div>
              <div className="w-full max-w-xs relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input
                  placeholder="Search library..."
                  className="pl-12 bg-white/[0.02] border-white/5 rounded-full focus:bg-white/[0.05] transition-all"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                </div>
              ) : resumes.map((resume, idx) => (
                <motion.div
                  key={resume.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Card 
                    variant="interactive"
                    className="group"
                    onClick={() => onOpenResume(resume.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-8">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-white/40 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500/20 transition-all duration-500">
                            <FileText className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                              {resume.name}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                              <span className="flex items-center gap-1.5">
                                <LayoutDashboard className="h-3 w-3" />
                                {resume.date}
                              </span>
                              <span className="h-3 w-px bg-white/10" />
                              <span>{resume.size}</span>
                              {resume.isMaster && (
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Master
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onOpenResume(resume.id); }}
                          >
                            Open
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:bg-red-500/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); onRemove(resume.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {!loading && resumes.length === 0 && (
                <div className="p-24 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02] backdrop-blur-sm">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-white/10 mb-8">
                    <FileText className="h-12 w-12" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-white">No documents found</h3>
                  <p className="mt-4 text-white/40 max-w-sm mx-auto text-lg font-medium">
                    {searchQuery ? 'Try a different search term.' : 'Start by uploading your master resume.'}
                  </p>
                  <Button
                    onClick={onUploadClick}
                    className="mt-10"
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                    Upload Now
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-12">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/[0.02] border-white/5 p-10 space-y-10">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-8">Library Stats</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Resumes</span>
                    <span className="text-2xl font-bold text-white">{resumes.length}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Master Status</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", hasMaster ? "text-emerald-400" : "text-red-400")}>
                      {hasMaster ? "Complete" : "Missing"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Profile Strength</span>
                  <span className="text-xs font-bold text-white">85%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.4)]" style={{ width: '85%' }} />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="outline" className="p-10 bg-indigo-500/[0.02] border-indigo-500/10">
              <div className="flex items-start gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Insights</p>
                  <p className="mt-4 text-base text-white/40 font-medium leading-relaxed">
                    Tailored resumes increase interview chances by 40%. Use &quot;Tailor New&quot; to optimize for specific roles.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="outline" className="p-10 bg-emerald-500/[0.02] border-emerald-500/10">
              <div className="flex items-start gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">System Status</p>
                  <p className="mt-4 text-base text-white/40 font-medium leading-relaxed">
                    All optimization models are online and ready for processing.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}

interface MobileDashboardProps extends DesktopDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function MobileDashboard({
  resumes,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onRemove,
  onCreateFromJd,
  onOpenResume,
  onGoDashboard,
  onGoSettings,
  activeTab,
  onTabChange,
  loading,
}: MobileDashboardProps) {
  const hasMaster = resumes.some((resume) => resume.isMaster);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-28 relative z-10 min-h-screen"
    >
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-white">Resume Master</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Dashboard</div>
          </div>
        </div>
        <Button size="icon" variant="outline" onClick={onGoSettings} className="rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
      </header>

      <div className="px-6 py-10 space-y-10">
        <section>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-5xl font-bold tracking-tighter text-white leading-[0.95]">
              Hello,<br />Professional.
            </h1>
            <p className="mt-6 text-white/40 text-lg font-medium leading-relaxed">
              Your career library is ready.
            </p>
          </motion.div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-4 p-6 text-left border-white/5 bg-white/[0.02] rounded-[2rem]"
            onClick={onCreateFromJd}
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Tailor New</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-4 p-6 text-left border-white/5 bg-white/[0.02] rounded-[2rem]"
            onClick={onUploadClick}
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
          </Button>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">Library</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
              {resumes.length} Items
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              </div>
            ) : resumes.map((resume, idx) => (
              <motion.div
                key={resume.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  variant="interactive"
                  className="group"
                  onClick={() => onOpenResume(resume.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white/40 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight text-white leading-tight">{resume.name}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/20">
                            {resume.date} • {resume.size}
                          </p>
                          {resume.isMaster && (
                            <span className="mt-3 inline-flex border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                              Master Set
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 opacity-50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(resume.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!loading && resumes.length === 0 && (
              <div className="p-16 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-white/10 mb-6">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">Empty Library</h3>
                <Button
                  onClick={onUploadClick}
                  className="mt-8 w-full"
                >
                  Upload Master
                </Button>
              </div>
            )}
          </div>
        </section>

        <Card variant="outline" className="bg-indigo-500/[0.02] border-indigo-500/10 p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Quick Tip</p>
              <p className="mt-3 text-sm text-white/40 font-medium leading-relaxed">
                Always keep your master resume up to date for the best AI tailoring results.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl pb-safe z-50">
        <div className="grid grid-cols-4 h-20">
          {[
            { id: 'home', label: 'Home', icon: LayoutDashboard, action: onGoDashboard },
            { id: 'tailor', label: 'Tailor', icon: Sparkles, action: onCreateFromJd },
            { id: 'upload', label: 'Upload', icon: Plus, action: onUploadClick },
            { id: 'settings', label: 'Settings', icon: Settings, action: onGoSettings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  tab.action();
                  onTabChange(tab.id);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isActive ? 'text-indigo-400' : 'text-white/20'
                }`}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive && "bg-indigo-500/10 text-indigo-400"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
