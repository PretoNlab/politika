import React, { useState } from 'react';
import { useWorkspace, Workspace } from '../context/WorkspaceContext';
import WorkspaceForm from './WorkspaceForm';
import { useNavigate } from 'react-router-dom';

const Workspaces: React.FC = () => {
    const { workspaces, activeWorkspace, setActiveWorkspace, deleteWorkspace } = useWorkspace();
    const [showAddForm, setShowAddForm] = useState(false);
    const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | undefined>(undefined);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
    const navigate = useNavigate();

    const handleSelect = (workspace: Workspace) => {
        setActiveWorkspace(workspace);
        navigate('/');
    };

    const handleDeleteClick = (e: React.MouseEvent, workspace: Workspace) => {
        e.stopPropagation(); // Avoid triggering selection
        setWorkspaceToDelete(workspace);
    };

    const confirmDelete = () => {
        if (workspaceToDelete) {
            deleteWorkspace(workspaceToDelete.id);
            setWorkspaceToDelete(null);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10 animate-reveal">
            {/* Custom Confirmation Modal */}
            {workspaceToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-reveal">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-8">
                        <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto">
                            <span className="material-symbols-outlined text-4xl">delete_forever</span>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-text-heading dark:text-white tracking-tighter uppercase font-display italic">
                                Excluir Campanha?
                            </h3>
                            <p className="text-text-subtle dark:text-slate-400 text-sm font-medium">
                                Você está prestes a apagar todos os dados de <span className="text-text-heading dark:text-white font-black italic">"{workspaceToDelete.name}"</span>. Esta ação é irreversível.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                            >
                                Sim, Excluir Agora
                            </button>
                            <button
                                onClick={() => setWorkspaceToDelete(null)}
                                className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-text-heading dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="size-3 bg-primary rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Workspace Hub</span>
                    </div>
                    <h2 className="text-5xl font-black text-text-heading dark:text-white tracking-tighter uppercase font-display">
                        Suas Campanhas
                    </h2>
                    <p className="text-text-subtle dark:text-slate-400 font-medium max-w-lg">
                        Gerencie múltiplos perfis e regiões. Cada workspace possui suas próprias watchwords e inteligência.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nova Campanha
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workspaces.map((workspace) => (
                    <div
                        key={workspace.id}
                        onClick={() => handleSelect(workspace)}
                        className={`group relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 border transition-all cursor-pointer hover:shadow-2xl hover:scale-102 ${activeWorkspace?.id === workspace.id
                            ? 'border-primary ring-1 ring-primary shadow-xl shadow-primary/5'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                            }`}
                    >
                        {activeWorkspace?.id === workspace.id && (
                            <div className="absolute top-8 right-16 flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-full z-10">
                                <span className="size-1.5 bg-white rounded-full animate-pulse"></span>
                                <span className="text-[8px] font-black uppercase tracking-widest">Ativo</span>
                            </div>
                        )}

                        <div className="absolute top-8 right-8 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                                onClick={(e) => { e.stopPropagation(); setWorkspaceToEdit(workspace); setShowAddForm(true); }}
                                className="size-10 rounded-full flex items-center justify-center text-slate-300 hover:text-primary hover:bg-primary/10 transition-all"
                                title="Editar Campanha"
                            >
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button
                                onClick={(e) => handleDeleteClick(e, workspace)}
                                className="size-10 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Excluir Campanha"
                            >
                                <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="size-14 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">corporate_fare</span>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-text-heading dark:text-white tracking-tighter uppercase italic line-clamp-1">
                                    {workspace.name}
                                </h3>
                                <div className="flex items-center gap-2 text-text-subtle dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="text-xs font-bold">{workspace.region}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {workspace.watchwords.map((word, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-black text-text-subtle dark:text-slate-300 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => setShowAddForm(true)}
                    className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary transition-all flex flex-col items-center justify-center space-y-4 group h-72 text-slate-400 hover:text-primary"
                >
                    <div className="size-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-primary/5">
                        <span className="material-symbols-outlined">add_circle</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Criar Nova Campanha</span>
                </button>
            </div>

            {showAddForm && <WorkspaceForm onClose={() => { setShowAddForm(false); setWorkspaceToEdit(undefined); }} editWorkspace={workspaceToEdit} />}
        </div>
    );
};

export default Workspaces;
