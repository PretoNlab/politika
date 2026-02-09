import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
        } else {
          navigate('/', { replace: true });
        }
      } else {
        if (!fullName.trim()) {
          toast.error('Nome completo é obrigatório');
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">radar</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-text-heading dark:text-white">
              Politika
            </h1>
          </div>
          <p className="text-text-subtle dark:text-slate-400 text-sm">
            Inteligência Política de Precisão
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
          {/* Tabs */}
          <div className="flex mb-8 bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isLogin
                  ? 'bg-white dark:bg-slate-700 text-text-heading dark:text-white shadow-sm'
                  : 'text-text-subtle dark:text-slate-400'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-white dark:bg-slate-700 text-text-heading dark:text-white shadow-sm'
                  : 'text-text-subtle dark:text-slate-400'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-text-subtle dark:text-slate-400 uppercase tracking-widest mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-subtle dark:text-slate-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-subtle dark:text-slate-400 uppercase tracking-widest mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:opacity-90 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    {isLogin ? 'login' : 'person_add'}
                  </span>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-4 text-xs text-text-subtle dark:text-slate-500">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
