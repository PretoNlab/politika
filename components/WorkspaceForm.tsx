
import React, { useState, useEffect } from 'react';
import { useWorkspace, Workspace } from '../context/WorkspaceContext';
import { toast } from 'react-hot-toast';

interface WorkspaceFormProps {
    onClose: () => void;
    editWorkspace?: Workspace;
}

const BRAZILIAN_STATES = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
    'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
    'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
    'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
    'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
    'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
];

/**
 * Gera sugestões de watchwords baseadas no nome do candidato, estado e região.
 * Lógica local — sem necessidade de API.
 */
function generateSmartWatchwords(candidateName: string, state: string, region: string): string[] {
    if (!candidateName.trim()) return [];

    const firstName = candidateName.trim().split(' ')[0];
    const fullName = candidateName.trim();
    const locationFocus = region.trim() || state;

    const suggestions = [
        // Nome do candidato
        fullName,
        // Primeiro nome (como é chamado popularmente)
        ...(firstName !== fullName ? [firstName] : []),
        // Contexto eleitoral local
        `eleição ${locationFocus}`,
        `candidato ${locationFocus}`,
        // Temas clássicos da política local
        `vereador ${locationFocus}`,
        `prefeito ${locationFocus}`,
        // Críticas comuns
        `${fullName} projeto`,
        `${fullName} proposta`,
    ];

    // Remover duplicatas e retornar os 6 mais relevantes
    return [...new Set(suggestions)].slice(0, 6);
}

