
import React, { useState } from 'react';
import { useWorkspace, Workspace } from '../context/WorkspaceContext';

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

const WorkspaceForm: React.FC<WorkspaceFormProps> = ({ onClose, editWorkspace }) => {
    const { addWorkspace, updateWorkspace } = useWorkspace();
    const isEditing = !!editWorkspace;

    const [name, setName] = useState(editWorkspace?.name || '');
    const [state, setState] = useState(editWorkspace?.state || 'Bahia');
    const [region, setRegion] = useState(editWorkspace?.region || '');
    const [candidateHandle, setCandidateHandle] = useState(''); // NEW FIELD for PLG Onboarding
    const [customContext, setCustomContext] = useState(editWorkspace?.customContext || '');
    const [watchwords, setWatchwords] = useState(editWorkspace?.watchwords.join(', ') || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = watchwords.split(',').map(w => w.trim()).filter(w => w !== '');

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
            }, candidateHandle); // Pass handle to addWorkspace to trigger the generation
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
                            {isEditing ? 'Atualizar Workspace' : 'Configuração de Workspace'}
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

                    {/* Candidate Handle - MUST HAVE FOR PLG AHA MOMENT */}
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

                    {/* Watchwords */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Watchwords <span className="text-slate-400 normal-case font-normal">(separadas por vírgula)</span></label>
                        <textarea
                            value={watchwords}
                            onChange={(e) => setWatchwords(e.target.value)}
                            placeholder="Ex: prefeitura, saúde, candidato, segurança"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-sm text-text-heading dark:text-white font-medium h-20"
                        />
                    </div>

                    <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20">
                        {isEditing ? 'Salvar Alterações' : 'Criar Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkspaceForm;
