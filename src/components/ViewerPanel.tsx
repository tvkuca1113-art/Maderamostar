import { Component, lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { assetFor } from '../data';
import { useMediaQuery } from '../lib/useMediaQuery';
import { prefersReducedMotion, useUi } from '../state/ui';
import { specFor } from '../three/specs';
import type { ViewerApi } from '../three/DoorViewer';
import { hasWebGL2, initialViewerState, viewerReducer, type ViewerErrorReason } from '../three/viewerState';
import type { DoorConfig, Product } from '../types';
import { ProductPicture } from './Picture';

const DoorViewer = lazy(() => import('../three/DoorViewer'));

class ViewerBoundary extends Component<{ onError: (reason: ViewerErrorReason) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    this.props.onError(/import|module|chunk|fetch/i.test(msg) ? 'import' : 'render');
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Slabiji uređaji dobijaju niži DPR, bez mape sjena i s manjim pomoćnim teksturama. */
function detectQuality(): 'high' | 'low' {
  if (typeof window === 'undefined') return 'low';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return coarse || weak ? 'low' : 'high';
}

const AUTOSTART_QUERY = '(min-width: 1024px) and (pointer: fine)';

export function ViewerPanel({ product, cfg }: { product: Product; cfg: DoorConfig }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)') || prefersReducedMotion();
  const { openLightbox } = useUi();
  const spec = specFor(product, cfg);
  const has3d = spec !== null || !!product.viewer.exactGlbPath;
  const [state, dispatch] = useReducer(viewerReducer, undefined, () =>
    initialViewerState(product.id, hasWebGL2(), has3d && !!window.matchMedia?.(AUTOSTART_QUERY).matches),
  );
  const [quality] = useState(detectQuality);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  // Otvorenost važi samo za model za koji je zatražena; novi model uvijek počinje zatvoren.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === product.id;
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerApi>(null);

  const { status, session, reason } = state;
  const webglMissing = reason === 'webgl';
  const canvasOn = (status === 'loading' || status === 'ready') && near && has3d;
  const ready = status === 'ready';

  useEffect(() => {
    dispatch({ type: 'product', productKey: product.id });
  }, [product.id]);

  // 3D se priprema tek kad je sekcija blizu ekrana; van ekrana se render pauzira.
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

  // Vremensko ograničenje računa samo aktivno učitavanje: tab vidljiv i viewer na ekranu.
  useEffect(() => {
    if (status !== 'loading') return;
    const id = window.setInterval(() => {
      dispatch({ type: 'tick', ms: 250, counting: visible && near && !document.hidden });
    }, 250);
    return () => window.clearInterval(id);
  }, [status, visible, near]);

  const onFirstFrame = useCallback((s: number) => dispatch({ type: 'firstFrame', session: s }), []);
  const onFail = useCallback((s: number, r: ViewerErrorReason) => dispatch({ type: 'fail', session: s, reason: r }), []);

  const meta = assetFor(product.image);
  const wishChanged = cfg.finish !== 'kao-na-fotografiji' || cfg.handle !== 'kao-na-fotografiji';

  const note = ready
    ? 'Ilustrativni 3D prikaz. Konačna izvedba prema potvrđenoj specifikaciji. Povucite vodoravno za okretanje.'
    : status === 'error'
      ? null
      : wishChanged
        ? 'Originalna fotografija izvedbe. Odabrana boja i kvaka su želje za ponudu i nisu prikazane na fotografiji.'
        : 'Originalna fotografija izvedbe iz objave na Maderinom profilu.';

  return (
    <div className="viewer" ref={rootRef} data-status={status}>
      <div className="viewer__toolbar">
        <div className="segmented" role="group" aria-label="Način prikaza">
          <button
            type="button"
            aria-pressed={status === 'photo' || status === 'error'}
            className={status === 'photo' || status === 'error' ? 'is-active' : ''}
            onClick={() => dispatch({ type: 'showPhoto' })}
          >
            Fotografija
          </button>
          <button
            type="button"
            aria-pressed={status === 'loading' || status === 'ready'}
            className={status === 'loading' || status === 'ready' ? 'is-active' : ''}
            disabled={webglMissing || !has3d}
            onClick={() => dispatch({ type: status === 'error' ? 'retry' : 'activate' })}
          >
            3D prikaz
          </button>
        </div>
        <span className="viewer__name">{product.displayName}</span>
      </div>

      <div className="viewer__stage">
        {/* Fotografija je osnovni prikaz i ostaje vidljiva dok 3D ne potvrdi nacrtan kadar. */}
        {!ready && (
          <button
            type="button"
            className="viewer__photo-button"
            aria-label={`Uvećaj fotografiju: ${product.displayName}`}
            onClick={() => openLightbox({ src: product.image, alt: product.imageAlt, caption: product.displayName, width: meta?.width, height: meta?.height })}
          >
            <ProductPicture src={product.image} alt={product.imageAlt} sizes="(max-width: 767px) 92vw, 640px" className="viewer__photo" />
          </button>
        )}
        {canvasOn && spec && (
          <div className={`viewer__canvas-wrap${ready ? ' is-ready' : ''}`} aria-hidden={!ready}>
            <ViewerBoundary key={session} onError={(r) => onFail(session, r)}>
              <Suspense fallback={null}>
                <DoorViewer
                  ref={apiRef}
                  spec={spec}
                  glbPath={product.viewer.exactGlbPath}
                  open={open}
                  reducedMotion={reducedMotion}
                  active={visible}
                  resetKey={product.id}
                  session={session}
                  quality={quality}
                  onFirstFrame={onFirstFrame}
                  onFail={onFail}
                />
              </Suspense>
            </ViewerBoundary>
          </div>
        )}
        {status === 'loading' && (
          <p className="viewer__loading" role="status">
            Učitavanje 3D prikaza…
          </p>
        )}
        {status === 'photo' && has3d && (
          <button type="button" className="btn btn--dark btn--sm viewer__explore" onClick={() => dispatch({ type: 'activate' })}>
            Istraži u 3D
          </button>
        )}
        {status === 'error' && (
          <div className="viewer__error" role="status">
            <p>3D trenutno nije dostupan. Nastavite s odabirom na fotografiji.</p>
            {!webglMissing && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'retry' })}>
                Pokušaj ponovo
              </button>
            )}
          </div>
        )}
      </div>

      {ready && (
        <div className="viewer__controls" role="group" aria-label="Upravljanje 3D prikazom">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpenFor(product.id)} disabled={open}>
            Otvori vrata
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpenFor(null)} disabled={!open}>
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
      )}

      {note && <p className="viewer__note">{note}</p>}
    </div>
  );
}
