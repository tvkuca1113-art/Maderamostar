/**
 * Stanja 3D prikaza. Fotografija i naziv proizvoda su uvijek osnovni prikaz;
 * 3D zamjenjuje fotografiju tek kada renderer potvrdi stvarno nacrtan kadar.
 *
 *  photo   → korisnik gleda fotografiju (3D nije pokrenut)
 *  loading → 3D se učitava; fotografija je i dalje vidljiva kao poster
 *  ready   → prvi kadar s vratima je nacrtan; kontrole su aktivne
 *  error   → 3D nije uspio; prikazuje se fotografija i poruka, ponovni pokušaj samo na akciju korisnika
 *
 * Svaka aktivacija i promjena proizvoda dobija novi identitet sesije (`session`), pa zakašnjeli
 * signal stare sesije ne može označiti novi model spremnim.
 */

export type ViewerStatus = 'photo' | 'loading' | 'ready' | 'error';
export type ViewerErrorReason = 'webgl' | 'render' | 'import' | 'context-lost' | 'timeout';

export interface ViewerState {
  status: ViewerStatus;
  session: number;
  productKey: string;
  /** Milisekunde aktivnog učitavanja (ne broji se dok je tab skriven ili viewer van ekrana). */
  loadingMs: number;
  reason: ViewerErrorReason | null;
}

export type ViewerEvent =
  | { type: 'activate' }
  | { type: 'showPhoto' }
  | { type: 'product'; productKey: string }
  | { type: 'firstFrame'; session: number }
  | { type: 'fail'; session: number; reason: ViewerErrorReason }
  | { type: 'tick'; ms: number; counting: boolean }
  | { type: 'retry' };

export const LOAD_TIMEOUT_MS = 10_000;

export function initialViewerState(productKey: string, webgl2: boolean, autostart: boolean): ViewerState {
  if (!webgl2) return { status: 'error', session: 0, productKey, loadingMs: 0, reason: 'webgl' };
  return { status: autostart ? 'loading' : 'photo', session: autostart ? 1 : 0, productKey, loadingMs: 0, reason: null };
}

function startLoading(s: ViewerState, productKey = s.productKey): ViewerState {
  return { status: 'loading', session: s.session + 1, productKey, loadingMs: 0, reason: null };
}

export function viewerReducer(s: ViewerState, e: ViewerEvent): ViewerState {
  switch (e.type) {
    case 'activate':
      // Nakon greške 3D se ponovo pokreće samo izričitim „Pokušaj ponovo” (retry).
      if (s.status !== 'photo') return s;
      return startLoading(s);
    case 'retry':
      if (s.reason === 'webgl') return s;
      return startLoading(s);
    case 'showPhoto':
      if (s.reason === 'webgl') return s;
      return { ...s, status: 'photo', reason: null, loadingMs: 0 };
    case 'product':
      if (e.productKey === s.productKey) return s;
      // Novi model: spremnost se resetuje; ako je 3D bio aktivan, učitava se nova sesija.
      if (s.status === 'loading' || s.status === 'ready') return startLoading(s, e.productKey);
      return { ...s, productKey: e.productKey };
    case 'firstFrame':
      if (e.session !== s.session || s.status !== 'loading') return s;
      return { ...s, status: 'ready', loadingMs: 0 };
    case 'fail':
      if (e.session !== s.session || (s.status !== 'loading' && s.status !== 'ready')) return s;
      return { ...s, status: 'error', reason: e.reason, loadingMs: 0 };
    case 'tick': {
      if (s.status !== 'loading' || !e.counting) return s;
      const loadingMs = s.loadingMs + e.ms;
      if (loadingMs >= LOAD_TIMEOUT_MS) return { ...s, status: 'error', reason: 'timeout', loadingMs: 0 };
      return { ...s, loadingMs };
    }
    default:
      return s;
  }
}

/** WebGLRenderer u Three.js r163+ zahtijeva WebGL 2. Probni kontekst se odmah oslobađa. */
export function hasWebGL2(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
