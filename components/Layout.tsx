import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import UserMenu from './UserMenu';
import OnboardingChecklist from './OnboardingChecklist';
import { useLifecycleStore } from '../store/lifecycleStore';
import { useLifecycleSignals } from '../hooks/useLifecycleSignals';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Lifecycle: track page visits and milestone signals
  const recordPageVisit = useLifecycleStore(s => s.recordPageVisit);
  const completeStep = useLifecycleStore(s => s.completeStep);
  useLifecycleSignals();

  useEffect(() => {
    recordPageVisit(location.pathname);

    // Auto-complete onboarding steps based on page visits
    const pathToStep: Record<string, string> = {
      '/pulse': 'visit_radar',
      '/crisis': 'visit_warroom',
    };
    const stepId = pathToStep[location.pathname];
    if (stepId) completeStep(stepId);
  }, [location.pathname, recordPageVisit, completeStep]);

  // Close menu on click outside
  useEffect(() => {
    if (!showWorkspaceMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showWorkspaceMenu]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      {/* Header */}
      <header className="w-full h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
        <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">radar</span>
            </div>
            <h2 className="text-text-heading dark:text-white text-xl font-black tracking-tighter">Politika</h2>
          </Link>

          <div className="flex flex-1 justify-end gap-8 items-center">
            {/* Workspace Switcher */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-all group"
              >
                <span className="material-symbols-outlined text-lg text-primary">folder_shared</span>
                <span className="text-xs font-black uppercase tracking-widest text-text-heading dark:text-white max-w-[120px] truncate">
                  {activeWorkspace?.name || 'Selecionar Projeto'}
                </span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:rotate-180 transition-transform">expand_more</span>
              </button>

              {showWorkspaceMenu && (
                <div className="absolute top-12 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternar Projeto</p>
                  </div>
                  {workspaces.map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setActiveWorkspace(w);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${activeWorkspace?.id === w.id ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <span className="text-xs font-bold">{w.name}</span>
                      {activeWorkspace?.id === w.id && <span className="material-symbols-outlined text-sm">check_circle</span>}
                    </button>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to="/workspaces"
                      onClick={() => setShowWorkspaceMenu(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black text-primary uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-sm">settings</span>
                      Gerenciar Projetos
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-9">
              <Link to="/dashboard" className={`text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 ${isActive('/dashboard') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                QG
              </Link>
              <Link to="/pulse" className={`text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5 ${isActive('/pulse') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
                <span className="material-symbols-outlined text-sm">radar</span>
                Radar
              </Link>
              <Link to="/analyze" className={`text-sm font-medium transition-all hover:scale-105 ${isActive('/analyze') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>Analisar</Link>
              <Link to="/crisis" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/crisis') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-red-600'}`}>
                <span className="material-symbols-outlined text-lg text-red-600">warning</span>
                War Room
              </Link>
              <Link to="/history" className={`text-sm font-medium transition-colors ${isActive('/history') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>Histórico</Link>
            </nav>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10">
        <div className="max-w-[1200px] mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Politika</p>
            <p className="text-xs text-slate-500">Inteligência Política de Precisão.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacidade</Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Termos</Link>
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Acesso Restrito - Equipe de Campanha</p>
        </div>
      </footer>

      <OnboardingChecklist />
    </div>
  );
};

export default Layout;
