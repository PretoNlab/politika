import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-hot-toast';

type OnboardingStep = 'acesso' | 'perfil' | 'projeto' | 'pronto';

const BRAZILIAN_STATES = [
    { uf: 'AC', name: 'Acre' },
    { uf: 'AL', name: 'Alagoas' },
    { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' },
    { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' },
    { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' },
    { uf: 'MA', name: 'Maranhão' },
    { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'PA', name: 'Pará' },
    { uf: 'PB', name: 'Paraíba' },
    { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' },
    { uf: 'PI', name: 'Piauí' },
    { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'RO', name: 'Rondônia' },
    { uf: 'RR', name: 'Roraima' },
    { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' },
    { uf: 'SE', name: 'Sergipe' },
    { uf: 'TO', name: 'Tocantins' },
];

function generateSmartWatchwords(candidateName: string, state: string, region: string): string[] {
    if (!candidateName.trim()) return [];
    const firstName = candidateName.trim().split(' ')[0];
    const fullName = candidateName.trim();
    const locationFocus = region.trim() || state;
    const suggestions = [
        fullName,
        ...(firstName !== fullName ? [firstName] : []),
        `eleição ${locationFocus}`,
        `candidato ${locationFocus}`,
        `${fullName} proposta`,
        `${fullName} projeto`,
    ];
    return [...new Set(suggestions)].slice(0, 6);
}

// ─── Confetti particle component ─────────────────────────────────────────────
const Confetti: React.FC = () => {
    const particles = Array.from({ length: 28 }, (_, i) => i);
    const colors = ['#136dec', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
            {particles.map((i) => {
                const color = colors[i % colors.length];
                const left = `${(i * 37 + 7) % 100}%`;
                const delay = `${(i * 0.13).toFixed(2)}s`;
                const size = i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5;
                const duration = `${0.9 + (i % 5) * 0.18}s`;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: '-20px',
                            left,
                            width: size,
                            height: size,
                            borderRadius: i % 4 === 0 ? '0' : '50%',
                            background: color,
                            animation: `confettiFall ${duration} ${delay} ease-in forwards`,
                            opacity: 0.9,
                        }}
                    />
                );
            })}
            <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

// ─── Mini dossier preview generated client-side ───────────────────────────────
interface DossierPreview {
    handle: string;
    state: string;
    region: string;
    watchwords: string[];
}

const DossierPreviewCard: React.FC<{ data: DossierPreview }> = ({ data }) => {
    const location = [data.region, data.state].filter(Boolean).join(', ');
    const bullets = [
        `Monitoramento iniciado para "${data.handle}" em ${location || 'todo o Brasil'}.`,
        `${data.watchwords.length} termos estratégicos configurados para rastreamento.`,
        'Radar de contágio e Pulse Monitor prontos para detectar movimentos.',
        'War Room disponível para resposta imediata a crises.',
    ];

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-left space-y-4 animate-fade-up">
            <div className="flex items-center gap-2">
                <div className="size-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Central Preparada</p>
                    <p className="text-xs text-slate-500 font-medium">{data.handle} · {location || 'Brasil'}</p>
                </div>
            </div>

            <div className="space-y-2.5">
                {bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <div className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-xs">check</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 leading-snug">{b}</p>
                    </div>
                ))}
            </div>

            {data.watchwords.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                    {data.watchwords.slice(0, 5).map((w) => (
                        <span key={w} className="px-2.5 py-1 bg-primary/8 text-primary text-[11px] font-bold rounded-lg border border-primary/15">
                            {w}
                        </span>
                    ))}
                    {data.watchwords.length > 5 && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-lg">
                            +{data.watchwords.length - 5}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
const OnboardingFlow: React.FC = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { addWorkspace } = useWorkspace();

    const [currentStep, setCurrentStep] = useState<OnboardingStep>('acesso');
    const [loading, setLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [suggestedWatchwords, setSuggestedWatchwords] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: '',
        workspaceName: '',
        state: 'BA',
        region: '',
        candidateHandle: '',
        candidateName: '',
        customContext: '',
        watchwords: [] as string[],
        watchwordsRaw: '',
    });

    // Generate smart watchword suggestions when candidate name changes
    useEffect(() => {
        if (formData.candidateName.trim().length > 2) {
            const suggestions = generateSmartWatchwords(formData.candidateName, formData.state, formData.region);
            setSuggestedWatchwords(suggestions);
        } else {
            setSuggestedWatchwords([]);
        }
    }, [formData.candidateName, formData.state, formData.region]);

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

    const handleCreateProject = async () => {
        if (!formData.workspaceName) {
            toast.error('Dê um nome à sua campanha');
            return;
        }
        setLoading(true);
        try {
            const parsedWatchwords = formData.watchwordsRaw
                .split(',')
                .map((w) => w.trim())
                .filter(Boolean);

            await addWorkspace(
                {
                    name: formData.workspaceName,
                    state: formData.state,
                    region: formData.region,
                    customContext: formData.customContext,
                    watchwords: parsedWatchwords,
                },
                formData.candidateHandle
            );
            setFormData((prev) => ({ ...prev, watchwords: parsedWatchwords }));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2800);
            handleNext();
        } catch (error: any) {
            toast.error('Erro ao configurar projeto.');
        } finally {
            setLoading(false);
        }
    };

    const addWatchwordSuggestion = (suggestion: string) => {
        const current = formData.watchwordsRaw
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean);
        if (!current.includes(suggestion)) {
            const merged = [...current, suggestion].join(', ');
            setFormData((prev) => ({ ...prev, watchwordsRaw: merged }));
        }
    };

    const addAllSuggestions = () => {
        const current = formData.watchwordsRaw
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean);
        const merged = [...new Set([...current, ...suggestedWatchwords])].join(', ');
        setFormData((prev) => ({ ...prev, watchwordsRaw: merged }));
    };

    const currentWatchwordList = formData.watchwordsRaw
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

    const renderStepIndicator = () => {
        const steps = [
            { id: 'acesso', label: 'Acesso', icon: 'person' },
            { id: 'perfil', label: 'Perfil', icon: 'badge' },
            { id: 'projeto', label: 'Projeto', icon: 'add_location_alt' },
            { id: 'pronto', label: 'Pronto', icon: 'verified' },
        ];

        return (
            <div className="flex items-center justify-between mb-12 max-w-md mx-auto relative px-4">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border-light -z-10 -translate-y-1/2" />
                {steps.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isPast = steps.findIndex((s) => s.id === currentStep) > idx;
                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div
                                className={`size-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                        : isPast
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
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
            <div className="absolute inset-0 premium-grid opacity-30 pointer-events-none" />
            {showConfetti && <Confetti />}

            {/* Branding */}
            <div
                className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 cursor-pointer z-50"
                onClick={() => navigate('/')}
            >
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">radar</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">Politika</span>
            </div>

            <main className="w-full max-w-xl animate-fade-up relative z-10">
                {renderStepIndicator()}

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50">

                    {/* ── STEP 1: Acesso ──────────────────────────────────────── */}
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
                                    Já possui acesso?{' '}
                                    <button type="button" onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
                                        Fazer Login
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* ── STEP 2: Perfil ──────────────────────────────────────── */}
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
                                    { id: 'comunicacao', label: 'Equipe de Comunicação', desc: 'Foco em narrativa e gestão de crises.', icon: 'campaign' },
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => {
                                            setFormData({ ...formData, role: role.id });
                                            handleNext();
                                        }}
                                        className={`group flex items-center gap-6 p-6 rounded-3xl border text-left transition-all duration-300 hover:border-primary/30 hover:bg-slate-50 ${formData.role === role.id
                                                ? 'border-primary bg-primary/5 ring-4 ring-primary/5 shadow-inner'
                                                : 'border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div
                                            className={`size-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.role === role.id
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}
                                        >
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

                    {/* ── STEP 3: Projeto ─────────────────────────────────────── */}
                    {currentStep === 'projeto' && (
                        <div className="space-y-7">
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Seu primeiro projeto</h1>
                                <p className="text-slate-500 font-medium italic">Configure a inteligência da sua campanha.</p>
                            </div>

                            <div className="space-y-5">
                                {/* Campaign name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Nome da Campanha</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900"
                                        placeholder="Ex: Campanha Prefeito 2026"
                                        value={formData.workspaceName}
                                        onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                                    />
                                </div>

                                {/* Candidate handle — Aha moment trigger */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-primary pl-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                                        Perfil Principal (Análise Automática)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 rounded-2xl border-2 border-primary/25 bg-blue-50/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900"
                                        placeholder="Nome do candidato ou adversário"
                                        value={formData.candidateHandle}
                                        onChange={(e) => {
                                            const val = e.target.value.replace('@', '');
                                            setFormData({ ...formData, candidateHandle: val, candidateName: val });
                                        }}
                                    />
                                    <p className="text-[11px] text-slate-400 pl-1">
                                        Iremos gerar um Dossiê Estratégico automaticamente ao criar o projeto.
                                    </p>
                                </div>

                                {/* State + region */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Estado</label>
                                        <select
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900 appearance-none bg-white"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        >
                                            {BRAZILIAN_STATES.map((s) => (
                                                <option key={s.uf} value={s.uf}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Cidade / Região</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all font-medium text-slate-900"
                                            placeholder="Ex: Salvador"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Watchwords */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
                                        Termos Monitorados{' '}
                                        <span className="normal-case font-normal text-slate-400">(separados por vírgula)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-primary transition-all text-sm font-medium text-slate-900 resize-none"
                                        placeholder="Ex: prefeitura, saúde, João Silva, segurança"
                                        value={formData.watchwordsRaw}
                                        onChange={(e) => setFormData({ ...formData, watchwordsRaw: e.target.value })}
                                    />

                                    {/* Smart suggestions */}
                                    {suggestedWatchwords.length > 0 && (
                                        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                                    Sugestões inteligentes
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={addAllSuggestions}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                                >
                                                    Adicionar todas
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestedWatchwords.map((s) => {
                                                    const added = currentWatchwordList.includes(s);
                                                    return (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            disabled={added}
                                                            onClick={() => addWatchwordSuggestion(s)}
                                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${added
                                                                    ? 'bg-primary/10 text-primary/40 cursor-default'
                                                                    : 'bg-white text-primary border border-primary/20 hover:border-primary hover:shadow-sm'
                                                                }`}
                                                        >
                                                            {added ? '✓ ' : '+ '}
                                                            {s}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleCreateProject}
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Configurando central...
                                        </>
                                    ) : (
                                        <>
                                            Ativar Central de Inteligência
                                            <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                        </>
                                    )}
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

                    {/* ── STEP 4: Pronto — Aha Moment ─────────────────────────── */}
                    {currentStep === 'pronto' && (
                        <div className="text-center space-y-8 animate-reveal">
                            {/* Check icon */}
                            <div className="relative flex justify-center">
                                <div className="size-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                                </div>
                                <div className="absolute -top-1 -right-1 size-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce">
                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Central Ativada.</h1>
                                <p className="text-slate-500 font-medium italic leading-relaxed">
                                    {formData.workspaceName
                                        ? `"${formData.workspaceName}" está sendo monitorada.`
                                        : 'Sua inteligência política está operacional.'}
                                </p>
                            </div>

                            {/* Dossier preview — the actual Aha Moment */}
                            {(formData.candidateHandle || formData.watchwords.length > 0) && (
                                <DossierPreviewCard
                                    data={{
                                        handle: formData.candidateHandle || formData.workspaceName,
                                        state: formData.state,
                                        region: formData.region,
                                        watchwords: formData.watchwords,
                                    }}
                                />
                            )}

                            {/* What's next pills */}
                            <div className="grid grid-cols-2 gap-3 text-left">
                                {[
                                    { icon: 'analytics', label: 'Dossiê Estratégico', desc: 'Ver análise gerada', route: '/analyze' },
                                    { icon: 'radar', label: 'Pulse Monitor', desc: 'Radar de contágio', route: '/pulse' },
                                    { icon: 'shield', label: 'War Room', desc: 'Simulação de crise', route: '/crisis' },
                                    { icon: 'bar_chart', label: 'Dashboard', desc: 'Visão geral', route: '/dashboard' },
                                ].map((item) => (
                                    <button
                                        key={item.route}
                                        onClick={() => navigate(item.route)}
                                        className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-all text-left"
                                    >
                                        <div className="size-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 leading-tight">{item.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-primary hover:bg-blue-600 text-white py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                Ir para o Dashboard
                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
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
