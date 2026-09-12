/**
 * Configurações > Sobre o Orbi (Fase 50): informações institucionais,
 * licença e privacidade.
 * Orbi — Criado por Vinicius Braga
 */
import { useAppStore } from '../../../store/useAppStore';
import { OrbiLogo } from '../../OrbiLogo';
import { Icon } from '../../ui/Icon';

export function AboutTab() {
  const appInfo = useAppStore((s) => s.appInfo);
  return (
    <>
      <div className="relative flex flex-col items-center overflow-hidden rounded-lg bg-surface-container-low px-space-lg py-space-xl text-center shadow-sm">
        <div className="pointer-events-none absolute -top-12 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="mb-space-md h-16 w-16 overflow-hidden rounded-xl shadow-[0_0_24px_rgba(0,220,130,0.15)]">
          <OrbiLogo size={64} />
        </div>
        <h3 className="bg-gradient-to-r from-primary via-tertiary to-on-surface bg-clip-text font-headline-lg text-headline-lg font-bold tracking-tight text-transparent">
          {appInfo?.appName ?? 'Orbi'}
        </h3>
        <span className="mt-1 rounded bg-surface-container-high px-space-sm py-0.5 font-code-sm text-code-sm text-primary">
          Versão {appInfo?.version ?? ''}
        </span>
        <p className="mt-space-md max-w-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
          O <strong className="font-semibold text-on-surface">Orbi</strong> foi criado para centralizar e acelerar a gestão das suas
          instâncias em um só lugar, oferecendo controle total e produtividade para o seu fluxo de trabalho.
        </p>
        <div className="mt-space-md rounded-full bg-surface-container px-space-md py-1.5 font-body-md text-body-md text-on-surface">
          Criado por <strong className="font-semibold text-primary">{appInfo?.creator ?? 'Vinicius Braga'}</strong>
        </div>
      </div>

      <div className="space-y-space-xs rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex items-center gap-space-xs">
          <Icon name="gavel" className="text-[18px] text-secondary" />
          <span className="font-title-md text-title-md font-semibold text-on-surface">Licença e uso</span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Software proprietário, de uso restrito. Todos os direitos reservados ao autor. A redistribuição, a revenda e a modificação
          não são autorizadas.
        </p>
        <p className="font-code-sm text-code-sm text-outline">Copyright © 2026 Vinicius Braga.</p>
      </div>

      <div className="flex gap-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <Icon name="verified_user" className="mt-0.5 flex-shrink-0 text-[20px] text-primary" />
        <div className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
          <span className="block font-title-md text-title-md font-semibold text-on-surface">Privacidade</span>
          <p>Cada conta roda em uma sessão isolada, guardada apenas neste computador. Uma conta nunca enxerga os dados da outra.</p>
          <p>
            O Orbi não lê, guarda nem envia o conteúdo das suas conversas. Os números do Analytics são apenas quantidades, calculadas e
            mantidas localmente.
          </p>
          <p>Nenhum dado de conversa sai da sua máquina.</p>
        </div>
      </div>
    </>
  );
}
