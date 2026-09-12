/**
 * Ciclo de vida da janela principal: criação, controles de janela (a janela
 * não tem moldura do sistema — o cabeçalho do Orbi desenha minimizar,
 * maximizar e fechar, como no layout do Stitch), aplicação da área onde a
 * instância é desenhada, e o comportamento de "fechar minimiza para a bandeja"
 * (a saída de verdade só acontece pelo menu da bandeja — ver trayManager.ts).
 *
 * Área da instância: até a versão anterior, o processo principal calculava a
 * posição da WebContentsView com constantes que precisavam bater pixel a pixel
 * com o CSS (altura do header, largura da barra, altura da barra no modo Topo).
 * No novo layout a instância fica dentro de painéis com espaçamento próprio,
 * então quem mede é o renderer: ele observa o elemento reservado para a
 * instância e manda o retângulo real por IPC (`mw:set-content-bounds`). Não
 * existe mais número duplicado para ficar dessincronizado.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { BrowserWindow, Menu, dialog } from 'electron';
import * as path from 'path';
import { CloseBehavior } from './settingsStore';
import { buildUnreadBadge } from './unreadBadge';

export class WindowManager {
  private window: BrowserWindow | null = null;
  private isQuitting = false;

  constructor(
    private readonly appName: string,
    private readonly creatorName: string,
    private readonly iconPath: string,
    private readonly onContentBoundsChanged: (bounds: Electron.Rectangle) => void,
    private readonly onInputEvent: (input: Electron.Input) => void,
    private readonly onReady: () => void,
    private readonly getCloseBehavior: () => CloseBehavior,
    private readonly onRequestQuit: () => void
  ) {}

  markQuitting(): void {
    this.isQuitting = true;
  }

  get(): BrowserWindow | null {
    return this.window;
  }

  create(): BrowserWindow {
    const win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 640,
      frame: false,
      backgroundColor: '#0e141b',
      title: `${this.appName} · ${this.creatorName}`,
      icon: this.iconPath,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.window = win;

    Menu.setApplicationMenu(null);

    win.webContents.on('before-input-event', (_event, input) => this.onInputEvent(input));

    const emitMaximized = () => {
      if (!win.isDestroyed()) win.webContents.send('mw:window-maximized-changed', win.isMaximized());
    };
    win.on('maximize', emitMaximized);
    win.on('unmaximize', emitMaximized);

    win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

    win.webContents.on('did-finish-load', () => {
      emitMaximized();
      this.onReady();
    });

    // Fechar a janela (botão X do cabeçalho ou Alt+F4): por padrão minimiza
    // para a bandeja, mas o usuário pode preferir que sempre pergunte ou que
    // já encerre o app de verdade (Configurações → Geral). "isQuitting"
    // continua sendo o jeito de fechar de fato (menu Sair da bandeja).
    win.on('close', (event) => {
      if (this.isQuitting) return;
      const behavior = this.getCloseBehavior();

      if (behavior === 'tray') {
        event.preventDefault();
        win.hide();
        return;
      }

      if (behavior === 'quit') {
        event.preventDefault();
        this.onRequestQuit();
        return;
      }

      // 'ask': impede o fechamento imediato e pergunta antes de decidir.
      event.preventDefault();
      dialog
        .showMessageBox(win, {
          type: 'question',
          buttons: ['Minimizar para a bandeja', 'Sair do programa', 'Cancelar'],
          defaultId: 0,
          cancelId: 2,
          title: this.appName,
          message: 'O que você quer fazer?',
          detail: 'Minimizar mantém as contas ativas em segundo plano. Sair encerra o programa completamente.',
        })
        .then(({ response }) => {
          if (response === 0) {
            win.hide();
          } else if (response === 1) {
            this.onRequestQuit();
          }
        });
    });

    win.on('closed', () => {
      this.window = null;
    });

    return win;
  }

  /**
   * Aplica o retângulo medido pelo renderer para a instância.
   *
   * Fase 61 (mantida): NUNCA reposicionar a instância enquanto a janela está
   * minimizada ou escondida. Ao minimizar, o Windows pode reportar tamanho
   * zero; uma view 0x0 é tratada pelo Chromium como oculta e tem timers e rede
   * estrangulados, derrubando a conexão do WhatsApp Web. Enquanto minimizada,
   * vale a última medida boa.
   */
  applyContentBounds(rect: { x: number; y: number; width: number; height: number }): void {
    const win = this.window;
    if (!win || win.isDestroyed() || win.isMinimized() || !win.isVisible()) return;
    const bounds = {
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
    if (bounds.width <= 0 || bounds.height <= 0) return;
    this.onContentBoundsChanged(bounds);
  }

  minimize(): void {
    this.window?.minimize();
  }

  toggleMaximize(): void {
    const win = this.window;
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }

  isMaximized(): boolean {
    return !!this.window?.isMaximized();
  }

  /** Mesmo caminho do X da moldura do sistema: passa pelo comportamento configurado em `close`. */
  close(): void {
    this.window?.close();
  }

  show(): void {
    const win = this.window;
    if (!win) return;
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
  }

  toggle(): void {
    const win = this.window;
    if (!win) return;
    if (win.isVisible() && win.isFocused()) {
      win.hide();
    } else {
      this.show();
    }
  }

  /** Selo com o total de não lidas no ícone da barra de tarefas (só Windows). */
  updateUnreadBadge(count: number): void {
    const win = this.window;
    if (!win || process.platform !== 'win32') return;
    const icon = buildUnreadBadge(count);
    if (icon) {
      win.setOverlayIcon(icon, `${count} mensagem(ns) não lida(s)`);
    } else {
      win.setOverlayIcon(null, '');
    }
  }
}
