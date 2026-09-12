# Orbi

Hub desktop (Electron) para manter várias contas de WhatsApp Web e de outros serviços abertas ao mesmo tempo, cada uma em uma **sessão isolada** guardada só neste computador.

Este projeto é o novo Orbi: a **interface** segue as telas do design system "Tactical NOC & Command Center" (Google Stitch) e a **funcionalidade** é a do Orbi original ([Orbi-Swit-Stack](https://github.com/ViniRJ92/Orbi-Swit-Stack)), preservada integralmente.

## Funcionalidades

- **Instâncias isoladas**: cada conta usa uma partition própria (`persist:account-<id>`). Cookies, IndexedDB e cache nunca se misturam.
- **Serviços**: WhatsApp Web, Instagram, TikTok, Facebook, Messenger, Pesquisa Google, Web Explorer (URL livre), Threads, X, ChatGPT, DeepSeek, Microsoft Copilot, Perplexity e Grok.
- **Conexão WhatsApp**: QR Code oficial do WhatsApp Web, detecção automática de login, "Reconectar QR".
- **Barra de contas**: status em tempo real, não lidas, favoritas, agrupamentos (pastas com cor), arrastar e soltar (reordenar, mover entre pastas, reordenar pastas), busca e filtro por estado, posição Esquerda/Direita/Topo/Inferior, largura redimensionável e três tamanhos.
- **Gerenciar contas**: grade com busca, filtros por estado e agrupamento, ordenação, seleção múltipla, suspender/remover em lote, cor de identificação.
- **Suspensão automática**: perfis Economia/Equilibrado/Desempenho/Personalizado (limite de instâncias carregadas + ociosidade).
- **Analytics**: volume recebido/enviado por instância, instância líder, horários de pico, Hoje x Ontem, comparação com o período anterior, filtro por agrupamento, exportação CSV e alertas de queda de sessão. Nunca lê o conteúdo das mensagens.
- **Agenda**: Mês/Semana/Dia, feriados nacionais calculados localmente, compromissos com categoria, instância vinculada e lembretes (adiar/concluir).
- **Configurações**: tema Escuro/Claro/Sistema, iniciar com o Windows, ação ao fechar, confirmação ao remover, notificações (Windows e internas), backup/restauração da organização, diagnóstico (memória, CPU, processos, log), limpeza de cache e histórico do Analytics.
- **Atualizações** via GitHub Releases (verificação automática; baixar e instalar só com clique), notas "O que há de novo".
- Bandeja do Windows, selo de não lidas na barra de tarefas, atalhos `Ctrl+1..9`, `Ctrl+Tab`, `Ctrl+K`, `F5`/`Ctrl+R`, `Esc`.

## Estrutura

```
src/main       Processo principal (sessões, contas, Analytics, Agenda, atualizações, IPC)
src/renderer   Interface React + Tailwind (tokens do Stitch em tailwind.config.cjs)
  components/shell     Cabeçalho, barra de contas e área da instância
  components/pages     Analytics, Agenda, Gerenciar contas, Ajuda, Configurações
  components/overlays  Adicionar conta, busca rápida, lembretes, avisos
```

A área da instância é medida pelo renderer (`useViewportBounds`) e enviada ao processo principal, que posiciona a `WebContentsView` exatamente dentro do painel do layout.

## Desenvolvimento

```bash
npm install
npm start          # build + abre o app
npm run dist:win   # instalador NSIS em release/
```

Para rodar uma cópia de teste sem tocar nas sessões reais do Orbi instalado:

```powershell
$env:ORBI_USER_DATA_DIR = "$env:TEMP\orbi-dev"; npm start
```

Os dados do app ficam em `%APPDATA%\orbi-swit-stack` (mesma pasta do Orbi original, para as contas continuarem conectadas).

---

Orbi — Criado por Vinicius Braga. Software proprietário, todos os direitos reservados.
