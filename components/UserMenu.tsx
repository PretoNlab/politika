import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center border-2 border-primary/20 hover:opacity-90 transition-all"
        title={fullName}
      >
        {initials || '?'}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <p className="text-sm font-bold text-text-heading dark:text-white truncate">
              {fullName}
            </p>
            <p className="text-xs text-text-subtle dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
