import { useEffect, useState } from 'react';
import { quantityOf } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';

/**
 * Ljepljiva donja akcija na telefonu. Skriva se iznad kontakta i footera,
 * dok je fokus u polju za unos (tastatura) i dok je otvoren dijalog.
 */
export function MobileBar() {
  const { state } = useStore();
  const { openInquiry, goTo, inquiry, productId, lightbox } = useUi();
  const [hiddenBySection, setHiddenBySection] = useState(false);
  const [typing, setTyping] = useState(false);
  const total = state.items.reduce((s, i) => s + quantityOf(i), 0);

  useEffect(() => {
    const targets = ['kontakt', 'footer', 'top'].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const visible = new Set<string>();
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        setHiddenBySection(visible.size > 0);
      },
      { threshold: 0.05 },
    );
    targets.forEach((t) => obs.observe(t));
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      setTyping(/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && (el as HTMLInputElement).type !== 'checkbox' && (el as HTMLInputElement).type !== 'radio');
    };
    const onFocusOut = () => setTyping(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      obs.disconnect();
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const hidden = hiddenBySection || typing || !!inquiry || !!productId || !!lightbox;

  return (
    <div className={`mobile-bar${hidden ? ' is-hidden' : ''}`} aria-hidden={hidden}>
      <button type="button" className="btn btn--ghost" tabIndex={hidden ? -1 : 0} onClick={() => goTo('projekt')}>
        Moj izbor{total > 0 ? ` (${total})` : ''}
      </button>
      <button type="button" className="btn btn--primary" tabIndex={hidden ? -1 : 0} onClick={() => openInquiry('project')}>
        Zatraži ponudu
      </button>
    </div>
  );
}
