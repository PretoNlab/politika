import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const LeadCapture: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        whatsapp: '',
        role: '',
        location: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await supabase
                .from('leads')
                .insert([
                    {
                        full_name: formData.fullName,
                        email: formData.email,
                        whatsapp: formData.whatsapp,
                        role: formData.role,
                        location: formData.location,
                        status: 'new'
                    },
                ]);

            if (submitError) throw submitError;

            setSubmitted(true);
            toast.success('Solicitação enviada com sucesso!');
        } catch (err: any) {
            console.error('Error submitting lead:', err);
            setError('Houve um erro ao enviar sua solicitação. Por favor, tente novamente.');
            toast.error('Erro ao enviar solicitação.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md animate-fade-up">
                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Solicitação Recebida!</h1>
                    <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                        Nossa equipe de inteligência entrará em contato com você via WhatsApp ou e-mail em até 24 horas para agendar sua demonstração exclusiva.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all"
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            {/* Left side: Context/Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 premium-grid opacity-20 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">radar</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Politika</span>
                    </div>

                    <h1 className="text-5xl font-bold leading-tight mb-8">
                        Acesso Restrito à <br />
                        <span className="text-primary">Elite Política.</span>
                    </h1>

                    <div className="space-y-8 max-w-md">
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-primary">verified_user</span>
                            <div>
                                <h3 className="font-bold text-lg">Curadoria de Inteligência</h3>
                                <p className="text-slate-400">Liberamos acesso apenas após validação para garantir a integridade dos dados estratégicos.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-primary">support_agent</span>
                            <div>
                                <h3 className="font-bold text-lg">Onboarding Personalizado</h3>
                                <p className="text-slate-400">Nossos consultores configuram seus primeiros eixos de monitoramento com você.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} Politika Sistemas de Inteligência. Todos os direitos reservados.
                </div>
            </div>

            {/* Right side: Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-md animate-fade-up">
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">radar</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900">Politika</span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Solicitar Acesso</h2>
                        <p className="text-slate-500 font-medium">Preencha os dados abaixo e entraremos em contato.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: João da Silva"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Profissional</label>
                            <input
                                required
                                type="email"
                                placeholder="nome@exemplo.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cargo</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="candidato">Candidato(a)</option>
                                    <option value="assessor">Assessor(a)</option>
                                    <option value="secretario">Secretário(a)</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Localidade (Cidade/Estado)</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: Salvador, BA"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Solicitar Demonstração
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-400 text-sm">
                        Já tem uma conta? <button onClick={() => navigate('/login')} className="text-slate-900 font-bold hover:underline">Entrar</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeadCapture;
