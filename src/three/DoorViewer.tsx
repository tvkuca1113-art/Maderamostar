import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { buildDoor, type DoorSpec } from './doorBuilder';
import { specKey } from './specs';

export interface ViewerApi {
  reset(): void;
  zoom(direction: 1 | -1): void;
}

interface Props {
  spec: DoorSpec;
  /** Putanja do potvrđenog GLB modela (products.json → viewer.exactGlbPath). Sada je null. */
  glbPath?: string | null;
  open: boolean;
  reducedMotion: boolean;
  active: boolean;
  /** Promjena (npr. drugi model) postavlja nova vrata u zatvoren položaj bez animacije. */
  resetKey?: string;
  /** Identitet sesije prikaza; potvrda kadra važi samo za trenutnu sesiju. */
  session: number;
  quality: 'high' | 'low';
  onFirstFrame: (session: number) => void;
  onFail: (session: number, reason: 'context-lost' | 'render') => void;
}

const AZIMUTH = 0.32;
const CAM_HEIGHT = 1.32;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function ProceduralDoor({ spec, open, reducedMotion }: { spec: DoorSpec; open: boolean; reducedMotion: boolean }) {
  const key = specKey(spec);
  const door = useMemo(() => buildDoor(spec), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const progress = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    door.setOpen(easeInOut(progress.current));
    invalidate();
    return () => door.dispose();
  }, [door, invalidate]);

  useEffect(() => {
    invalidate();
  }, [open, invalidate]);

  useFrame((_, dt) => {
    const target = open ? 1 : 0;
    if (progress.current === target) return;
    if (reducedMotion) progress.current = target;
    else {
      const step = Math.min(dt, 0.05) / 1.3; // ≈ 1,3 s za puni pokret
      progress.current = target > progress.current ? Math.min(target, progress.current + step) : Math.max(target, progress.current - step);
    }
    door.setOpen(easeInOut(progress.current));
    invalidate();
  });

  door.root.userData.maderaDoor = true;
  return <primitive object={door.root} />;
}

/** Potvrđeni GLB model: čvorovi čije ime počinje s „pivot” rotiraju se oko vlastite ose. */
function GlbDoor({ path, open, reducedMotion }: { path: string; open: boolean; reducedMotion: boolean }) {
  const { scene } = useGLTF(path);
  const pivots = useMemo(() => {
    const out: THREE.Object3D[] = [];
    scene.traverse((o) => o.name.toLowerCase().startsWith('pivot') && out.push(o));
    return out;
  }, [scene]);
  const progress = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [open, invalidate]);
  useFrame((_, dt) => {
    const target = open ? 1 : 0;
    if (progress.current === target) return;
    progress.current = reducedMotion ? target : THREE.MathUtils.clamp(progress.current + Math.sign(target - progress.current) * (dt / 1.3), 0, 1);
    pivots.forEach((p) => {
      const max = typeof p.userData.maxAngle === 'number' ? p.userData.maxAngle : THREE.MathUtils.degToRad(75);
      p.rotation.y = max * easeInOut(progress.current);
    });
    invalidate();
  });
  scene.userData.maderaDoor = true;
  return <primitive object={scene} />;
}

/** Polovina širine i visina scene koja mora stati u kadar (m), po vrsti vrata. */
function extents(kind: DoorSpec['kind']) {
  if (kind === 'sliding') return { halfW: 1.45, height: 2.25 };
  if (kind === 'double') return { halfW: 0.85, height: 2.2 };
  return { halfW: 0.62, height: 2.2 };
}

const FOV = 36;

/** Udaljenost kamere pri kojoj cijela vrata (s okvirom) staju u kadar za trenutni omjer platna. */
export function fitDistance(kind: DoorSpec['kind'], aspect: number): number {
  const { halfW, height } = extents(kind);
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const byHeight = (height / 2 + 0.12) / tanV;
  const byWidth = halfW / (tanV * Math.max(aspect, 0.2));
  return Math.max(byHeight, byWidth) * 1.05;
}

