import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Target, Zap, ChevronRight, BarChart3, Crosshair, Menu, X, Lock, Server, Eye, KeyRound, MonitorSmartphone, BrainCircuit, Gauge } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { track } = useAnalytics();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Intersection Observer para animações de entrada
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-up');
                        entry.target.classList.remove('opacity-0', 'translate-y-8');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-animate]').forEach((el) => {
            el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700');
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Smooth scroll para links de âncora (com cleanup)
    useEffect(() => {
        const handleAnchorClick = (e: Event) => {
            e.preventDefault();
            const target = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
            if (target) {
                document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
                setMobileMenuOpen(false);
            }
        };

        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach((anchor) => anchor.addEventListener('click', handleAnchorClick));

        return () => {
            anchors.forEach((anchor) => anchor.removeEventListener('click', handleAnchorClick));
        };
    }, []);

    const handleCTA = useCallback((source: string) => {
        track('landing_cta_clicked', { source });
        navigate('/login');
    }, [track, navigate]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-primary selection:text-white">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">radar</span>
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-text-heading dark:text-white">
                                Politika
                            </span>
                        </div>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#inteligencia" className="text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors">Tecnologia</a>
                            <a href="#modulos" className="text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors">Módulos</a>
                            <a href="#seguranca" className="text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors">Segurança</a>
                        </div>

                        {/* Desktop CTAs */}
                        <div className="hidden md:flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-text-subtle dark:text-slate-300 hover:text-primary px-4 py-2 transition-colors"
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => handleCTA('header')}
                                className="text-sm font-black bg-primary hover:opacity-90 text-white px-6 py-2.5 rounded-xl transition-all duration-300 shadow-lg flex items-center group"
                            >
                                Ativar Inteligência
                                <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-text-subtle dark:text-slate-400 hover:text-primary transition-colors"
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden pb-6 border-t border-slate-200 dark:border-slate-800 mt-2 pt-4 space-y-3">
                            <a href="#inteligencia" className="block text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors py-2">Tecnologia</a>
                            <a href="#modulos" className="block text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors py-2">Módulos</a>
                            <a href="#seguranca" className="block text-sm font-medium text-text-subtle dark:text-slate-400 hover:text-primary transition-colors py-2">Segurança</a>
                            <hr className="border-slate-200 dark:border-slate-800" />
                            <button
                                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                                className="block w-full text-left text-sm font-medium text-text-subtle dark:text-slate-300 hover:text-primary py-2"
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); handleCTA('header_mobile'); }}
                                className="w-full text-sm font-black bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl transition-all text-center"
                            >
                                Ativar Inteligência
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-8">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                            Inteligência Política de Precisão
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-text-heading dark:text-white mb-6 leading-tight">
                            Quem lê o cenário primeiro, <br className="hidden md:block" />
                            <span className="text-primary">
                                controla o jogo.
                            </span>
                        </h1>

                        <p className="mt-6 text-xl text-text-subtle dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            Sua central de inteligência política com IA. Monitoramento em tempo real,
                            alertas de crise e relatórios táticos — o cenário político brasileiro traduzido em ação.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={() => handleCTA('hero_primary')}
                                className="w-full sm:w-auto px-8 py-4 bg-primary hover:opacity-90 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                Acessar a Central de Comando
                            </button>
                            <a
                                href="#modulos"
                                className="w-full sm:w-auto px-8 py-4 border border-slate-300 dark:border-slate-700 hover:border-primary text-text-subtle dark:text-slate-300 hover:text-primary rounded-xl font-medium text-lg transition-all flex items-center justify-center"
                            >
                                Ver Módulos
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* Como Funciona */}
                <section id="inteligencia" className="py-24 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16" data-animate>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text-heading dark:text-white mb-4">
                                Como Funciona
                            </h2>
                            <p className="text-text-subtle dark:text-slate-400 max-w-2xl mx-auto">
                                Da informação bruta ao comando tático em três passos.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center" data-animate>
                                <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center mx-auto mb-6">
                                    <MonitorSmartphone className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Passo 01</div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Acesse a Central de Comando</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Login seguro com acesso imediato ao painel de inteligência. Interface desenhada para decisão rápida.
                                </p>
                            </div>

                            <div className="text-center" data-animate>
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                    <BrainCircuit className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Passo 02</div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">IA Analisa em Tempo Real</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Nosso motor de inteligência monitora notícias, redes e tendências, cruzando dados para gerar alertas táticos.
                                </p>
                            </div>

                            <div className="text-center" data-animate>
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Gauge className="w-8 h-8 text-amber-500" />
                                </div>
                                <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Passo 03</div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Decida Antes do Adversário</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Receba relatórios no formato Fato — Risco — Ação. Leitura pronta para decisão em 30 segundos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Módulos / Arsenal */}
                <section id="modulos" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16" data-animate>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text-heading dark:text-white mb-4">
                                Arsenal de Decisão
                            </h2>
                            <p className="text-text-subtle dark:text-slate-400 max-w-2xl mx-auto">
                                Quatro módulos táticos desenhados para agir antes do adversário pensar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 group shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Activity className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Radar de Contágio</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Não confunda ruído com crise. Nossa IA lê notícias em tempo real e alerta sobre a velocidade com que a pauta se espalha — antes que chegue ao eleitor.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300 group shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Simulador de Crise</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Estourou um escândalo? Faça upload do seu pronunciamento. A IA avalia tom, postura e gera sua estratégia de resposta — a Vacina Narrativa.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 group shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Crosshair className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Análise Tática Profunda</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Descubra os vácuos narrativos do adversário. Saiba exatamente em qual dor o oponente se omite — e ataque onde ele não tem defesa.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 group shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-text-heading dark:text-white mb-3">Relatório Situacional</h3>
                                <p className="text-text-subtle dark:text-slate-400 leading-relaxed">
                                    Chega de relatórios de 10 páginas. Receba análises formatadas em Fato — Risco — Comando de Ação. Prontas para decisão em 30 segundos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Prova Social / Números */}
                <section className="py-20 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8" data-animate>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black tracking-tighter text-text-heading dark:text-white mb-2">5.570</div>
                                <div className="text-sm text-text-subtle dark:text-slate-400 font-medium">Municípios brasileiros cobertos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black tracking-tighter text-primary mb-2">50+</div>
                                <div className="text-sm text-text-subtle dark:text-slate-400 font-medium">Fontes de dados ativas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black tracking-tighter text-text-heading dark:text-white mb-2">&lt;2min</div>
                                <div className="text-sm text-text-subtle dark:text-slate-400 font-medium">Tempo médio de alerta</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black tracking-tighter text-primary mb-2">24/7</div>
                                <div className="text-sm text-text-subtle dark:text-slate-400 font-medium">Monitoramento contínuo</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Segurança */}
                <section id="seguranca" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16" data-animate>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text-heading dark:text-white mb-4">
                                Segurança de Nível Estratégico
                            </h2>
                            <p className="text-text-subtle dark:text-slate-400 max-w-2xl mx-auto">
                                Seus dados políticos são sensíveis. Tratamos cada byte como informação classificada.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-text-heading dark:text-white mb-2">Criptografia E2E</h3>
                                <p className="text-sm text-text-subtle dark:text-slate-400">Dados em trânsito e em repouso protegidos com criptografia de ponta.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Server className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-text-heading dark:text-white mb-2">Infraestrutura Segura</h3>
                                <p className="text-sm text-text-subtle dark:text-slate-400">Servidores com certificação SOC 2. Nenhuma chave de API exposta no cliente.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-text-heading dark:text-white mb-2">Acesso Restrito</h3>
                                <p className="text-sm text-text-subtle dark:text-slate-400">Autenticação robusta com controle de sessão. Apenas usuários autorizados.</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-red-500/50 transition-colors shadow-sm" data-animate>
                                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Eye className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-text-heading dark:text-white mb-2">Privacidade Total</h3>
                                <p className="text-sm text-text-subtle dark:text-slate-400">Suas análises e consultas não são compartilhadas. Dados isolados por espaço de trabalho.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center" data-animate>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-text-heading dark:text-white mb-6">
                            Domine a narrativa.
                        </h2>
                        <p className="text-xl text-text-subtle dark:text-slate-300 mb-10">
                            Eleições não são decididas por quem tem mais dados — mas por quem decide mais rápido.
                        </p>
                        <button
                            onClick={() => handleCTA('footer_primary')}
                            className="px-10 py-5 bg-primary hover:opacity-90 text-white rounded-xl font-black text-lg transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center"
                        >
                            Começar Agora
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="size-6 bg-primary rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">radar</span>
                            </div>
                            <span className="text-text-subtle dark:text-slate-500 font-black tracking-tight">POLITIKA 2.0</span>
                        </div>

                        <div className="flex flex-wrap justify-center items-center gap-6">
                            <a href="#inteligencia" className="text-sm text-text-subtle dark:text-slate-500 hover:text-primary transition-colors">Tecnologia</a>
                            <a href="#modulos" className="text-sm text-text-subtle dark:text-slate-500 hover:text-primary transition-colors">Módulos</a>
                            <a href="#seguranca" className="text-sm text-text-subtle dark:text-slate-500 hover:text-primary transition-colors">Segurança</a>
                            <button onClick={() => navigate('/privacy')} className="text-sm text-text-subtle dark:text-slate-500 hover:text-primary transition-colors">Privacidade</button>
                            <button onClick={() => navigate('/terms')} className="text-sm text-text-subtle dark:text-slate-500 hover:text-primary transition-colors">Termos</button>
                        </div>

                        <div className="text-sm text-text-subtle dark:text-slate-600">
                            &copy; {new Date().getFullYear()} Sistemas de Inteligência. Acesso Restrito.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
