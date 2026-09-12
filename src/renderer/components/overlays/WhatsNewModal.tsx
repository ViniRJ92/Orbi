/**
 * "O que há de novo" (Fase 29): abre sozinho na primeira vez que uma versão
 * nova é aberta. Um botão só, que marca a versão como vista.
 * Orbi — Criado por Vinicius Braga
 */
import { useAppStore } from '../../store/useAppStore';
import { ModalShell } from '../ui/ModalShell';
import { Icon } from '../ui/Icon';

export function WhatsNewModal() {
  const whatsNew = useAppStore((s) => s.whatsNew);
  const dismissWhatsNew = useAppStore((s) => s.dismissWhatsNew);

  return (
    <ModalShell open={whatsNew !== null} onClose={dismissWhatsNew} maxWidth="max-w-[520px]" zIndex="z-[52]">
      <div className="flex items-center justify-between bg-surface-container px-space-lg py-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
            <Icon name="auto_awesome" className="text-[20px]" fill />
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm font-semibold leading-tight text-on-surface">O que há de novo</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Versão {whatsNew?.version}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={dismissWhatsNew}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      <div className="overflow-y-auto whitespace-pre-line p-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
        {whatsNew?.notes}
      </div>
      <div className="flex items-center justify-end bg-surface-container-lowest px-space-lg py-space-md">
        <button
          type="button"
          onClick={dismissWhatsNew}
          className="flex h-9 items-center gap-1.5 rounded bg-primary px-space-lg font-title-md text-title-md font-semibold text-on-primary shadow-[0_0_14px_rgba(0,220,130,0.4)] transition-all hover:bg-primary-fixed"
        >
          <Icon name="check" className="text-[18px]" />
          Entendi
        </button>
      </div>
    </ModalShell>
  );
}
