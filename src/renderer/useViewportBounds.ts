/**
 * Mede o elemento reservado para a instância e envia o retângulo real ao
 * processo principal, que posiciona a WebContentsView exatamente ali (ver
 * windowManager.applyContentBounds).
 *
 * `ResizeObserver` cobre mudanças de tamanho (janela, barra redimensionada,
 * troca de layout); `layoutKey` cobre mudanças só de posição, que não alteram
 * o tamanho do elemento (ex.: barra de contas trocada de Esquerda para Direita
 * com a mesma largura).
 *
 * Orbi — Criado por Vinicius Braga
 */
import { RefObject, useLayoutEffect } from 'react';

export function useViewportBounds(ref: RefObject<HTMLElement | null>, active: boolean, layoutKey: string): void {
  useLayoutEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const send = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        window.multiwhats.setContentBounds({ x: r.left, y: r.top, width: r.width, height: r.height });
      });
    };

    send();
    const observer = new ResizeObserver(send);
    observer.observe(el);
    window.addEventListener('resize', send);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', send);
    };
  }, [ref, active, layoutKey]);
}
