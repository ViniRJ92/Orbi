/**
 * Página "Ajuda" (tela do Stitch): manual de uso escrito no próprio app —
 * sempre o da versão instalada, funciona sem internet (Fase 50). Índice à
 * esquerda que acompanha a rolagem; contatos do suporte no fim (Fase 51).
 * Orbi — Criado por Vinicius Braga
 */
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { usePageEscape } from '../../usePageEscape';
import { Icon } from '../ui/Icon';

const SUPORTE_WHATSAPP_EXIBICAO = '(21) 97161-2853';
const SUPORTE_EMAIL = 'viniciusbraga.rio@gmail.com';

function Passo({ n, tone = 'primary', children }: { n: number; tone?: 'primary' | 'secondary' | 'container'; children: ReactNode }) {
  const circle =
    tone === 'secondary'
      ? 'bg-secondary-container text-on-secondary-container'
      : tone === 'container'
        ? 'bg-primary-container text-on-primary-container'
        : 'bg-primary text-on-primary';
  return (
    <div className="flex items-start gap-space-sm rounded bg-surface-container p-space-sm">
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-code-sm text-code-sm font-bold ${circle}`}>
        {n}
      </span>
      <span className="font-body-md text-body-md text-on-surface">{children}</span>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <code className="rounded bg-surface-container-highest px-1 py-0.5 font-code-sm text-code-sm text-primary">{children}</code>;
}

function SectionTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-space-xs font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
      <Icon name={icon} className="text-[16px]" />
      <span>{children}</span>
    </div>
  );
}

const P = 'font-body-md text-body-md leading-relaxed text-on-surface-variant';

interface HelpSection {
  id: string;
  label: string;
  icon: string;
  body: ReactNode;
}

const SECTIONS: HelpSection[] = [
  {
    id: 'inicio',
    label: 'Primeiros passos',
    icon: 'rocket_launch',
    body: (
      <>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">O que é o Orbi</h2>
          <p className={P}>
            O Orbi mantém várias contas de WhatsApp e de outros serviços abertas ao mesmo tempo, cada uma separada da outra. Uma
            conta nunca enxerga a sessão da outra, então você troca de número sem precisar sair e entrar de novo.
          </p>
        </div>
        <div className="space-y-space-sm pt-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Adicionar sua primeira conta</h3>
          <div className="space-y-space-xs">
            <Passo n={1}>Clique em "Adicionar conta", no fim da barra de contas.</Passo>
            <Passo n={2}>Escolha o serviço, por exemplo WhatsApp.</Passo>
            <Passo n={3}>Dê um nome que faça sentido para você, como "Atendimento 1", e escolha uma cor.</Passo>
            <Passo n={4}>A instância abre com o QR Code. Leia pelo celular, igual ao WhatsApp Web normal.</Passo>
          </div>
          <div className="mt-space-sm flex items-start gap-space-sm rounded-lg bg-surface-container-high p-space-md shadow-inner">
            <Icon name="verified" className="flex-shrink-0 text-[20px] text-primary" />
            <p className="font-body-md text-body-md text-on-surface">
              A leitura do QR Code só é necessária uma vez por conta. Depois disso ela reabre já conectada, mesmo depois de fechar
              o aplicativo.
            </p>
          </div>
        </div>
        <div className="space-y-space-xs pt-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Trocar de conta</h3>
          <p className={P}>
            Clique na conta desejada na barra lateral. Também dá para usar <Kbd>Ctrl+1</Kbd> até <Kbd>Ctrl+9</Kbd> para as nove
            primeiras, e <Kbd>Ctrl+Tab</Kbd> para passar de uma para a próxima.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'contas',
    label: 'Gerenciar contas',
    icon: 'grid_view',
    body: (
      <>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Onde fica</h2>
          <p className={P}>
            Botão "Gerenciar contas", no topo. É a central de tudo relacionado às instâncias: abrir, favoritar, trocar a cor,
            suspender, recarregar e excluir, uma a uma ou várias de uma vez.
          </p>
        </div>
        <div className="space-y-space-sm">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Organizar em agrupamentos</h3>
          <div className="space-y-space-xs">
            <Passo n={1} tone="secondary">
              Abra Configurações e vá na aba "Instâncias e Grupos".
            </Passo>
            <Passo n={2} tone="secondary">
              Crie um agrupamento, por exemplo "Vendas" ou "Suporte".
            </Passo>
            <Passo n={3} tone="secondary">
              Na lista de instâncias, escolha o agrupamento de cada uma.
            </Passo>
          </div>
          <div className="rounded bg-surface-container-high p-space-md font-body-md text-body-md text-on-surface-variant">
            Os agrupamentos aparecem como pastas na barra lateral e também servem de filtro no Analytics, para você ver o movimento
            de um grupo só. Também dá para arrastar uma instância para dentro ou para fora de uma pasta.
          </div>
        </div>
        <div className="space-y-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Instância suspensa</h3>
          <p className={P}>
            Para economizar memória, contas que ficam paradas em segundo plano podem ser suspensas. Uma conta suspensa não é lida
            pelo Analytics e não recebe aviso de mensagem. Basta clicar nela para voltar ao normal, sem precisar ler o QR Code de
            novo.
          </p>
          <div className="rounded bg-surface-container-lowest p-space-sm font-label-sm text-label-sm text-on-surface-variant">
            Quantas contas ficam ativas ao mesmo tempo é definido em Configurações, na aba "Desempenho e Avisos".
          </div>
        </div>
        <div className="space-y-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Recarregar uma instância</h3>
          <p className={P}>
            Se uma conta travar ou parar de atualizar, use o botão de recarregar no topo, ou aperte <Kbd>F5</Kbd>. Recarregar não
            desconecta a conta.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'monitoring',
    body: (
      <>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">O que ele mede</h2>
          <p className={P}>
            O Analytics conta o movimento das suas conversas individuais. Grupos ficam de fora. Ele nunca guarda o conteúdo das
            mensagens, só quantidades.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          <div className="rounded bg-surface-container p-space-sm">
            <span className="block font-title-md text-title-md font-semibold text-on-surface">Interações</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Quantas pessoas diferentes falaram com você no dia. Se a mesma pessoa mandar vinte mensagens, continua sendo uma
              interação.
            </span>
          </div>
          <div className="rounded bg-surface-container p-space-sm">
            <span className="block font-title-md text-title-md font-semibold text-on-surface">Recebidas, Enviadas e Volume</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Recebidas: mensagens que chegaram até você. Enviadas: mensagens que saíram da sua operação. Volume total: as duas
              somadas.
            </span>
          </div>
        </div>
        <div className="space-y-space-sm">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Filtrar e exportar</h3>
          <div className="space-y-space-xs">
            <Passo n={1}>Escolha o período no topo: hoje, últimos 7 ou 30 dias, ou um intervalo personalizado.</Passo>
            <Passo n={2}>Use o seletor de agrupamento para ver só um grupo de instâncias.</Passo>
            <Passo n={3}>Ligue "Comparar com período anterior" para ver se subiu ou caiu.</Passo>
            <Passo n={4}>Clique em Exportar CSV para salvar o período num arquivo que abre no Excel.</Passo>
          </div>
        </div>
        <div className="space-y-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Por que abrir a conversa melhora a contagem</h3>
          <p className={P}>
            Com a conversa fechada, o aplicativo só enxerga o aviso de não lidas da lista lateral, que é uma estimativa. Ao abrir a
            conversa, ele lê cada mensagem individualmente e corrige o número daquele dia. Por isso o valor pode subir depois que
            você abre uma conversa.
          </p>
          <div className="rounded bg-surface-container-high p-space-md font-body-md text-body-md text-on-surface-variant">
            Mensagem enviada só é contada nas conversas que você abre. Em conversa fechada o WhatsApp não mostra nada sobre envios,
            então a coluna "Enviadas" fica em zero até você abrir.
          </div>
        </div>
        <div className="space-y-space-xs">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Recomeçar do zero</h3>
          <p className={P}>
            Em Configurações, na aba "Backup e Diagnóstico", existe a opção de apagar o histórico do Analytics. Ela apaga só o
            histórico de métricas. Contas, conversas e logins não são afetados.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    icon: 'notifications',
    body: (
      <>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Os dois tipos de aviso</h2>
          <ul className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
            <li className="rounded bg-surface-container p-space-sm">
              <strong className="font-semibold text-on-surface">Notificações do Windows:</strong> a caixa do sistema. É a que você
              vê quando o aplicativo está minimizado ou atrás de outra janela.
            </li>
            <li className="rounded bg-surface-container p-space-sm">
              <strong className="font-semibold text-on-surface">Notificações internas:</strong> o aviso que aparece sobre a barra de
              contas. Só existe com a janela do Orbi aberta na frente.
            </li>
          </ul>
        </div>
        <div className="space-y-space-sm">
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Como configurar</h3>
          <div className="space-y-space-xs">
            <Passo n={1} tone="container">
              Abra Configurações e vá na aba "Desempenho e Avisos".
            </Passo>
            <Passo n={2} tone="container">
              Use a chave geral para ligar ou desligar todos os avisos de uma vez.
            </Passo>
            <Passo n={3} tone="container">
              Abaixo dela, ligue ou desligue cada tipo separadamente.
            </Passo>
          </div>
          <div className="rounded bg-surface-container-high p-space-md font-body-md text-body-md text-on-surface-variant">
            Clicar no aviso abre direto a instância que recebeu a mensagem. Mesmo com os dois desligados, o contador de não lidas
            continua marcando na barra lateral.
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: 'settings',
    body: (
      <>
        <div className="space-y-space-xs rounded-lg bg-surface-container p-space-md">
          <div className="flex items-center gap-space-xs">
            <Icon name="palette" className="text-[18px] text-primary" />
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Geral e Aparência</h2>
          </div>
          <p className={P}>
            Tema claro ou escuro, posição da barra de contas (esquerda, direita, topo ou inferior), tamanho dos cards, se o
            aplicativo abre junto com o Windows e o que acontece ao clicar no X da janela.
          </p>
        </div>
        <div className="space-y-space-xs rounded-lg bg-surface-container p-space-md">
          <div className="flex items-center gap-space-xs">
            <Icon name="speed" className="text-[18px] text-primary" />
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Desempenho</h2>
          </div>
          <p className={P}>
            Define quantas instâncias ficam prontas ao mesmo tempo. Quanto mais instâncias ativas, mais memória o aplicativo usa, e
            mais rápido é trocar entre elas. No modo Personalizado você escolhe o número.
          </p>
        </div>
        <div className="space-y-space-sm rounded-lg bg-surface-container p-space-md">
          <div className="flex items-center gap-space-xs">
            <Icon name="security_update_good" className="text-[18px] text-primary" />
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Backup e Diagnóstico</h2>
          </div>
          <p className={P}>
            Exporta e restaura nomes, cores, ordem e agrupamentos das instâncias. O backup não inclui login nem conversas, então
            restaurar num computador novo não dispensa a leitura do QR Code.
          </p>
          <div className="flex items-start gap-space-sm rounded bg-surface-container-lowest p-space-md">
            <Icon name="terminal" className="flex-shrink-0 text-[18px] text-secondary-container" />
            <span className={P}>
              Nesta aba também ficam o uso de memória e CPU do aplicativo e o acesso aos logs, úteis quando algo não está
              funcionando como esperado.
            </span>
          </div>
        </div>
        <div className="space-y-space-xs rounded-lg bg-surface-container p-space-md">
          <div className="flex items-center gap-space-xs">
            <Icon name="sync" className="text-[18px] text-primary" />
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Atualizações</h2>
          </div>
          <p className={P}>
            O Orbi verifica sozinho se existe versão nova, ao abrir e de tempos em tempos. Nesta aba dá para verificar na hora,
            baixar e instalar.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'atalhos',
    label: 'Atalhos de teclado',
    icon: 'keyboard',
    body: (
      <>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Lista completa</h2>
        </div>
        <div className="overflow-hidden rounded-lg bg-surface-container-lowest">
          <div className="grid grid-cols-12 bg-surface-container-high px-space-md py-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            <div className="col-span-5 font-semibold sm:col-span-4">Combinação</div>
            <div className="col-span-7 font-semibold sm:col-span-8">O que faz</div>
          </div>
          <div className="divide-y divide-surface-container/40 font-body-md text-body-md">
            {[
              ['Ctrl + 1 até Ctrl + 9', 'Vai direto para a instância daquela posição'],
              ['Ctrl + Tab', 'Passa para a próxima instância'],
              ['Ctrl + Shift + Tab', 'Volta para a instância anterior'],
              ['Ctrl + K', 'Abre a busca rápida de contas'],
              ['F5 ou Ctrl + R', 'Recarrega a instância que está aberta'],
              ['Esc', 'Fecha a tela aberta no momento'],
            ].map(([tecla, oQueFaz]) => (
              <div key={tecla} className="grid grid-cols-12 items-center px-space-md py-space-sm transition-colors hover:bg-surface-container-high/50">
                <div className="col-span-5 sm:col-span-4">
                  <span className="inline-flex items-center rounded bg-surface-container px-space-sm py-0.5 font-code-sm text-code-sm font-bold text-primary shadow-sm">
                    {tecla}
                  </span>
                </div>
                <div className="col-span-7 text-on-surface sm:col-span-8">{oQueFaz}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  },
];

export function HelpPage() {
  const appInfo = useAppStore((s) => s.appInfo);
  const goHome = useAppStore((s) => s.goHome);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const contentRef = useRef<HTMLDivElement>(null);
  const [espacoFinal, setEspacoFinal] = useState(0);

  usePageEscape();

  function distanciaAteOTopo(alvo: HTMLElement, container: HTMLElement): number {
    return alvo.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  }

  // Folga mínima no fim para a última seção conseguir encostar no topo.
  useLayoutEffect(() => {
    const container = contentRef.current;
    const ultima = document.getElementById(`ajuda-${SECTIONS[SECTIONS.length - 1].id}`);
    if (!container || !ultima) return;
    const espacoInterno = parseFloat(getComputedStyle(container).paddingTop) || 0;
    const alturaSemFolga = container.scrollHeight - espacoFinal;
    const rolagemAlvo = distanciaAteOTopo(ultima, container) - espacoInterno;
    const necessario = Math.max(0, rolagemAlvo - (alturaSemFolga - container.clientHeight));
    if (Math.abs(necessario - espacoFinal) > 1) setEspacoFinal(necessario);
  }, [espacoFinal]);

  function irPara(id: string) {
    setActiveId(id);
    const alvo = document.getElementById(`ajuda-${id}`);
    const container = contentRef.current;
    if (!alvo || !container) return;
    const espacoInterno = parseFloat(getComputedStyle(container).paddingTop) || 0;
    container.scrollTo({ top: Math.max(0, distanciaAteOTopo(alvo, container) - espacoInterno), behavior: 'smooth' });
  }

  function onScroll() {
    const container = contentRef.current;
    if (!container) return;
    const espacoInterno = parseFloat(getComputedStyle(container).paddingTop) || 0;
    const linhaDeCorte = container.scrollTop + espacoInterno + 24;
    let atual = SECTIONS[0].id;
    for (const s of SECTIONS) {
      const el = document.getElementById(`ajuda-${s.id}`);
      if (el && distanciaAteOTopo(el, container) <= linhaDeCorte) atual = s.id;
    }
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
      atual = SECTIONS[SECTIONS.length - 1].id;
    }
    setActiveId(atual);
  }

  return (
    <div className="relative h-full px-gutter">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1ce388_1px,transparent_1px)] opacity-40 [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)]" />
      <div className="relative flex h-full w-full flex-col items-center py-space-md">
        <div className="relative z-10 flex max-h-full min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-xl bg-surface-container-low/95 shadow-2xl">
          <div className="h-1 w-full flex-none bg-gradient-to-r from-primary-container via-primary to-secondary-container" />
          <div className="flex flex-none items-center justify-between bg-surface-container-lowest/80 px-space-lg py-space-md backdrop-blur-md">
            <div className="flex items-center gap-space-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(0,220,130,0.35)]">
                <Icon name="help" fill className="text-[20px]" />
              </div>
              <div className="flex items-baseline gap-space-sm">
                <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">Ajuda</h1>
                <span className="font-label-sm text-label-sm font-medium tracking-wide text-on-surface-variant">
                  Manual de uso • v{appInfo?.version ?? ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="hidden items-center gap-space-xs rounded bg-surface-container px-space-sm py-1 font-badge-micro text-badge-micro font-bold uppercase tracking-wider text-primary sm:flex">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                FUNCIONA OFFLINE
              </div>
              <button
                type="button"
                aria-label="Fechar manual"
                onClick={goHome}
                className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-surface-container-low md:flex-row">
            <aside className="flex w-full flex-shrink-0 flex-col gap-space-xs bg-surface-container-lowest/60 p-space-md md:w-64">
              <div className="px-space-xs py-1 font-label-sm text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
                Sumário
              </div>
              <nav className="mt-space-xs flex flex-col gap-1">
                {SECTIONS.map((s) => {
                  const isActive = activeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => irPara(s.id)}
                      className={
                        'group flex w-full items-center justify-between rounded-lg px-space-sm py-2 text-left font-headline-sm text-body-md transition-all ' +
                        (isActive
                          ? 'bg-surface-container-high font-semibold text-primary shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface')
                      }
                    >
                      <span className="flex items-center gap-space-sm truncate">
                        <Icon
                          name={s.icon}
                          fill={isActive}
                          className={'text-[18px] ' + (isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary')}
                        />
                        <span className={'truncate ' + (isActive ? '' : 'font-medium')}>{s.label}</span>
                      </span>
                      {isActive && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto flex flex-col gap-space-xs rounded-lg bg-surface-container-high p-space-sm">
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>VERSÃO INSTALADA</span>
                  <span className="font-code-sm text-primary">v{appInfo?.version ?? ''}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Este manual é o da versão instalada e funciona sem internet.
                </p>
              </div>
            </aside>

            <div ref={contentRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-space-xl overflow-y-auto p-space-lg">
              {SECTIONS.map((s, i) => (
                <section key={s.id} id={`ajuda-${s.id}`} className={'space-y-space-md ' + (i > 0 ? 'pt-space-lg' : '')}>
                  <SectionTitle icon={s.icon}>{s.label}</SectionTitle>
                  {s.body}
                </section>
              ))}

              <section className="space-y-space-sm rounded-lg bg-surface-container p-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="support_agent" className="text-[18px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Ainda precisa de ajuda?</h3>
                </div>
                <p className={P}>Se algo não funcionou como esperado ou ficou dúvida, fale direto com o suporte.</p>
                <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
                  <div className="flex items-center gap-space-sm rounded bg-surface-container-lowest p-space-sm">
                    <Icon name="chat" className="text-[18px] text-primary" />
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      WhatsApp:{' '}
                      <span className="cursor-text select-text font-code-sm font-semibold text-on-surface">{SUPORTE_WHATSAPP_EXIBICAO}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-space-sm rounded bg-surface-container-lowest p-space-sm">
                    <Icon name="mail" className="text-[18px] text-primary" />
                    <span className="min-w-0 truncate font-body-md text-body-md text-on-surface-variant">
                      E-mail: <span className="cursor-text select-text font-code-sm font-semibold text-on-surface">{SUPORTE_EMAIL}</span>
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-outline">
                  Ao relatar um problema, diga qual instância, o que você fez e o que aconteceu. Isso resolve bem mais rápido.
                </p>
              </section>
              <div aria-hidden style={{ height: espacoFinal }} />
            </div>
          </div>

          <div className="flex flex-none items-center justify-between bg-surface-container-lowest px-space-lg py-space-sm">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="info" className="text-[15px] text-primary" />
              <span>Dúvidas adicionais: fale com o suporte pelo WhatsApp ou e-mail acima.</span>
            </div>
            <button
              type="button"
              onClick={goHome}
              className="h-8 rounded bg-surface-container px-space-md font-title-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
