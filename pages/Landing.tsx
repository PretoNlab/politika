import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Target, Zap, ChevronRight, BarChart3, Crosshair, Map } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { track } = useAnalytics();

    useEffect(() => {
        // Efeito para adicionar smooth scrolling aos links com âncora
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId) {
                    document.querySelector(targetId)?.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }, []);

    const handleCTA = (source: string) => {
        track('landing_cta_clicked', { source });
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#0d131b] text-[#f6f7f8] font-sans selection:bg-[#136dec] selection:text-white">
            {/* Navbar Pública */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d131b]/80 backdrop-blur-md border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#136dec] to-blue-900 flex items-center justify-center shadow-[0_0_15px_rgba(19,109,236,0.5)]">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                                Politika
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#inteligencia" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Tecnologia</a>
                            <a href="#modulos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Módulos</a>
                            <a href="#seguranca" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Segurança</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors"
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => handleCTA('header')}
                                className="text-sm font-medium bg-[#136dec] hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(19,109,236,0.3)] hover:shadow-[0_0_25px_rgba(19,109,236,0.5)] flex items-center group"
                            >
                                Ativar Inteligência
                                <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#136dec]/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
                    <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8 shadow-[0_0_10px_rgba(19,109,236,0.2)]">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
                            Oficial de Inteligência Virtual
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                            Campanha no escuro <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#136dec] to-cyan-400">
                                é suicídio eleitoral.
                            </span>
                        </h1>

                        <p className="mt-6 text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            O primeiro <strong className="text-slate-200">War Room Estratégico</strong> focado em dados da Bahia.
                            Antecipe crises, descubra vácuos narrativos e receba comandos táticos de IA em tempo real.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={() => handleCTA('hero_primary')}
                                className="w-full sm:w-auto px-8 py-4 bg-[#136dec] hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(19,109,236,0.4)] hover:shadow-[0_0_40px_rgba(19,109,236,0.6)] hover:-translate-y-1 flex items-center justify-center"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                Iniciar Command Center
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features / Modules */}
                <section id="modulos" className="py-24 bg-slate-900/50 border-t border-slate-800/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                                Arsenal de Decisão
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Quatro módulos táticos desenhados para agir antes do adversário pensar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-[#0d131b] border border-slate-800 rounded-2xl p-8 hover:border-[#136dec]/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Activity className="w-6 h-6 text-[#136dec]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Radar de Contágio</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Não confunda ruído com crise. Nossa IA lê notícias em tempo real e alerta sobre a velocidade térmica com que a pauta chegará ao WhatsApp do eleitor interiorano.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-[#0d131b] border border-slate-800 rounded-2xl p-8 hover:border-red-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Shield className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Simulador War Room</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Estourou um escândalo? Faça upload do seu pronunciamento (vídeo, áudio ou texto). A máquina atua como *Spin Doctor*, avalia tom de voz, postura e cria sua "Vacina Narrativa".
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-[#0d131b] border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Deep Dive Tático</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Descubra os *Vácuos Narrativos* do adversário. Saiba exatamente em qual dor o oponente se omite e use isso para atacar onde ele não tem defesa constituída.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-[#0d131b] border border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">QG: SitRep Executivo</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Chega de relatórios de 10 páginas. Receba briefings militares formatados em **Fato - Risco - Comando de Ação**. Leituras prontas para decisão em 30 segundos no celular.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#136dec]/5"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#136dec]/50 to-transparent"></div>

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                            Domine a narrativa.
                        </h2>
                        <p className="text-xl text-slate-300 mb-10">
                            Eleições não são decididas por quem tem mais dados, mas por quem decide mais rápido.
                        </p>
                        <button
                            onClick={() => handleCTA('footer_primary')}
                            className="px-10 py-5 bg-white text-[#0d131b] hover:bg-slate-200 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] inline-flex items-center"
                        >
                            Forçar Entrada no QG
                            <Crosshair className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </section>
            </main>

            <footer className="bg-[#0b1017] py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <Shield className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-500 font-semibold tracking-wide">POLITIKA 2.0</span>
                    </div>
                    <div className="text-sm text-slate-600">
                        &copy; {new Date().getFullYear()} Sistemas de Inteligência. Acesso Restrito.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
