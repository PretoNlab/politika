import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
            Termos de Uso
          </h1>
          <p className="text-text-subtle dark:text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">1. Descrição do Serviço</h2>
            <p>
              O Politika é uma plataforma de inteligência política que utiliza inteligência artificial para fornecer análises estratégicas de perfis políticos, monitoramento de sentimento, gestão de crises e insights de campanha, com foco na região da Bahia, Brasil.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">2. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar o Politika, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">3. Conta do Usuário</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Você é responsável por manter a confidencialidade das credenciais da sua conta.</li>
              <li>Cada conta é pessoal e intransferível.</li>
              <li>Você deve fornecer informações verdadeiras e atualizadas no cadastro.</li>
              <li>O uso compartilhado de credenciais é proibido.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">4. Uso Aceitável</h2>
            <p>Ao utilizar o Politika, você se compromete a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a plataforma apenas para fins legais e éticos.</li>
              <li>Não utilizar as análises para disseminar desinformação.</li>
              <li>Não tentar comprometer a segurança da plataforma.</li>
              <li>Não realizar engenharia reversa, scraping ou acesso não autorizado.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">5. Disclaimer de Inteligência Artificial</h2>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              As análises geradas pelo Politika são produzidas por inteligência artificial e têm caráter informativo e estratégico. Elas NÃO devem ser utilizadas como base única para decisões políticas, jurídicas ou de qualquer outra natureza.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A IA pode gerar informações imprecisas ou desatualizadas.</li>
              <li>As análises não substituem consultoria profissional especializada.</li>
              <li>O usuário é integralmente responsável pelas decisões tomadas com base nas análises.</li>
              <li>O Politika não garante a acurácia, completude ou atualidade das informações geradas.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma, incluindo código, design, textos e marcas, é propriedade do Politika. As análises geradas pertencem ao usuário que as solicitou, mas a tecnologia e os modelos utilizados permanecem de propriedade exclusiva do Politika.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">7. Limitação de Responsabilidade</h2>
            <p>
              O Politika é fornecido "como está" (as-is). Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da plataforma, incluindo mas não limitado a: perdas financeiras, danos à reputação, ou decisões tomadas com base nas análises fornecidas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">8. Disponibilidade</h2>
            <p>
              O Politika se esforça para manter a plataforma disponível 24/7, mas não garante disponibilidade ininterrupta. Podemos realizar manutenções programadas ou emergenciais que podem afetar temporariamente o acesso.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">9. Modificações</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por email. O uso continuado após modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-heading dark:text-white">10. Foro</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Salvador, Estado da Bahia, para dirimir quaisquer questões decorrentes destes termos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
