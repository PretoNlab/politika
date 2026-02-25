import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
                        entry.target.classList.remove('opacity-0');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.animate-on-scroll').forEach((el) => {
            el.classList.add('opacity-0');
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Smooth scroll para links de âncora
    useEffect(() => {
        const handleAnchorClick = (e: Event) => {
            const link = e.currentTarget as HTMLAnchorElement;
            const targetId = link.getAttribute('href');

            // Só previne e rola suave se for link interno (começa com #)
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="bg-white text-slate-900 antialiased min-h-screen font-sans selection:bg-primary selection:text-white">

            {/* Navbar — Maze style: ultra-clean, minimal, lots of breathing room */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border-light transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-lg">radar</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-text-heading">Politika</span>
                        </div>

                        {/* Center nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#como-funciona" className="text-sm font-medium text-text-subtle hover:text-text-heading transition-colors">Como funciona</a>
                            <a href="#modulos" className="text-sm font-medium text-text-subtle hover:text-text-heading transition-colors">Módulos</a>
                            <a href="#seguranca" className="text-sm font-medium text-text-subtle hover:text-text-heading transition-colors">Segurança</a>
                        </div>

                        {/* Right CTAs */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-text-subtle hover:text-text-heading transition-colors px-3 py-2"
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => handleCTA('header')}
                                className="text-sm font-semibold bg-text-heading text-white px-5 py-2.5 rounded-full hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                Começar grátis
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-text-subtle p-2 -mr-2"
                        >
                            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-border-light px-6 py-6 pb-8 space-y-4 shadow-xl absolute top-full left-0 right-0 animate-fade-up origin-top">
                        <a href="#como-funciona" className="block text-base font-medium text-text-body hover:text-primary transition-colors py-2">Como funciona</a>
                        <a href="#modulos" className="block text-base font-medium text-text-body hover:text-primary transition-colors py-2">Módulos</a>
                        <a href="#seguranca" className="block text-base font-medium text-text-body hover:text-primary transition-colors py-2">Segurança</a>
                        <div className="h-px bg-border-light my-4"></div>
                        <button
                            onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                            className="block w-full text-left text-base font-medium text-text-body py-2"
                        >
                            Entrar na conta
                        </button>
                        <button
                            onClick={() => { setMobileMenuOpen(false); handleCTA('header_mobile'); }}
                            className="w-full text-center text-sm font-semibold bg-text-heading text-white px-5 py-3.5 rounded-full hover:bg-slate-700 transition-colors mt-2"
                        >
                            Começar grátis
                        </button>
                    </div>
                )}
            </nav>

            <main>
                {/* Hero — Maze style: centered, lightweight type, huge whitespace, soft gradient */}
                <section className="relative pt-40 pb-28 gradient-blur overflow-hidden">
                    <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center relative z-10">
                        {/* Badge */}
                        <div className="animate-on-scroll delay-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-soft border border-primary/10 mb-10 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Inteligência Política de Precisão</span>
                        </div>

                        {/* Headline */}
                        <h1 className="animate-on-scroll delay-2 text-5xl md:text-7xl font-bold tracking-tight text-text-heading leading-[1.08] mb-8">
                            Quem lê o cenário primeiro, <br className="hidden md:block" />
                            <span className="text-primary tracking-tight"> controla o jogo.</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="animate-on-scroll delay-3 text-lg md:text-xl text-text-body max-w-2xl mx-auto leading-relaxed mb-12">
                            Sua central de inteligência política com IA. Monitoramento em tempo real,
                            alertas de crise e relatórios táticos — o cenário político brasileiro traduzido em ação.
                        </p>

                        {/* CTAs */}
                        <div className="animate-on-scroll delay-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                onClick={() => handleCTA('hero')}
                                className="w-full sm:w-auto px-8 py-4 bg-text-heading hover:bg-slate-800 text-white rounded-full font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 group"
                            >
                                <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">bolt</span>
                                Acessar a Central de Comando
                            </button>
                            <a
                                href="#modulos"
                                className="w-full sm:w-auto px-8 py-4 border border-slate-300 text-text-body hover:text-text-heading hover:border-slate-400 bg-white hover:bg-slate-50 rounded-full font-medium text-base transition-all inline-flex items-center justify-center gap-2"
                            >
                                Ver Módulos
                                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Social proof bar — Maze style: minimal stat row, no cards */}
                <section className="py-16 border-t border-border-light relative z-10 bg-white">
                    <div className="max-w-5xl mx-auto px-6 lg:px-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center animate-on-scroll">
                            <div>
                                <div className="text-4xl md:text-5xl font-bold tracking-tight text-text-heading">5.570</div>
                                <div className="text-sm font-medium text-text-subtle mt-2">Municípios cobertos</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-bold tracking-tight text-primary">50+</div>
                                <div className="text-sm font-medium text-text-subtle mt-2">Fontes de dados</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-bold tracking-tight text-text-heading">&lt;2min</div>
                                <div className="text-sm font-medium text-text-subtle mt-2">Tempo de alerta</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-bold tracking-tight text-primary">24/7</div>
                                <div className="text-sm font-medium text-text-subtle mt-2">Monitoramento</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Como Funciona — Maze style: 3 columns, icon top, lots of space, thin separators */}
                <section id="como-funciona" className="py-28 bg-surface border-t border-border-light">
                    <div className="max-w-5xl mx-auto px-6 lg:px-10">
                        <div className="text-center mb-24 animate-on-scroll">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Como funciona</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-heading leading-tight max-w-2xl mx-auto">
                                Da informação bruta ao comando tático em três passos
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                            {/* Step 1 */}
                            <div className="text-center animate-on-scroll delay-1">
                                <div className="w-16 h-16 rounded-[20px] bg-primary-soft border border-primary/10 flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <span className="material-symbols-outlined text-primary text-2xl">devices</span>
                                </div>
                                <div className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Passo 01</div>
                                <h3 className="text-xl font-bold text-text-heading mb-4">Acesse a Central de Comando</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Login seguro com acesso imediato ao painel de inteligência. Interface desenhada para decisão rápida.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center animate-on-scroll delay-2">
                                <div className="w-16 h-16 rounded-[20px] bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <span className="material-symbols-outlined text-emerald-600 text-2xl">psychology</span>
                                </div>
                                <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-3">Passo 02</div>
                                <h3 className="text-xl font-bold text-text-heading mb-4">IA Analisa em Tempo Real</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Nosso motor de inteligência monitora notícias, redes e tendências, cruzando dados para gerar alertas táticos.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center animate-on-scroll delay-3">
                                <div className="w-16 h-16 rounded-[20px] bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <span className="material-symbols-outlined text-amber-600 text-2xl">target</span>
                                </div>
                                <div className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-3">Passo 03</div>
                                <h3 className="text-xl font-bold text-text-heading mb-4">Decida Antes do Adversário</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Receba relatórios no formato Fato — Risco — Ação. Leitura pronta para decisão em 30 segundos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Módulos — Maze style: 2x2 grid, subtle border cards, hover lift, clean icons */}
                <section id="modulos" className="py-28 border-t border-border-light bg-white">
                    <div className="max-w-5xl mx-auto px-6 lg:px-10">
                        <div className="text-center mb-20 animate-on-scroll">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Módulos</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-heading leading-tight">
                                Arsenal de Decisão
                            </h2>
                            <p className="text-lg text-text-body mt-6 max-w-xl mx-auto leading-relaxed">
                                Quatro módulos táticos desenhados para agir antes do adversário pensar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Card 1 */}
                            <div className="group bg-white border border-border-light rounded-[24px] p-10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll delay-1 hover:border-primary/30">
                                <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-primary text-2xl">monitoring</span>
                                </div>
                                <h3 className="text-2xl font-bold text-text-heading mb-3 tracking-tight">Radar de Contágio</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Não confunda ruído com crise. Nossa IA lê notícias em tempo real e alerta sobre a velocidade com que a pauta se espalha — antes que chegue ao eleitor.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="group bg-white border border-border-light rounded-[24px] p-10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll delay-2 hover:border-red-500/30">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-red-500 text-2xl">crisis_alert</span>
                                </div>
                                <h3 className="text-2xl font-bold text-text-heading mb-3 tracking-tight">Simulador de Crise</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Estourou um escândalo? Faça upload do seu pronunciamento. A IA avalia tom, postura e gera sua estratégia de resposta — a Vacina Narrativa.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="group bg-white border border-border-light rounded-[24px] p-10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll delay-3 hover:border-emerald-500/30">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-emerald-600 text-2xl">track_changes</span>
                                </div>
                                <h3 className="text-2xl font-bold text-text-heading mb-3 tracking-tight">Análise Tática</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Descubra os vácuos narrativos do adversário. Saiba exatamente em qual dor o oponente se omite — e ataque onde ele não tem defesa.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div className="group bg-white border border-border-light rounded-[24px] p-10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-on-scroll delay-4 hover:border-amber-500/30">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-amber-600 text-2xl">summarize</span>
                                </div>
                                <h3 className="text-2xl font-bold text-text-heading mb-3 tracking-tight">Relatório Situacional</h3>
                                <p className="text-base text-text-body leading-relaxed">
                                    Chega de relatórios de 10 páginas. Receba análises formatadas em Fato — Risco — Comando de Ação. Prontas para decisão em 30 segundos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Segurança — Maze style: 4 cols, icon + text, very clean */}
                <section id="seguranca" className="py-28 bg-surface border-t border-border-light">
                    <div className="max-w-5xl mx-auto px-6 lg:px-10">
                        <div className="text-center mb-20 animate-on-scroll">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Segurança</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text-heading leading-tight">
                                Nível Estratégico
                            </h2>
                            <p className="text-lg text-text-body mt-6 max-w-xl mx-auto leading-relaxed">
                                Seus dados políticos são sensíveis. Tratamos cada byte como informação classificada militar.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
                            <div className="text-center animate-on-scroll delay-1">
                                <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                </div>
                                <h3 className="text-base font-bold text-text-heading mb-2">Criptografia E2E</h3>
                                <p className="text-sm text-text-subtle leading-relaxed">Dados em trânsito e em repouso protegidos com encriptação avançada.</p>
                            </div>
                            <div className="text-center animate-on-scroll delay-2">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-emerald-600 text-2xl">dns</span>
                                </div>
                                <h3 className="text-base font-bold text-text-heading mb-2">Infra Segura</h3>
                                <p className="text-sm text-text-subtle leading-relaxed">Servidores cloud robustos. Nenhuma chave de API exposta publicamente.</p>
                            </div>
                            <div className="text-center animate-on-scroll delay-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-amber-600 text-2xl">passkey</span>
                                </div>
                                <h3 className="text-base font-bold text-text-heading mb-2">Acesso Restrito</h3>
                                <p className="text-sm text-text-subtle leading-relaxed">Autenticação robusta com forte controle de sessão. Acesso granular autorizado.</p>
                            </div>
                            <div className="text-center animate-on-scroll delay-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-red-500 text-2xl">visibility_off</span>
                                </div>
                                <h3 className="text-base font-bold text-text-heading mb-2">Privacidade</h3>
                                <p className="text-sm text-text-subtle leading-relaxed">Suas análises são privadas. Dados são totalmente isolados por espaço de trabalho.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final — Maze style: simple, clean, dark button, no heavy bg */}
                <section className="py-32 border-t border-border-light bg-white">
                    <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center animate-on-scroll">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-text-heading mb-8 leading-tight">
                            Domine a narrativa.
                        </h2>
                        <p className="text-xl text-text-body mb-12 max-w-2xl mx-auto leading-relaxed">
                            Eleições não são decididas por quem tem mais dados — mas por quem decide e reage mais rápido com a informação certa.
                        </p>
                        <button
                            onClick={() => handleCTA('footer')}
                            className="inline-flex items-center gap-3 px-10 py-5 bg-text-heading text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all hover:scale-105 shadow-xl hover:shadow-2xl"
                        >
                            Começar Agora
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer — Maze style: single line, ultra minimal */}
            <footer className="py-12 border-t border-border-light bg-surface">
                <div className="max-w-6xl mx-auto px-6 lg:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                        {/* Logo Footer */}
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-base">radar</span>
                            </div>
                            <span className="text-base font-bold text-text-heading tracking-tight">Politika</span>
                        </div>

                        {/* Footer Links */}
                        <div className="flex flex-wrapjustify-center gap-8 text-sm font-medium text-text-subtle">
                            <a href="#como-funciona" className="hover:text-text-heading transition-colors">Tecnologia</a>
                            <a href="#modulos" className="hover:text-text-heading transition-colors">Módulos</a>
                            <a href="#seguranca" className="hover:text-text-heading transition-colors">Segurança</a>
                            <button onClick={() => navigate('/privacy')} className="hover:text-text-heading transition-colors">Privacidade</button>
                            <button onClick={() => navigate('/terms')} className="hover:text-text-heading transition-colors">Termos</button>
                        </div>

                        {/* Copyright */}
                        <div className="text-sm font-medium text-text-subtle">
                            &copy; {new Date().getFullYear()} Sistemas de Inteligência
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
