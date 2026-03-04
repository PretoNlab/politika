import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const processAuth = async () => {
            // Parse query parameters
            const queryParams = new URLSearchParams(window.location.search);
            // Parse hash parameters (Supabase implicit flow puts errors in hash)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));

            const code = queryParams.get('code');
            const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');
            const errorCode = queryParams.get('error_code') || hashParams.get('error_code');

            console.log('[AuthCallback] URL Params:', {
                hasCode: !!code,
                error: errorDescription,
                errorCode: errorCode,
                fullUrl: window.location.href
            });

            if (errorDescription) {
                toast.error(`Erro na confirmação: ${errorDescription}`);
                navigate('/login');
                return;
            }

            if (code) {
                console.log('[AuthCallback] Exchanging code for session...');
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('[AuthCallback] Exchange error:', error);
                    toast.error('Falha ao confirmar seu acesso.');
                    navigate('/login');
                    return;
                }
                console.log('[AuthCallback] Exchange successful!');
                toast.success('Acesso confirmado! Redirecionando...');
                navigate('/dashboard');
                return;
            }

            // Fallback: check if session already exists (Implicit flow or already handled)
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[AuthCallback] Fallback session check:', !!session);

            if (session) {
                navigate('/dashboard');
            } else {
                // If no code and no session, wait a bit for INITIAL_SESSION
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    console.log('[AuthCallback] onAuthStateChange event:', event, !!session);
                    if (session) {
                        subscription.unsubscribe();
                        navigate('/dashboard');
                    }
                });

                // Final safety timeout
                setTimeout(() => {
                    subscription.unsubscribe();
                    if (window.location.pathname === '/auth/callback') {
                        toast.error('Não conseguimos validar seu acesso. Tente fazer login.');
                        navigate('/login');
                    }
                }, 5000);
            }
        };

        processAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
            <div className="absolute inset-0 premium-grid opacity-30 pointer-events-none"></div>
            <div className="flex flex-col items-center gap-6 animate-fade-up relative z-10">
                <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Quase lá! 🚀</h1>
                    <p className="text-slate-500 font-medium text-lg">Estamos preparando tudo para você começar.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;
