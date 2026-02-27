import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-hot-toast';

type OnboardingStep = 'acesso' | 'perfil' | 'projeto' | 'pronto';

const OnboardingFlow: React.FC = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { addWorkspace } = useWorkspace();

    const [currentStep, setCurrentStep] = useState<OnboardingStep>('acesso');
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: '', // candidato, assessor, outro
        workspaceName: '',
        state: '',
        region: '',
        customContext: ''
    });

    const handleNext = useCallback(() => {
        if (currentStep === 'acesso') setCurrentStep('perfil');
        else if (currentStep === 'perfil') setCurrentStep('projeto');
        else if (currentStep === 'projeto') setCurrentStep('pronto');
    }, [currentStep]);

    const handleBack = useCallback(() => {
        if (currentStep === 'perfil') setCurrentStep('acesso');
        else if (currentStep === 'projeto') setCurrentStep('perfil');
        else if (currentStep === 'pronto') setCurrentStep('projeto');
    }, [currentStep]);

    const handleAcessoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signUp(formData.email, formData.password, formData.fullName);
            if (error) throw new Error(error);

            toast.success('Conta criada! Verifique seu e-mail para continuar.');
            handleNext();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { id: 'acesso', label: 'Acesso', icon: 'person' },
            { id: 'perfil', label: 'Perfil', icon: 'badge' },
            { id: 'projeto', label: 'Projeto', icon: 'add_location_alt' },
            { id: 'pronto', label: 'Pronto', icon: 'verified' }
        ];

        return (
            <div className="flex items-center justify-between mb-12 max-w-md mx-auto relative px-4">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border-light -z-10 -translate-y-1/2"></div>
                {steps.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isPast = steps.findIndex(s => s.id === currentStep) > idx;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' :
                                    isPast ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                                }`}>
                                <span className="material-symbols-outlined text-xl">{isPast ? 'check' : step.icon}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 pt-32 pb-20 font-sans">
            <div className="absolute inset-0 premium-grid opacity-30 pointer-events-none"></div>

            {/* Branding */}
            <div className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer z-50" onClick={() => navigate('/')}>
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">radar</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">Politika</span>
            </div>

            <main className="w-full max-w-xl animate-fade-up relative z-10">
                {renderStepIndicator()}

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50">
                    {currentStep === 'acesso' && (
                        <form onSubmit={handleAcessoSubmit} className="space-y-8">
                            <div className="text-center space-y-2 mb-10">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Crie sua conta</h1>
                                <p className="text-slate-500 font-medium italic">Sua central de inteligência começa aqui.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900 font-medium"
                                        placeholder="Ex: João Silva"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">E-mail Profissional</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900 font-medium"
                                        placeholder="contato@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Senha de Acesso</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900 font-medium"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                                >
                                    {loading ? 'Processando...' : 'Próxima Etapa'}
                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                </button>
                                <p className="text-center text-sm text-slate-500 mt-6 font-medium">
                                    Já possui acesso? <button type="button" onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">Fazer Login</button>
                                </p>
                            </div>
                        </form>
                    )}

                    {currentStep === 'perfil' && (
                        <div className="space-y-10">
                            <div className="text-center space-y-2 mb-10">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Qual seu papel?</h1>
                                <p className="text-slate-500 font-medium italic">Personalizaremos as análises para sua função.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'candidato', label: 'Candidato(a)', desc: 'Foco em imagem e monitoramento de adversários.', icon: 'person_search' },
                                    { id: 'assessor', label: 'Assessor(a) / Estrategista', desc: 'Foco em dados táticos e relatórios rápidos.', icon: 'groups' },
                                    { id: 'comunicacao', label: 'Equipe de Comunicação', desc: 'Foco em narrativa e gestão de crises.', icon: 'campaign' }
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => { setFormData({ ...formData, role: role.id }); handleNext(); }}
                                        className={`group flex items-center gap-6 p-6 rounded-3xl border text-left transition-all duration-300 hover:border-primary/30 hover:bg-slate-50 ${formData.role === role.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5 shadow-inner' : 'border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.role === role.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                            }`}>
                                            <span className="material-symbols-outlined text-2xl">{role.icon}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{role.label}</h3>
                                            <p className="text-sm font-medium text-slate-500 leading-tight">{role.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleBack}
                                className="w-full text-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    )}

                    {currentStep === 'projeto' && (
                        <div className="space-y-10">
                            <div className="text-center space-y-2 mb-10">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Seu primeiro projeto</h1>
                                <p className="text-slate-500 font-medium italic">Defina a região de monitoramento.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Nome do Workspace</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900"
                                        placeholder="Ex: Campanha Prefeito 2026"
                                        value={formData.workspaceName}
                                        onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Estado</label>
                                        <select
                                            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900 appearance-none bg-white"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="BA">Bahia</option>
                                            <option value="SP">São Paulo</option>
                                            <option value="RJ">Rio de Janeiro</option>
                                            <option value="MG">Minas Gerais</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Cidade / Região</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900"
                                            placeholder="Ex: Salvador"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 space-y-4">
                                <button
                                    onClick={async () => {
                                        if (!formData.workspaceName) {
                                            toast.error('Dê um nome ao seu projeto');
                                            return;
                                        }
                                        setLoading(true);
                                        try {
                                            await addWorkspace({
                                                name: formData.workspaceName,
                                                state: formData.state,
                                                region: formData.region,
                                                customContext: formData.customContext,
                                                watchwords: [] // Initial watchwords
                                            });
                                            handleNext();
                                        } catch (error: any) {
                                            toast.error('Erro ao configurar projeto.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {loading ? 'Configurando...' : 'Finalizar Configuração'}
                                    <span className="material-symbols-outlined text-xl">analytics</span>
                                </button>
                                <button
                                    onClick={handleBack}
                                    disabled={loading}
                                    className="w-full text-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'pronto' && (
                        <div className="text-center space-y-10 animate-reveal">
                            <div className="size-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                                <span className="material-symbols-outlined text-5xl">check_circle</span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Configuração Concluída.</h1>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed italic">
                                    Sua central está sendo preparada. Em breve, você receberá um e-mail com seus primeiros insights estratégicos.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-left space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="material-symbols-outlined text-xl">info</span>
                                    <span className="text-xs font-bold uppercase tracking-widest">O que acontece agora?</span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    Iniciamos o mapeamento de <strong>{formData.workspaceName}</strong>. Enquanto isso, verifique sua caixa de entrada para confirmar seu acesso.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-primary hover:bg-blue-600 text-white py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary/20"
                            >
                                Entrar no Dashboard
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-12">
                    Politika Intelligence &bull; Powered by Precision
                </p>
            </main>
        </div>
    );
};

export default OnboardingFlow;
