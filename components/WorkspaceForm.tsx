
import React, { useState } from 'react';
import { useWorkspace, Workspace } from '../context/WorkspaceContext';

interface WorkspaceFormProps {
    onClose: () => void;
    editWorkspace?: Workspace;
}

const WorkspaceForm: React.FC<WorkspaceFormProps> = ({ onClose, editWorkspace }) => {
    const { addWorkspace, updateWorkspace } = useWorkspace();
    const isEditing = !!editWorkspace;

    const [name, setName] = useState(editWorkspace?.name || '');
    const [region, setRegion] = useState(editWorkspace?.region || 'Metropolitana de Salvador');
    const [watchwords, setWatchwords] = useState(editWorkspace?.watchwords.join(', ') || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = watchwords.split(',').map(w => w.trim()).filter(w => w !== '');

        if (isEditing) {
            updateWorkspace(editWorkspace.id, { name, region, watchwords: parsed });
        } else {
            addWorkspace({ name, region, watchwords: parsed });
        }
        onClose();
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

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Nome do Projeto</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Salvador 2024"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Região de Monitoramento</label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-text-heading dark:text-white font-bold"
                        >
                            <option>Metropolitana de Salvador</option>
                            <option>Recôncavo</option>
                            <option>Centro-Norte Baiano</option>
                            <option>Oeste Baiano</option>
                            <option>Sul Baiano</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-slate-400 ml-1">Watchwords (Separadas por vírgula)</label>
                        <textarea
                            value={watchwords}
                            onChange={(e) => setWatchwords(e.target.value)}
                            placeholder="Ex: prefeitura, asfalto, saude, candidato"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-sm text-text-heading dark:text-white font-medium h-24"
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
