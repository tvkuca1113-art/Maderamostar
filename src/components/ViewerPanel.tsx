import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { assetFor } from '../data';
import { MOBILE_QUERY, useMediaQuery } from '../lib/useMediaQuery';
import { prefersReducedMotion, useUi } from '../state/ui';
import { specFor } from '../three/specs';
import type { ViewerApi } from '../three/DoorViewer';
import type { DoorConfig, Product } from '../types';
import { ProductPicture } from './Picture';

const DoorViewer = lazy(() => import('../three/DoorViewer'));

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class ViewerBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Mode = 'photo' | '3d';

export function ViewerPanel({ product, cfg }: { product: Product; cfg: DoorConfig }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)') || prefersReducedMotion();
  const { openLightbox } = useUi();
  const [webgl] = useState(() => hasWebGL());
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>(() => (mobile || !webgl ? 'photo' : '3d'));
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  // Otvorenost važi samo za model za koji je zatražena; novi model uvijek počinje zatvoren.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === product.id;
  const setOpen = (v: boolean) => setOpenFor(v ? product.id : null);
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerApi>(null);
  const spec = specFor(product, cfg);
  const available = webgl && !failed && (spec !== null || !!product.viewer.exactGlbPath);
  const show3d = mode === '3d' && available;

  // 3D se učitava tek kad je sekcija blizu ekrana; van ekrana se render pauzira.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const nearObs = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '400px 0px' });
    const visObs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    nearObs.observe(el);
    visObs.observe(el);
    return () => {
      nearObs.disconnect();
      visObs.disconnect();
    };
  }, []);

  const meta = assetFor(product.image);
  const poster = (
    <ProductPicture src={product.image} alt={product.imageAlt} sizes="(max-width: 767px) 92vw, 640px" className="viewer__photo" />
  );

  return (
    <div className="viewer" ref={rootRef}>
      <div className="viewer__toolbar">
        <div className="segmented" role="group" aria-label="Način prikaza">
          <button type="button" aria-pressed={mode === 'photo'} className={mode === 'photo' ? 'is-active' : ''} onClick={() => setMode('photo')}>
            Fotografija
          </button>
          <button
            type="button"
            aria-pressed={show3d}
            className={show3d ? 'is-active' : ''}
            disabled={!available}
            onClick={() => setMode('3d')}
          >
            3D prikaz
          </button>
        </div>
        <span className="viewer__name">{product.displayName}</span>
      </div>

      <div className="viewer__stage">
        {show3d && near ? (
          <>
            {!ready && <div className="viewer__poster" aria-hidden="true">{poster}</div>}
            <ViewerBoundary onError={() => setFailed(true)}>
              <Suspense fallback={null}>
                <DoorViewer
                  ref={apiRef}
                  spec={spec!}
                  glbPath={product.viewer.exactGlbPath}
                  open={open}
                  reducedMotion={reducedMotion}
                  active={visible}
                  resetKey={product.id}
                  onReady={() => setReady(true)}
                />
              </Suspense>
            </ViewerBoundary>
            {!ready && <p className="viewer__loading">Učitavanje 3D prikaza…</p>}
          </>
        ) : (
          <button
            type="button"
            className="viewer__photo-button"
            aria-label={`Uvećaj fotografiju: ${product.displayName}`}
            onClick={() => openLightbox({ src: product.image, alt: product.imageAlt, caption: product.displayName, width: meta?.width, height: meta?.height })}
          >
            {poster}
          </button>
        )}
        {mode === 'photo' && available && (
          <button type="button" className="btn btn--dark btn--sm viewer__explore" onClick={() => setMode('3d')}>
            Istraži u 3D
          </button>
        )}
      </div>

      {show3d ? (
        <div className="viewer__controls" role="group" aria-label="Upravljanje 3D prikazom">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(true)} disabled={open}>
            Otvori vrata
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)} disabled={!open}>
            Zatvori vrata
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => apiRef.current?.reset()}>
            Vrati pogled
          </button>
          <span className="viewer__zoom">
            <button type="button" className="icon-btn" onClick={() => apiRef.current?.zoom(1)} aria-label="Približi">
              +
            </button>
            <button type="button" className="icon-btn" onClick={() => apiRef.current?.zoom(-1)} aria-label="Udalji">
              −
            </button>
          </span>
        </div>
      ) : null}

      <p className="viewer__note">
        {show3d
          ? 'Ilustrativni 3D prikaz. Konačna izvedba prema potvrđenoj specifikaciji. Povucite za okretanje pogleda.'
          : failed || !webgl
            ? '3D prikaz nije dostupan na ovom uređaju. Fotografija prikazuje stvarnu izvedbu; izbor i upit rade normalno.'
            : 'Originalna fotografija izvedbe iz objave na Maderinom profilu.'}
      </p>
    </div>
  );
}
