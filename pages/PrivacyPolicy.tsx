import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Voltar
          </Link>
          <h1 className="text-4xl font-black text-text-heading dark:text-white tracking-tighter">
            Política de Privacidade
          </h1>
          <p className="text-text-subtle dark:text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">1. Dados Coletados</h2>
            <p>O Politika coleta os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome completo, endereço de email e senha (armazenada de forma criptografada).</li>
              <li><strong>Dados de uso:</strong> análises realizadas, workspaces criados, histórico de interações com a plataforma.</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, informações de sessão para diagnóstico de erros.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">2. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Autenticação e gerenciamento da sua conta.</li>
              <li>Fornecer análises de inteligência política personalizadas.</li>
              <li>Monitoramento e correção de erros técnicos da plataforma.</li>
              <li>Melhorias na experiência do usuário.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">3. Base Legal (LGPD)</h2>
            <p>O tratamento de dados é realizado com base no:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consentimento:</strong> ao criar sua conta, você consente com o tratamento descrito nesta política.</li>
              <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados.</li>
              <li><strong>Interesse legítimo:</strong> para monitoramento de segurança e prevenção de fraudes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">4. Compartilhamento com Terceiros</h2>
            <p>Utilizamos os seguintes serviços de terceiros:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase:</strong> autenticação e armazenamento de dados (PostgreSQL com criptografia em repouso).</li>
              <li><strong>Google Gemini:</strong> processamento de análises via inteligência artificial. Os dados enviados são prompts textuais sem identificação pessoal do usuário.</li>
              <li><strong>Sentry:</strong> monitoramento de erros técnicos. Coleta dados de sessão e stack traces para diagnóstico.</li>
              <li><strong>Vercel:</strong> hospedagem e infraestrutura da aplicação.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">5. Retenção de Dados</h2>
            <p>
              Seus dados são retidos enquanto sua conta estiver ativa. Após solicitação de exclusão, os dados pessoais serão removidos em até 30 dias, exceto quando houver obrigação legal de retenção.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">6. Seus Direitos (LGPD Art. 18)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existência de tratamento de dados.</li>
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a eliminação dos dados pessoais.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar portabilidade dos dados.</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo email: <strong>privacidade@politika.app</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em trânsito (TLS/HTTPS), criptografia em repouso, Row Level Security (RLS) no banco de dados, e autenticação JWT.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
