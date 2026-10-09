import { describe, expect, it } from 'vitest';
import { initialViewerState, LOAD_TIMEOUT_MS, viewerReducer, type ViewerEvent, type ViewerState } from '../src/three/viewerState';

const run = (s: ViewerState, ...events: ViewerEvent[]) => events.reduce(viewerReducer, s);

describe('Stanja 3D prikaza', () => {
  it('bez WebGL 2 ostaje fotografija s porukom i bez ponovnog pokušaja', () => {
    const s = initialViewerState('hrast', false, true);
    expect(s).toMatchObject({ status: 'error', reason: 'webgl' });
    expect(run(s, { type: 'activate' }, { type: 'retry' }).status).toBe('error');
  });

  it('telefon počinje fotografijom; 3D tek na zahtjev, spreman tek nakon prvog kadra', () => {
    let s = initialViewerState('hrast', true, false);
    expect(s.status).toBe('photo');
    s = run(s, { type: 'activate' });
    expect(s.status).toBe('loading');
    s = run(s, { type: 'firstFrame', session: s.session });
    expect(s.status).toBe('ready');
  });

  it('zakašnjeli signal stare sesije ne označava novi model spremnim', () => {
    let s = run(initialViewerState('hrast', true, false), { type: 'activate' });
    const old = s.session;
    s = run(s, { type: 'product', productKey: 'sara' });
    expect(s.status).toBe('loading');
    expect(s.session).not.toBe(old);
    expect(run(s, { type: 'firstFrame', session: old }).status).toBe('loading');
    expect(run(s, { type: 'fail', session: old, reason: 'render' }).status).toBe('loading');
    expect(run(s, { type: 'firstFrame', session: s.session }).status).toBe('ready');
  });

  it('promjena modela iz spremnog stanja resetuje spremnost', () => {
    let s = run(initialViewerState('hrast', true, true), { type: 'firstFrame', session: 1 });
    expect(s.status).toBe('ready');
    s = run(s, { type: 'product', productKey: 'patras' });
    expect(s.status).toBe('loading');
  });

  it('vremensko ograničenje broji samo aktivno učitavanje', () => {
    let s = run(initialViewerState('hrast', true, false), { type: 'activate' });
    for (let t = 0; t < LOAD_TIMEOUT_MS * 2; t += 250) s = run(s, { type: 'tick', ms: 250, counting: false });
    expect(s.status).toBe('loading');
    for (let t = 0; t < LOAD_TIMEOUT_MS; t += 250) s = run(s, { type: 'tick', ms: 250, counting: true });
    expect(s).toMatchObject({ status: 'error', reason: 'timeout' });
  });

  it('gubitak konteksta vraća fotografiju; ponovni pokušaj samo na akciju i s novom sesijom', () => {
    let s = run(initialViewerState('hrast', true, true), { type: 'firstFrame', session: 1 });
    s = run(s, { type: 'fail', session: s.session, reason: 'context-lost' });
    expect(s).toMatchObject({ status: 'error', reason: 'context-lost' });
    // Nema automatskog ponavljanja: ni tick ni nova promjena izbora (activate) ne pokreću 3D.
    expect(run(s, { type: 'tick', ms: 250, counting: true })).toEqual(s);
    expect(run(s, { type: 'activate' })).toEqual(s);
    const retried = run(s, { type: 'retry' });
    expect(retried.status).toBe('loading');
    expect(retried.session).toBe(s.session + 1);
  });

  it('photo → 3D → photo → 3D otvara novu sesiju svaki put', () => {
    let s = run(initialViewerState('hrast', true, false), { type: 'activate' }, { type: 'firstFrame', session: 1 }, { type: 'showPhoto' });
    expect(s.status).toBe('photo');
    s = run(s, { type: 'activate' });
    expect(s).toMatchObject({ status: 'loading', session: 2 });
  });
});
