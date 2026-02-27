import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useCrisisAnalysis } from '../hooks/useCrisisAnalysis';
import { useAnalytics } from '../hooks/useAnalytics';
import { ALL_ALLOWED_MEDIA_TYPES, FILE_SIZE_LIMITS } from '../constants';
import { isValidFileSize, isValidMimeType } from '../utils/security';
import SpotlightCard from './ui/SpotlightCard';

const CrisisManagement: React.FC = () => {
  const [input, setInput] = useState('');
  const [mediaFile, setMediaFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [proposedDraft, setProposedDraft] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading,
    evalLoading,
    error,
    result,
    evaluation,
    analyzeCrisis,
    evaluateResponseDraft,
    reset
  } = useCrisisAnalysis();
  const { track } = useAnalytics();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validação de tamanho
    if (!isValidFileSize(file.size, FILE_SIZE_LIMITS.maxSizeMB)) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${FILE_SIZE_LIMITS.maxSizeMB}MB`);
      e.target.value = '';
      return;
    }

    // Validação de tipo
    if (!isValidMimeType(file.type, ALL_ALLOWED_MEDIA_TYPES)) {
      toast.error('Tipo de arquivo não suportado. Use vídeo, áudio ou imagem.');
      e.target.value = '';
      return;
    }

    // Lê o arquivo
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        setMediaFile({
          data: base64,
          mimeType: file.type,
          name: file.name
        });
        toast.success('Arquivo carregado com sucesso!');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error('Erro ao processar o arquivo');
      }
    };

    reader.onerror = () => {
      console.error('Erro ao ler arquivo');
      toast.error('Erro ao ler o arquivo');
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    track('crisis_analysed', {
      scenario_keywords: input.trim().split(' ').slice(0, 5),
    });
    await analyzeCrisis(input, mediaFile || undefined);
  };

  const handleEvaluate = async () => {
    await evaluateResponseDraft(proposedDraft);
  };

  const handleReset = () => {
    setInput('');
    setMediaFile(null);
    setProposedDraft('');
    setShowResetConfirm(false);
    reset();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-text-heading flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600 text-5xl animate-pulse">warning</span>
          War Room: Inteligência Multimodal
        </h1>
        <p className="text-text-subtle">
          Analise ataques em vídeo, áudio ou texto com grounding em tempo real e geolocalização.
        </p>
      </div>

      {/* Input Card */}
      <SpotlightCard className="p-8 border border-border-light shadow-md space-y-6">
        <textarea
          className="w-full bg-surface border border-border-light rounded-3xl p-6 text-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 min-h-[120px] transition-all text-text-heading placeholder-text-subtle/50 outline-none"
          placeholder="Descreva o incidente ou cole o link da notícia..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />

        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*,audio/*,image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed transition-all font-bold ${mediaFile
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border-light text-text-subtle hover:border-primary/50 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined">
              {mediaFile ? 'check_circle' : 'upload_file'}
            </span>
            {mediaFile ? `Mídia: ${mediaFile.name}` : 'Anexar Vídeo/Áudio de Ataque'}
          </button>

          {mediaFile && (
            <button
              onClick={() => setMediaFile(null)}
              className="text-red-500 font-bold text-xs hover:underline"
            >
              Remover anexo
            </button>
          )}
        </div>

        {/* Media Preview */}
        {mediaFile && (
          <div className="rounded-2xl overflow-hidden border border-border-light bg-surface shadow-inner">
            {mediaFile.mimeType.startsWith('image/') && (
              <img
                src={`data:${mediaFile.mimeType};base64,${mediaFile.data}`}
                alt="Preview"
                className="max-h-48 w-auto mx-auto object-contain"
              />
            )}
            {mediaFile.mimeType.startsWith('video/') && (
              <video
                src={`data:${mediaFile.mimeType};base64,${mediaFile.data}`}
                controls
                className="max-h-48 w-full"
              />
            )}
            {mediaFile.mimeType.startsWith('audio/') && (
              <div className="p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">graphic_eq</span>
                <audio
                  src={`data:${mediaFile.mimeType};base64,${mediaFile.data}`}
                  controls
                  className="flex-1"
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
            <span className="material-symbols-outlined">error</span>
            <p className="font-bold">{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || (!input.trim() && !mediaFile)}
          className="w-full py-5 bg-text-heading hover:bg-black text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-xl disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Sincronizando Grounding e Analisando Mídia...</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined">security_update_good</span>
              Ativar Contra-Medida Estratégica
            </>
          )}
        </button>
      </SpotlightCard>

      {/* Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Grounding Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-text-subtle tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">travel_explore</span>
                Fontes de Inteligência em Tempo Real
              </p>
              <div className="grid gap-2">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">link</span>
                    <span className="text-sm font-medium text-text-subtle group-hover:text-primary transition-colors flex-1 line-clamp-1">
                      {source.title}
                    </span>
                    <span className="material-symbols-outlined text-text-subtle/50 text-sm group-hover:text-primary">arrow_outward</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Crisis Summary */}
          <div className="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600 text-3xl">crisis_alert</span>
                  <h2 className="text-2xl font-black text-text-heading">Resumo do Incidente</h2>
                </div>
                <p className="text-text-heading text-lg leading-relaxed font-medium">
                  {result.incidentSummary}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <span className="text-[10px] font-black uppercase text-text-subtle tracking-widest">
                  Severidade
                </span>
                <div
                  className={`px-6 py-3 rounded-full font-black text-lg ${result.severityLevel === 'Crítico'
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                    : result.severityLevel === 'Alto'
                      ? 'bg-orange-500 text-white shadow-md'
                      : result.severityLevel === 'Médio'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-emerald-500 text-white shadow-sm'
                    }`}
                >
                  {result.severityLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Responses */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-text-heading flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">strategy</span>
              Estratégias de Resposta
            </h3>

            <div className="grid gap-6">
              {result.responses.map((response, idx) => (
                <SpotlightCard
                  key={idx}
                  className="p-6 border border-border-light space-y-4 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <h4 className="text-xl font-bold text-primary">{response.strategyName}</h4>
                  <p className="text-text-subtle text-base font-medium">{response.description}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-text-heading">Pontos de Ação:</p>
                    <ul className="space-y-2">
                      {response.actionPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-subtle font-medium">
                          <span className="material-symbols-outlined text-primary mt-0.5">
                            check_circle
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {response.suggestedScript && (
                    <div className="p-5 bg-surface rounded-2xl border border-border-light mt-4">
                      <p className="text-xs font-black uppercase tracking-widest text-text-subtle mb-3">Script Sugerido</p>
                      <p className="text-base text-text-heading italic font-medium">
                        "{response.suggestedScript}"
                      </p>
                    </div>
                  )}
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Evaluation Section */}
          <SpotlightCard className="p-8 border border-border-light space-y-6 shadow-md">
            <h3 className="text-xl font-bold text-text-heading flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rate_review</span>
              Avaliar Resposta Proposta
            </h3>

            <textarea
              className="w-full bg-surface border border-border-light rounded-2xl p-6 text-lg focus:ring-2 focus:border-primary/30 focus:ring-primary/20 min-h-[150px] outline-none text-text-heading placeholder-text-subtle/50"
              placeholder="Cole aqui sua resposta oficial proposta para avaliação..."
              value={proposedDraft}
              onChange={(e) => setProposedDraft(e.target.value)}
              disabled={evalLoading}
            />

            <button
              onClick={handleEvaluate}
              disabled={evalLoading || !proposedDraft.trim()}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {evalLoading ? (
                <>
                  <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Avaliando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">analytics</span>
                  Avaliar Eficácia
                </>
              )}
            </button>

            {evaluation && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                  <div>
                    <p className="text-sm text-text-subtle font-bold">Score de Eficácia</p>
                    <p className="text-3xl font-black text-primary">{evaluation.score}/10</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-subtle font-bold">Veredito</p>
                    <p className="text-lg font-black text-text-heading">{evaluation.verdict}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase text-emerald-600 tracking-widest">Pontos Fortes</p>
                    <ul className="space-y-2">
                      {evaluation.pros.map((pro: string, i: number) => (
                        <li key={i} className="text-sm text-text-subtle font-medium flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-600 mt-0.5">check_circle</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase text-red-600 tracking-widest">Pontos de Melhoria</p>
                    <ul className="space-y-2">
                      {evaluation.cons.map((con: string, i: number) => (
                        <li key={i} className="text-sm text-text-subtle font-medium flex items-start gap-2">
                          <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl mt-4">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-3">Versão Otimizada Proposta</p>
                  <p className="text-base text-text-heading font-medium leading-relaxed italic">"{evaluation.optimizedVersion}"</p>
                </div>
              </div>
            )}
          </SpotlightCard>

          {showResetConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md transition-all"
              >
                Sim, descartar análise
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 border-2 border-border-light text-text-subtle bg-white rounded-xl font-bold hover:border-slate-300 hover:text-text-heading transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-4 bg-white border-2 border-border-light text-text-subtle rounded-xl shadow-sm hover:border-text-heading/30 hover:text-text-heading transition-all font-bold"
            >
              Nova Análise
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CrisisManagement;