const WorkspaceForm: React.FC<WorkspaceFormProps> = ({ onClose, editWorkspace }) => {
    const { addWorkspace, updateWorkspace } = useWorkspace();
    const isEditing = !!editWorkspace;

    const [name, setName] = useState(editWorkspace?.name || '');
    const [state, setState] = useState(editWorkspace?.state || 'Bahia');
    const [region, setRegion] = useState(editWorkspace?.region || '');
    const [candidateHandle, setCandidateHandle] = useState('');
    const [candidateName, setCandidateName] = useState(''); // Nome completo para sugestões
    const [customContext, setCustomContext] = useState(editWorkspace?.customContext || '');
    const [watchwords, setWatchwords] = useState<{term: string, context: string}[]>(
        editWorkspace?.watchwords.map(w => ({
            term: w.term,
            context: w.context || ''
        })) || []
    );
    const [newWatchwordTerm, setNewWatchwordTerm] = useState('');
    const [newWatchwordContext, setNewWatchwordContext] = useState('');
    
    // Sugestões inteligentes passam a ser geradas apenas para 'term'
    const [suggestedWatchwords, setSuggestedWatchwords] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Gerar sugestões automaticamente quando o nome do candidato muda
    useEffect(() => {
        if (!isEditing && candidateName.trim().length > 2) {
            const suggestions = generateSmartWatchwords(candidateName, state, region);
            setSuggestedWatchwords(suggestions);
            setShowSuggestions(true);
        } else {
            setSuggestedWatchwords([]);
            setShowSuggestions(false);
        }
    }, [candidateName, state, region, isEditing]);

    const handleAcceptAllSuggestions = () => {
        const addedTerms = watchwords.map(w => w.term);
        const toAdd = suggestedWatchwords
            .filter(s => !addedTerms.includes(s))
            .map(s => ({ term: s, context: '' }));
            
        if (toAdd.length > 0) {
            setWatchwords([...watchwords, ...toAdd]);
        }
        setShowSuggestions(false);
    };

    const handleAcceptSuggestion = (suggestion: string) => {
        if (!watchwords.some(w => w.term === suggestion)) {
            setWatchwords([...watchwords, { term: suggestion, context: '' }]);
        }
    };

    const handleAddWatchword = () => {
        if (!newWatchwordTerm.trim()) return;
        
        // Evita duplicatas de termos principais
        if (watchwords.some(w => w.term.toLowerCase() === newWatchwordTerm.toLowerCase().trim())) {
            toast.error('Termo já adicionado');
            return;
        }

        setWatchwords([
            ...watchwords,
            {
                term: newWatchwordTerm.trim(),
                context: newWatchwordContext.trim()
            }
        ]);
        setNewWatchwordTerm('');
        setNewWatchwordContext('');
    };

    const handleRemoveWatchword = (index: number) => {
        setWatchwords(watchwords.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Incluir o input atual se o usuário digitou e esqueceu de add
        let finalWatchwords = [...watchwords];
        if (newWatchwordTerm.trim()) {
            finalWatchwords.push({
                term: newWatchwordTerm.trim(),
                context: newWatchwordContext.trim()
            });
        }
        
        // Remove contexto vazio e passa ao backend
        const parsed = finalWatchwords.map(w => ({
            term: w.term,
            ...(w.context ? { context: w.context } : {})
        }));

        if (isEditing) {
            updateWorkspace(editWorkspace.id, {
                name,
                state,
                region,
                customContext: customContext.trim() || undefined,
                watchwords: parsed,
            });
            onClose();
        } else {
            addWorkspace({
                name,
                state,
                region,
                customContext: customContext.trim() || undefined,
                watchwords: parsed,
            }, candidateHandle);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-text-heading dark:text-white tracking-tighter uppercase font-display">
                            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
                        </h3>
                        <p className="text-xs text-text-subtle dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {isEditing ? 'Atualizar Campanha' : 'Configuração da Campanha'}
                        </p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Nome do Projeto</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: São Paulo 2026"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                        />
                    </div>

                    {/* Candidate Handle - AHA MOMENT */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                Perfil Principal (Para Análise Inicial)
                            </label>
                            <input
                                required
                                type="text"
                                value={candidateHandle}
                                onChange={(e) => setCandidateHandle(e.target.value.replace('@', ''))}
                                placeholder="Ex: candidato ou adversário (sem @)"
                                className="w-full px-5 py-4 bg-blue-50/50 dark:bg-blue-900/20 border-2 border-primary/20 rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                            />
                            <p className="text-[10px] text-slate-500 ml-2">Iremos gerar um Dossiê Estratégico automaticamente ao criar o projeto.</p>
                        </div>
                    )}

                    {/* Nome do Candidato para Sugestões (apenas criação) */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">person_search</span>
                                Nome do Candidato
                                <span className="text-slate-400 normal-case font-normal">(para sugestões)</span>
                            </label>
                            <input
                                type="text"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="Ex: João Silva"
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                            />
                        </div>
                    )}

                    {/* Estado */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Estado</label>
                        <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                        >
                            {BRAZILIAN_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Região/Cidade */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Região / Cidade <span className="text-slate-400 normal-case font-normal">(opcional)</span></label>
                        <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Ex: Grande SP, Recôncavo, Interior"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                        />
                    </div>

                    {/* Contexto político customizado */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Contexto Político Local <span className="text-slate-400 normal-case font-normal">(opcional)</span></label>
                        <textarea
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            placeholder="Ex: Eleitorado conservador no interior; eleições dominadas por duas famílias locais..."
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-sm text-text-heading dark:text-white font-medium h-20"
                        />
                    </div>

                    {/* Watchwords Dinamicas */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Termos Monitorados</label>
                        
                        {/* Lista de Termos Atuais */}
                        {watchwords.length > 0 && (
                            <div className="flex flex-col gap-2 mb-4">
                                {watchwords.map((w, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text-heading dark:text-white">{w.term}</span>
                                            {w.context && (
                                                <span className="text-[10px] text-slate-500 font-medium">Contexto: <span className="text-primary">{w.context}</span></span>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveWatchword(idx)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Formulário para Novo Termo */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-subtle dark:text-slate-400">Termo Alvo *</label>
                                <input
                                    type="text"
                                    value={newWatchwordTerm}
                                    onChange={(e) => setNewWatchwordTerm(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-subtle dark:text-slate-400">Palavra Obrigatória (And) <span className="normal-case font-normal text-slate-400">- Opcional</span></label>
                                <input
                                    type="text"
                                    value={newWatchwordContext}
                                    onChange={(e) => setNewWatchwordContext(e.target.value)}
                                    placeholder="Ex: prefeito"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                                />
                                <p className="text-[9px] text-slate-500 mt-1">Serve para filtrar homônimos. Exige que esta palavra esteja na notícia.</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddWatchword}
                                disabled={!newWatchwordTerm.trim()}
                                className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Adicionar Termo
                            </button>
                        </div>

                        {/* Sugestões automáticas */}
                        {showSuggestions && suggestedWatchwords.length > 0 && (
                            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 space-y-3 mt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                        Sugestões inteligentes
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAcceptAllSuggestions}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Adicionar todas
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedWatchwords.map((suggestion) => {
                                        const alreadyAdded = watchwords.some(w => w.term === suggestion);
                                        return (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                disabled={alreadyAdded}
                                                onClick={() => handleAcceptSuggestion(suggestion)}
                                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${alreadyAdded
                                                    ? 'bg-primary/10 text-primary/40 cursor-default'
                                                    : 'bg-white dark:bg-slate-800 text-primary border border-primary/20 hover:border-primary hover:shadow-sm'
                                                    }`}
                                            >
                                                {alreadyAdded ? '✓ ' : '+ '}{suggestion}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20">
                        {isEditing ? 'Salvar Alterações' : 'Criar Campanha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceForm;
