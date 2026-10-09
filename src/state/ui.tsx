import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export type InquiryScope = 'project' | 'draft';

interface UiValue {
  productId: string | null;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  lightbox: LightboxImage | null;
  openLightbox: (img: LightboxImage) => void;
  closeLightbox: () => void;
  inquiry: InquiryScope | null;
  openInquiry: (scope: InquiryScope) => void;
  closeInquiry: () => void;
  goTo: (id: string, focusSelector?: string) => void;
}

const UiContext = createContext<UiValue | null>(null);

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Skrola do sekcije i premješta fokus (za tastaturu i čitače ekrana). */
export function scrollToSection(id: string, focusSelector?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const target = (focusSelector ? el.querySelector<HTMLElement>(focusSelector) : null) ?? el.querySelector<HTMLElement>('h2, h1');
  if (target) {
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [productId, setProductId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const [inquiry, setInquiry] = useState<InquiryScope | null>(null);
  // Odgođeno, da se prvo zatvori eventualni dijalog i vrati fokus, pa tek onda skrola.
  const goTo = useCallback((id: string, focusSelector?: string) => {
    window.setTimeout(() => scrollToSection(id, focusSelector), 0);
  }, []);

  const value = useMemo<UiValue>(
    () => ({
      productId,
      openProduct: setProductId,
      closeProduct: () => setProductId(null),
      lightbox,
      openLightbox: setLightbox,
      closeLightbox: () => setLightbox(null),
      inquiry,
      openInquiry: setInquiry,
      closeInquiry: () => setInquiry(null),
      goTo,
    }),
    [productId, lightbox, inquiry, goTo],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi mora biti unutar UiProvider');
  return ctx;
}
