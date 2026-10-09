import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** Element koji dobija fokus pri otvaranju (selektor unutar dijaloga). */
  initialFocus?: string;
}

/** Stog otvorenih dijaloga: tastaturu obrađuje samo najgornji (npr. lightbox iznad detalja modela). */
const stack: object[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Pristupačan modal: Escape, zadržan fokus, povratak fokusa i zaključan skrol pozadine. */
export function Dialog({ open, onClose, labelledBy, children, className = '', initialFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = (initialFocus && node?.querySelector<HTMLElement>(initialFocus)) || node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    document.body.classList.add('is-locked');
    const token = {};
    stack.push(token);
    // Pozadina stranice je neaktivna dok je dijalog otvoren (fokus i čitači ekrana ostaju u dijalogu).
    const appRoot = document.getElementById('root');
    if (appRoot) appRoot.inert = true;

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      if (stack.length === 0) {
        document.body.classList.remove('is-locked');
        if (appRoot) appRoot.inert = false;
      }
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocus]);

  if (!open) return null;
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={`dialog ${className}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
