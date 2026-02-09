import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useCrisisAnalysis } from '../hooks/useCrisisAnalysis';
import { ALL_ALLOWED_MEDIA_TYPES, FILE_SIZE_LIMITS } from '../constants';
import { isValidFileSize, isValidMimeType } from '../utils/security';

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
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600 text-5xl animate-pulse">warning</span>
          War Room: Inteligência Multimodal
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Analise ataques em vídeo, áudio ou texto com grounding em tempo real e geolocalização.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <textarea
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-6 text-lg focus:ring-2 focus:ring-red-500/20 min-h-[120px] transition-all"
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
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed transition-all font-bold ${
              mediaFile
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-200 dark:border-slate-700 text-slate-500'
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
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <span className="material-symbols-outlined">error</span>
            <p className="font-bold">{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || (!input.trim() && !mediaFile)}
          className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-xl disabled:opacity-50"
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
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Grounding Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
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
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">link</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors flex-1 line-clamp-1">
                      {source.title}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm">arrow_outward</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Crisis Summary */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600 text-3xl">crisis_alert</span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Resumo do Incidente</h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                  {result.incidentSummary}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Severidade
                </span>
                <div
                  className={`px-6 py-3 rounded-full font-black text-lg ${
                    result.severityLevel === 'Crítico'
                      ? 'bg-red-600 text-white'
                      : result.severityLevel === 'Alto'
                      ? 'bg-orange-500 text-white'
                      : result.severityLevel === 'Médio'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {result.severityLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Responses */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">strategy</span>
              Estratégias de Resposta
            </h3>

            <div className="grid gap-6">
              {result.responses.map((response, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-primary transition-colors"
                >
                  <h4 className="text-xl font-bold text-primary">{response.strategyName}</h4>
                  <p className="text-slate-600 dark:text-slate-400">{response.description}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Pontos de Ação:</p>
                    <ul className="space-y-1">
                      {response.actionPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                            check_circle
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {response.suggestedScript && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 mb-2">Script Sugerido:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "{response.suggestedScript}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation Section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rate_review</span>
              Avaliar Resposta Proposta
            </h3>

            <textarea
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 text-lg focus:ring-2 focus:ring-primary/20 min-h-[150px]"
              placeholder="Cole aqui sua resposta oficial proposta para avaliação..."
              value={proposedDraft}
              onChange={(e) => setProposedDraft(e.target.value)}
              disabled={evalLoading}
            />

            <button
              onClick={handleEvaluate}
              disabled={evalLoading || !proposedDraft.trim()}
              className="w-full py-4 bg-primary hover:opacity-90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Score de Eficácia</p>
                    <p className="text-3xl font-black text-primary">{evaluation.score}/10</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Veredito</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{evaluation.verdict}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-bold text-green-600">Pontos Fortes:</p>
                    <ul className="space-y-1">
                      {evaluation.pros.map((pro: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-600 text-sm">check</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-red-600">Pontos de Melhoria:</p>
                    <ul className="space-y-1">
                      {evaluation.cons.map((con: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="material-symbols-outlined text-red-600 text-sm">close</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Versão Otimizada:</p>
                  <p className="text-slate-700 dark:text-slate-300">{evaluation.optimizedVersion}</p>
                </div>
              </div>
            )}
          </div>

          {showResetConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                Sim, descartar análise
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:border-slate-300 transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:border-primary hover:text-primary transition-all font-bold"
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
