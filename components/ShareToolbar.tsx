import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface ShareToolbarProps {
  analysisId: string;
  type: 'insight' | 'comparison';
}

const ShareToolbar: React.FC<ShareToolbarProps> = ({ analysisId, type }) => {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const base = window.location.origin + window.location.pathname;
    const route = type === 'insight' ? 'insight-detail' : 'comparison-detail';
    return `${base}#/${route}/${analysisId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Politika - Análise Estratégica',
          text: 'Confira esta análise política no Politika',
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">
          {copied ? 'check' : 'link'}
        </span>
        {copied ? 'Copiado!' : 'Copiar Link'}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-bold text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">share</span>
        Compartilhar
      </button>
    </div>
  );
};

export default ShareToolbar;