function CameraRig({ kind, apiRef }: { kind: DoorSpec['kind']; apiRef: React.MutableRefObject<ViewerApi | null> }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);

  // Kadriranje se ponavlja pri promjeni veličine, orijentacije i vrste vrata.
  useEffect(() => {
    if (!controls || size.width === 0 || size.height === 0) return;
    const distance = fitDistance(kind, size.width / size.height);
    const target = new THREE.Vector3(0, 1.08, 0);
    camera.position.set(Math.sin(AZIMUTH) * distance, CAM_HEIGHT, Math.cos(AZIMUTH) * distance);
    controls.target.copy(target);
    controls.minDistance = distance * 0.6;
    controls.maxDistance = distance * 1.3;
    controls.update();
    controls.saveState();
    // Vodoravno povlačenje okreće pogled, a uspravno skrolanje stranice ostaje prirodno.
    gl.domElement.style.touchAction = 'pan-y';
    invalidate();
  }, [camera, controls, gl, kind, size.width, size.height, invalidate]);

  useEffect(() => {
    apiRef.current = {
      reset() {
        controls?.reset();
        invalidate();
      },
      zoom(direction) {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        const len = THREE.MathUtils.clamp(offset.length() * (direction > 0 ? 0.85 : 1 / 0.85), controls.minDistance, controls.maxDistance);
        offset.setLength(len);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, controls, invalidate]);
  return null;
}

/**
 * Preuzima crtanje (prioritet 1) i javlja prvi stvarno nacrtan kadar s vratima za tačno ovu sesiju.
 * Montiranje komponente nije dokaz vidljivog proizvoda; dokaz je završen render bez izgubljenog konteksta.
 */
function FrameConfirm({ session, onFirstFrame }: { session: number; onFirstFrame: (session: number) => void }) {
  const confirmed = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [session, invalidate]);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    if (confirmed.current === session) return;
    let hasDoor = false;
    scene.traverse((o) => {
      if (o.userData.maderaDoor && o.visible) hasDoor = true;
    });
    if (hasDoor && !gl.getContext().isContextLost() && gl.info.render.triangles > 0) {
      confirmed.current = session;
      onFirstFrame(session);
    } else {
      invalidate();
    }
  }, 1);
  return null;
}

/** Traži novi kadar kad viewer ponovo postane vidljiv ili kad se tab vrati iz pozadine. */
function Wake({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  useEffect(() => {
    const onVis = () => !document.hidden && invalidate();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onVis);
    };
  }, [invalidate]);
  return null;
}

const DoorViewer = forwardRef<ViewerApi, Props>(function DoorViewer(
  { spec, glbPath, open, reducedMotion, active, resetKey, session, quality, onFirstFrame, onFail },
  ref,
) {
  const apiRef = useRef<ViewerApi | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const failRef = useRef(onFail);
  failRef.current = onFail;
  useImperativeHandle(ref, () => ({
    reset: () => apiRef.current?.reset(),
    zoom: (d) => apiRef.current?.zoom(d),
  }));
  const low = quality === 'low';
  const maxDpr = Math.min(low ? 1.25 : 1.75, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  return (
    <Canvas
      className="viewer__canvas"
      shadows={!low}
      frameloop={active ? 'demand' : 'never'}
      dpr={[1, maxDpr]}
      camera={{ fov: FOV, near: 0.1, far: 40, position: [0, CAM_HEIGHT, 5] }}
      gl={{ antialias: true, powerPreference: 'default', failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        // Izgubljen kontekst vraća fotografiju; ponovni pokušaj je na akciju korisnika.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          failRef.current(sessionRef.current, 'context-lost');
        });
      }}
    >
      <color attach="background" args={['#f2ede5']} />
      <fog attach="fog" args={['#f2ede5', 9, 22]} />
      <hemisphereLight args={['#fffaf2', '#e3d8c8', 1.25]} />
      <directionalLight
        position={[-3, 4.5, 4]}
        intensity={2.1}
        color="#fff1dc"
        castShadow={!low}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
        shadow-camera-near={1}
        shadow-camera-far={14}
      />
      <directionalLight position={[2.5, 2.2, 3]} intensity={0.55} color="#ffffff" />
      <directionalLight position={[3, 2, -3]} intensity={0.6} color="#ffffff" />
      <Environment resolution={low ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={1.2} position={[0, 4, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffe9cf" position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.4} position={[5, 2, -1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Suspense fallback={null}>
        {glbPath ? (
          <GlbDoor key={resetKey} path={glbPath} open={open} reducedMotion={reducedMotion} />
        ) : (
          <ProceduralDoor key={resetKey} spec={spec} open={open} reducedMotion={reducedMotion} />
        )}
        <FrameConfirm session={session} onFirstFrame={onFirstFrame} />
      </Suspense>
      <ContactShadows position={[0, 0.002, 0.6]} scale={[6, 3]} opacity={0.32} blur={2.4} far={2.4} resolution={low ? 256 : 512} color="#5b4630" />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping={false}
        rotateSpeed={0.55}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        minPolarAngle={1.05}
        maxPolarAngle={1.68}
      />
      <CameraRig kind={spec.kind} apiRef={apiRef} />
      <Wake active={active} />
    </Canvas>
  );
});

export default DoorViewer;
