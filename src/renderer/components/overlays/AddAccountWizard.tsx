/**
 * Assistente "Adicionar conta" (tela do Stitch) em três etapas: serviço, nome
 * (e endereço, se Web Explorer) e cor de identificação. Chama a mesma API de
 * sempre (window.multiwhats.addAccount) e abre a instância criada.
 *
 * A grade traz as mesmas 14 plataformas do Orbi (Fase 31.1: serviços que
 * exigem login Google não entram, porque o Google recusa esse login em
 * navegador embutido), com os ícones mostrados na tela do Stitch.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { ReactNode, useState } from 'react';
import { AccountService, SERVICES } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ModalShell } from '../ui/ModalShell';
import { Icon } from '../ui/Icon';
import { AccountColorPicker, COLOR_CHOICES } from '../ui/AccountColorPicker';

const TILES: { service: AccountService; box: string; icon: ReactNode }[] = [
  {
    service: 'whatsapp',
    box: 'bg-[#25D366]/15',
    icon: (
      <svg className="h-6 w-6 fill-[#25D366]" viewBox="0 0 24 24">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.55 0 8.25 3.7 8.25 8.24 0 2.2-.86 4.28-2.42 5.83-1.56 1.56-3.63 2.42-5.83 2.42-1.48 0-2.93-.39-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.25-4.39c0-4.54 3.7-8.24 8.25-8.24zm4.52 11.64c-.25-.12-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.12-.17.25-.65.8-.79.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.25-.87.85-.87 2.08s.89 2.41 1.01 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
      </svg>
    ),
  },
  {
    service: 'instagram',
    box: 'bg-gradient-to-tr from-[#FD1D1D]/20 via-[#E1306C]/20 to-[#405DE6]/20',
    icon: (
      <svg className="h-6 w-6 fill-[#E1306C]" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    service: 'tiktok',
    box: 'bg-surface-container-high',
    icon: (
      <svg className="h-6 w-6 fill-on-surface" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 10.82 4.48c1.33-1.33 2.07-3.13 2.07-5.02V8.78c1.47 1.05 3.26 1.67 5.16 1.72V7.05c-.56-.02-1.12-.14-1.6-.36z" />
      </svg>
    ),
  },
  {
    service: 'facebook',
    box: 'bg-[#1877F2]/15',
    icon: (
      <svg className="h-6 w-6 fill-[#1877F2]" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    service: 'messenger',
    box: 'bg-[#0084FF]/15',
    icon: (
      <svg className="h-6 w-6 fill-[#0084FF]" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.518 3.735 7.205V22l3.39-1.86c.91.252 1.877.388 2.875.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.09 12.38l-2.772-2.955-5.405 2.955 5.945-6.309 2.84 2.955 5.337-2.955-5.945 6.309z" />
      </svg>
    ),
  },
  {
    service: 'chrome',
    box: 'bg-surface-container-high',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
        <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
        <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.24 5.42l4.04-3.15z" fill="#FBBC05" />
        <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
      </svg>
    ),
  },
  { service: 'custom', box: 'bg-[#8B5CF6]/20', icon: <Icon name="language" className="text-[24px] text-[#A78BFA]" /> },
  {
    service: 'threads',
    box: 'bg-surface-container-high',
    icon: <span className="font-headline-sm text-headline-sm font-bold leading-none text-on-surface">@</span>,
  },
  {
    service: 'x',
    box: 'bg-surface-container-high',
    icon: (
      <svg className="h-5 w-5 fill-on-surface" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  { service: 'openai', box: 'bg-[#10A37F]/20', icon: <Icon name="smart_toy" className="text-[24px] text-[#10A37F]" /> },
  { service: 'deepseek', box: 'bg-[#0066FF]/20', icon: <Icon name="neurology" className="text-[24px] text-[#3B82F6]" /> },
  {
    service: 'copilot',
    box: 'bg-gradient-to-tr from-[#0078D4]/25 via-[#2358C2]/20 to-[#6E40C9]/30',
    icon: <Icon name="auto_awesome" className="text-[24px] text-[#60A5FA]" />,
  },
  { service: 'perplexity', box: 'bg-surface-container-high', icon: <Icon name="hub" className="text-[24px] text-secondary-container" /> },
  { service: 'grok', box: 'bg-surface-container-high', icon: <Icon name="deployed_code" className="text-[24px] text-on-surface" /> },
];

const INPUT =
  'w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded focus:outline-none focus:shadow-[0_0_0_1px_#00dc82,0_0_10px_rgba(0,220,130,0.25)] transition-all placeholder:text-on-surface-variant/60';

export function AddAccountWizard() {
  const open = useAppStore((s) => s.addAccountOpen);
  const setOpen = useAppStore((s) => s.setAddAccountOpen);
  const addAccount = useAppStore((s) => s.addAccount);
  const openAccount = useAppStore((s) => s.openAccount);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [service, setService] = useState<AccountService>('whatsapp');
  const [customUrl, setCustomUrl] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(0);
    setService('whatsapp');
    setCustomUrl('');
    setName('');
    setColor(COLOR_CHOICES[0]);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  // Fase 18: o nome sugerido é só o nome da plataforma, sem número automático.
  const suggestedName = SERVICES[service].label;
  const canAdvanceFromName = service !== 'custom' || customUrl.trim().length > 0;

  const next = () => {
    if (step === 0) setStep(1);
    else if (step === 1 && canAdvanceFromName) {
      if (!name.trim()) setName(suggestedName);
      setStep(2);
    }
  };

  const confirm = async () => {
    setSubmitting(true);
    const result = await addAccount(
      name.trim() || suggestedName,
      color,
      service,
      service === 'custom' ? customUrl.trim() : undefined
    );
    setSubmitting(false);
    if ('error' in result) {
      window.alert(result.error);
      return;
    }
    close();
    await openAccount(result.id);
  };

  return (
    // Esc só fecha na primeira etapa: nas outras descartaria o que já foi digitado (Fase 49).
    <ModalShell open={open} onClose={close} maxWidth="max-w-[660px]" closeOnEscape={step === 0} closeOnBackdrop={step === 0}>
      <div className="flex items-center justify-between bg-surface-container px-space-lg py-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name="person_add" className="text-[20px]" />
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">Adicionar conta</span>
            <span className="ml-1.5 rounded bg-surface-container-highest px-space-xs py-0.5 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
              etapa {step + 1}/3
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>

      <div className="flex min-h-0 flex-col gap-space-md overflow-y-auto bg-surface-container-low/95 p-space-lg">
        {step === 0 && (
          <>
            <div className="flex flex-col justify-between gap-space-xs sm:flex-row sm:items-center">
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">Qual serviço você quer conectar?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Selecione uma plataforma suportada para criar uma sessão isolada.
                </p>
              </div>
              <span className="self-start rounded bg-surface-container px-space-xs py-0.5 font-badge-micro text-badge-micro font-bold uppercase tracking-widest text-primary sm:self-auto">
                {TILES.length} PLATAFORMAS
              </span>
            </div>
            <div className="grid max-h-[420px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
              {TILES.map((tile) => {
                const selected = tile.service === service;
                return (
                  <button
                    key={tile.service}
                    type="button"
                    onClick={() => setService(tile.service)}
                    onDoubleClick={() => {
                      setService(tile.service);
                      setStep(1);
                    }}
                    className={
                      'group relative flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-xl p-space-sm text-center shadow-sm transition-all hover:bg-surface-container hover:shadow-[0_0_16px_rgba(0,220,130,0.18)] ' +
                      (selected ? 'bg-surface-container-high shadow-[0_0_16px_rgba(0,220,130,0.25)]' : 'bg-surface')
                    }
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${tile.box}`}>
                      {tile.icon}
                    </div>
                    <span className="font-body-sm text-body-sm font-medium text-on-surface transition-colors group-hover:text-primary">
                      {SERVICES[tile.service].label}
                    </span>
                    {selected && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#45f99c]" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Como esta instância vai se chamar?</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                O nome aparece na barra de contas, no Analytics e na Agenda. Dá para trocar depois em Configurações.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Nome de exibição
              </label>
              <input
                autoFocus
                type="text"
                maxLength={40}
                value={name}
                placeholder={suggestedName}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') next();
                }}
                className={INPUT}
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant">Deixe em branco para usar "{suggestedName}".</span>
            </div>
            {service === 'custom' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Endereço do site
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 font-code-sm text-code-sm text-outline">https://</span>
                  <input
                    type="text"
                    value={customUrl}
                    placeholder="exemplo.com"
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') next();
                    }}
                    className={INPUT + ' pl-[72px]'}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Cor de identificação</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Ajuda a reconhecer a instância de relance na barra de contas e nos relatórios.
              </p>
            </div>
            <AccountColorPicker value={color} onChange={setColor} />
          </>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-lowest px-space-lg py-space-md sm:flex-row">
        <div className="flex items-center gap-space-xs text-left font-code-sm text-code-sm text-on-surface-variant">
          <Icon name="verified_user" className="text-[16px] text-primary" />
          <span className="line-clamp-1">Cada conta roda em uma sessão isolada</span>
        </div>
        <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
          <button
            type="button"
            onClick={() => (step === 0 ? close() : setStep((s) => (s === 2 ? 1 : 0)))}
            className="rounded-lg bg-surface-container px-space-md py-2 font-body-md text-body-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              disabled={step === 1 && !canAdvanceFromName}
              className="flex items-center gap-space-xs rounded-lg bg-primary px-space-lg py-2 font-body-md text-body-md font-semibold tracking-wide text-on-primary shadow-[0_0_16px_rgba(69,249,156,0.3)] transition-all hover:bg-primary-fixed hover:shadow-[0_0_24px_rgba(69,249,156,0.5)] disabled:opacity-50"
            >
              <span>Continuar</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={submitting}
              className="flex items-center gap-space-xs rounded-lg bg-primary px-space-lg py-2 font-body-md text-body-md font-semibold tracking-wide text-on-primary shadow-[0_0_16px_rgba(69,249,156,0.3)] transition-all hover:bg-primary-fixed disabled:opacity-60"
            >
              <Icon name="check" className="text-[18px]" />
              <span>{submitting ? 'Criando...' : 'Criar conta'}</span>
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
