/**
 * Configurações > Geral & Aparência (tela "Preferências" do Stitch): iniciar
 * com o Windows, tema, posição da barra de contas, tamanho dos cards, ação ao
 * fechar a janela, confirmação ao remover e o mapa de atalhos.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { CloseBehavior, IconSize, SidebarPosition, ThemePreference } from '../../../types';
import { useAppStore } from '../../../store/useAppStore';
import { Icon } from '../../ui/Icon';
import { Toggle } from '../../ui/Toggle';
import { TabHeader } from './SettingsPage';

const DOCKS: { value: SidebarPosition; label: string; icon: string }[] = [
  { value: 'left', label: 'Esquerda', icon: 'dock_to_left' },
  { value: 'right', label: 'Direita', icon: 'dock_to_right' },
  { value: 'top', label: 'Topo', icon: 'horizontal_split' },
  { value: 'bottom', label: 'Inferior', icon: 'view_stream' },
];

const DENSITIES: { value: IconSize; label: string; icon: string; size: string }[] = [
  { value: 'small', label: 'Pequeno', icon: 'grid_goldenratio', size: 'text-[14px]' },
  { value: 'medium', label: 'Médio', icon: 'grid_view', size: 'text-[16px]' },
  { value: 'large', label: 'Grande', icon: 'grid_4x4', size: 'text-[18px]' },
];

const CLOSES: { value: CloseBehavior; label: string; hint: string }[] = [
  { value: 'tray', label: 'Minimizar p/ Bandeja', hint: 'Minimiza e mantém as contas ativas.' },
  { value: 'ask', label: 'Perguntar', hint: 'Mostra uma opção toda vez.' },
  { value: 'quit', label: 'Sair do Orbi', hint: 'Encerra o programa por completo.' },
];

const SHORTCUTS: { action: string; keys: string[]; context: string }[] = [
  { action: 'Ir direto para a instância da posição', keys: ['Ctrl', '1..9'], context: 'Barra de contas' },
  { action: 'Próxima / anterior instância', keys: ['Ctrl', '(Shift) Tab'], context: 'Qualquer tela' },
  { action: 'Busca rápida de contas', keys: ['Ctrl', 'K'], context: 'Qualquer tela' },
  { action: 'Recarregar a instância aberta', keys: ['F5 ou Ctrl', 'R'], context: 'Instância' },
  { action: 'Fechar a tela aberta', keys: ['Esc'], context: 'Páginas e janelas' },
];

export function GeneralTab() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const sidebarPosition = useAppStore((s) => s.sidebarPosition);
  const setSidebarPosition = useAppStore((s) => s.setSidebarPosition);
  const iconSize = useAppStore((s) => s.iconSize);
  const setIconSize = useAppStore((s) => s.setIconSize);
  const confirmBeforeRemove = useAppStore((s) => s.confirmBeforeRemove);
  const setConfirmBeforeRemove = useAppStore((s) => s.setConfirmBeforeRemove);

  const [startup, setStartup] = useState(false);
  const [closeBehavior, setCloseBehavior] = useState<CloseBehavior>('tray');

  useEffect(() => {
    window.multiwhats.getStartupSetting().then(setStartup);
    window.multiwhats.getCloseBehavior().then(setCloseBehavior);
  }, []);

  const toggleStartup = async () => setStartup(await window.multiwhats.setStartupSetting(!startup));
  const applyClose = async (b: CloseBehavior) => {
    await window.multiwhats.setCloseBehavior(b);
    setCloseBehavior(b);
  };
  const toggleConfirm = async () => setConfirmBeforeRemove(await window.multiwhats.setConfirmBeforeRemove(!confirmBeforeRemove));

  const segBtn = (active: boolean) =>
    'rounded text-center font-label-sm text-label-sm transition-all ' +
    (active ? 'bg-surface-container-high font-semibold text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface');

  return (
    <>
      <TabHeader
        icon="brush"
        title="Geral & Aparência"
        description="Inicialização, tema, posição da barra de contas e comportamento da janela."
      />

      <div className="rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex items-start justify-between gap-space-md">
          <div className="space-y-0.5">
            <span className="font-title-md text-title-md font-semibold text-on-surface">Iniciar com o Windows</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Abre o Orbi automaticamente quando o Windows inicia, para as contas continuarem conectadas na bandeja.
            </p>
          </div>
          <div className="mt-1">
            <Toggle checked={startup} onChange={toggleStartup} label="Iniciar com o Windows" />
          </div>
        </div>
      </div>

      <div className="space-y-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div>
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Tema visual</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Escolha o esquema de cores da interface do Orbi.</p>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
          <ThemeCard value="dark" current={theme} onPick={setTheme} label="Escuro" icon="dark_mode" />
          <ThemeCard value="light" current={theme} onPick={setTheme} label="Claro" icon="light_mode" />
          <ThemeCard value="system" current={theme} onPick={setTheme} label="Igual ao Windows" icon="settings_brightness" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <div className="flex flex-col justify-between space-y-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
          <div>
            <span className="flex items-center gap-1.5 font-title-md text-title-md font-semibold text-on-surface">
              <Icon name="dock" className="text-[16px]" />
              Posição da barra de contas
            </span>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">Em qual lado da janela a lista de instâncias fica.</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-surface-container-lowest p-1">
            {DOCKS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setSidebarPosition(d.value)}
                className={segBtn(sidebarPosition === d.value) + ' flex flex-col items-center gap-1 py-1.5'}
              >
                <Icon name={d.icon} className="text-[16px]" />
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between space-y-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
          <div>
            <span className="flex items-center gap-1.5 font-title-md text-title-md font-semibold text-on-surface">
              <Icon name="density_medium" className="text-[16px]" />
              Tamanho dos cards & ícones
            </span>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Tamanho dos ícones, texto e espaçamento das contas na barra, em qualquer posição.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-surface-container-lowest p-1">
            {DENSITIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setIconSize(d.value)}
                className={segBtn(iconSize === d.value) + ' flex items-center justify-center gap-1 py-1.5'}
              >
                <Icon name={d.icon} className={d.size} />
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-space-md rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex flex-col justify-between gap-space-sm border-b border-surface-container-high pb-space-sm sm:flex-row sm:items-center">
          <div>
            <span className="flex items-center gap-1.5 font-title-md text-title-md font-semibold text-on-surface">
              <Icon name="close_fullscreen" className="text-[16px]" />
              Ação ao fechar a janela [X]
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {CLOSES.find((c) => c.value === closeBehavior)?.hint ?? 'O que acontece ao clicar no X.'}
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-surface-container-lowest p-1">
            {CLOSES.map((c) => (
              <button key={c.value} type="button" onClick={() => applyClose(c.value)} className={segBtn(closeBehavior === c.value) + ' px-3 py-1'}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer select-none items-center gap-space-xs pt-1">
          <input type="checkbox" checked={confirmBeforeRemove} onChange={toggleConfirm} className="h-4 w-4 cursor-pointer rounded accent-[#45f99c]" />
          <span className="font-title-md text-title-md font-medium text-on-surface">Pedir confirmação antes de remover uma instância</span>
        </label>
      </div>

      <div className="rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="mb-space-sm flex items-center gap-space-xs">
          <Icon name="keyboard" className="text-[18px] text-on-surface-variant" />
          <span className="font-title-md text-title-md font-semibold text-on-surface">Atalhos de teclado</span>
        </div>
        <div className="overflow-hidden rounded-lg bg-surface-container-lowest">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high/60">
              <tr className="font-body-sm text-body-sm text-outline">
                <th className="px-space-md py-2 font-medium">Ação</th>
                <th className="px-space-md py-2 font-medium">Teclas</th>
                <th className="hidden px-space-md py-2 font-medium sm:table-cell">Onde funciona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
              {SHORTCUTS.map((s) => (
                <tr key={s.action} className="transition-colors hover:bg-surface-container-high/30">
                  <td className="px-space-md py-2.5 font-title-md text-title-md text-on-surface">{s.action}</td>
                  <td className="whitespace-nowrap px-space-md py-2.5">
                    {s.keys.map((k, i) => (
                      <span key={k}>
                        {i > 0 && <span className="mx-1 text-outline">+</span>}
                        <kbd className="rounded bg-surface-container-high px-2 py-0.5 font-code-sm text-code-sm text-on-surface">{k}</kbd>
                      </span>
                    ))}
                  </td>
                  <td className="hidden px-space-md py-2.5 text-on-surface-variant sm:table-cell">{s.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ThemeCard({
  value,
  current,
  onPick,
  label,
  icon,
}: {
  value: ThemePreference;
  current: ThemePreference;
  onPick: (t: ThemePreference) => void;
  label: string;
  icon: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={
        'flex cursor-pointer flex-col gap-2 rounded-lg p-space-sm text-left transition-all duration-200 ' +
        (active ? 'bg-surface-container-highest shadow-[0_0_14px_rgba(0,220,130,0.25)]' : 'bg-surface-container opacity-80 hover:bg-surface-container-high hover:opacity-100')
      }
    >
      {value === 'dark' && (
        <div className="flex h-20 w-full flex-col justify-between overflow-hidden rounded bg-[#0e141b] p-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ffb4ab]" />
              <span className="h-2 w-2 rounded-full bg-[#6ffbbe]" />
              <span className="h-2 w-2 rounded-full bg-[#00dc82]" />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <span className="h-8 w-1/4 rounded bg-[#252a32]" />
            <span className="flex h-11 w-3/4 flex-col gap-1 rounded bg-[#1a2027] p-1">
              <span className="h-1.5 w-1/2 rounded bg-[#00dc82]" />
              <span className="h-1.5 w-3/4 rounded bg-[#343a42]" />
            </span>
          </div>
        </div>
      )}
      {value === 'light' && (
        <div className="flex h-20 w-full flex-col justify-between overflow-hidden rounded bg-[#dde3ed] p-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#2f353d]" />
              <span className="h-2 w-2 rounded-full bg-[#2f353d]" />
              <span className="h-2 w-2 rounded-full bg-[#2f353d]" />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <span className="h-8 w-1/4 rounded bg-white/70" />
            <span className="flex h-11 w-3/4 flex-col gap-1 rounded bg-white p-1">
              <span className="h-1.5 w-1/2 rounded bg-[#006a6f]" />
              <span className="h-1.5 w-3/4 rounded bg-gray-300" />
            </span>
          </div>
        </div>
      )}
      {value === 'system' && (
        <div className="relative flex h-20 w-full flex-col justify-between overflow-hidden rounded bg-[#2f353d] p-2 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e141b] via-[#1a2027] to-[#dde3ed]/30 opacity-60" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#859587]" />
              <span className="h-2 w-2 rounded-full bg-[#859587]" />
            </div>
          </div>
          <div className="relative z-10 flex h-full items-center justify-center">
            <Icon name="desktop_windows" className="text-[24px] text-[#859587]" />
          </div>
        </div>
      )}
      <div className="flex w-full items-center justify-between">
        <span className={'flex items-center gap-1.5 font-title-md text-title-md ' + (active ? 'font-semibold text-primary' : 'font-medium text-on-surface-variant')}>
          <Icon name={icon} className="text-[16px]" />
          {label}
        </span>
        <Icon name={active ? 'radio_button_checked' : 'radio_button_unchecked'} className={'text-[18px] ' + (active ? 'text-primary' : 'text-outline')} />
      </div>
    </button>
  );
}
