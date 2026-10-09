import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { buildDoor, type DoorSpec, type TextureKit } from './doorBuilder';
import { specKey } from './specs';

export type ViewName = 'front' | 'handle' | 'angle' | 'back';

export interface ViewerApi {
  reset(): void;
  zoom(direction: 1 | -1): void;
  view(name: ViewName): void;
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
const FOV = 36;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Učitava PBR teksture (hrast iz originalne Maderine fotografije, pod, žbuka). */
function useTextureKit(): TextureKit {
  const t = useTexture({
    oakMap: '/textures/oak-h-color.jpg',
    oakNormal: '/textures/oak-h-normal.jpg',
    oakRough: '/textures/oak-h-rough.jpg',
    floorMap: '/textures/floor-color.jpg',
    floorNormal: '/textures/floor-normal.jpg',
    floorRough: '/textures/floor-rough.jpg',
    plaster: '/textures/plaster-normal.jpg',
  });
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    t.oakMap.colorSpace = THREE.SRGBColorSpace;
    t.floorMap.colorSpace = THREE.SRGBColorSpace;
    Object.values(t).forEach((tex) => {
      tex.anisotropy = aniso;
    });
    return {
      oak: { map: t.oakMap, normalMap: t.oakNormal, roughnessMap: t.oakRough },
      floor: { map: t.floorMap, normalMap: t.floorNormal, roughnessMap: t.floorRough },
      plaster: t.plaster,
    };
  }, [t, gl]);
}

function ProceduralDoor({
  spec,
  open,
  reducedMotion,
  doorRef,
}: {
  spec: DoorSpec;
  open: boolean;
  reducedMotion: boolean;
  doorRef: React.MutableRefObject<THREE.Object3D | null>;
}) {
  const kit = useTextureKit();
  const key = specKey(spec);
  const door = useMemo(() => buildDoor(spec, kit), [key, kit]); // eslint-disable-line react-hooks/exhaustive-deps
  const progress = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    door.setOpen(easeInOut(progress.current));
    doorRef.current = door.root;
    invalidate();
    return () => door.dispose();
  }, [door, doorRef, invalidate]);

  useEffect(() => {
    invalidate();
  }, [open, invalidate]);

  useFrame((_, dt) => {
    const target = open ? 1 : 0;
    if (progress.current === target) return;
    if (reducedMotion) progress.current = target;
    else {
      // Vremenski zasnovano (ne po broju kadrova), pa i sporiji uređaji završe pokret za ≈ 1,3 s.
      const step = Math.min(dt, 0.25) / 1.3;
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

/** Polovina širine i visina scene koja mora stati u kadar (m), prema dimenzijama krila. */
function extents(spec: DoorSpec) {
  const h = spec.leafHeight + 0.2;
  if (spec.kind === 'sliding') return { halfW: 2 * spec.leafWidth + 0.15, height: h + 0.1 };
  if (spec.kind === 'double') return { halfW: spec.leafWidth + 0.2, height: h };
  return { halfW: spec.leafWidth / 2 + 0.22, height: h };
}

/** Udaljenost kamere pri kojoj cijela vrata (s okvirom) staju u kadar za trenutni omjer platna. */
export function fitDistance(spec: DoorSpec, aspect: number): number {
  const { halfW, height } = extents(spec);
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const byHeight = (height / 2 + 0.12) / tanV;
  const byWidth = halfW / (tanV * Math.max(aspect, 0.2));
  return Math.max(byHeight, byWidth) * 1.05;
}

function CameraRig({
  spec,
  apiRef,
  doorRef,
  reducedMotion,
}: {
  spec: DoorSpec;
  apiRef: React.MutableRefObject<ViewerApi | null>;
  doorRef: React.MutableRefObject<THREE.Object3D | null>;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const tween = useRef<{ fromP: THREE.Vector3; toP: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; start: number } | null>(null);
  const centerY = spec.leafHeight / 2 + 0.08;
  const sizeKey = `${spec.kind}-${spec.leafWidth}-${spec.leafHeight}`;

  // Kadriranje se ponavlja pri promjeni veličine, orijentacije, vrste i mjera vrata.
  useEffect(() => {
    if (!controls || size.width === 0 || size.height === 0) return;
    const distance = fitDistance(spec, size.width / size.height);
    camera.position.set(Math.sin(AZIMUTH) * distance, CAM_HEIGHT, Math.cos(AZIMUTH) * distance);
    controls.target.set(0, centerY, 0);
    controls.minDistance = 0.45;
    controls.maxDistance = distance * 1.4;
    controls.update();
    controls.saveState();
    tween.current = null;
    // Vodoravno povlačenje okreće pogled, a uspravno skrolanje stranice ostaje prirodno.
    gl.domElement.style.touchAction = 'pan-y';
    invalidate();
  }, [camera, controls, gl, sizeKey, size.width, size.height, invalidate]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const tw = tween.current;
    if (!tw || !controls) return;
    const t = Math.min(1, (performance.now() - tw.start) / 900);
    const k = easeInOut(t);
    camera.position.lerpVectors(tw.fromP, tw.toP, k);
    controls.target.lerpVectors(tw.fromT, tw.toT, k);
    controls.update();
    if (t >= 1) tween.current = null;
    invalidate();
  });

  useEffect(() => {
    const go = (toP: THREE.Vector3, toT: THREE.Vector3) => {
      if (!controls) return;
      if (reducedMotion) {
        camera.position.copy(toP);
        controls.target.copy(toT);
        controls.update();
        invalidate();
        return;
      }
      tween.current = { fromP: camera.position.clone(), toP, fromT: controls.target.clone(), toT, start: performance.now() };
      invalidate();
    };
    const dist = () => fitDistance(spec, size.width / Math.max(1, size.height));
    apiRef.current = {
      reset() {
        const d = dist();
        go(new THREE.Vector3(Math.sin(AZIMUTH) * d, CAM_HEIGHT, Math.cos(AZIMUTH) * d), new THREE.Vector3(0, centerY, 0));
      },
      zoom(direction) {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        const len = THREE.MathUtils.clamp(offset.length() * (direction > 0 ? 0.82 : 1 / 0.82), controls.minDistance, controls.maxDistance);
        offset.setLength(len);
        go(controls.target.clone().add(offset), controls.target.clone());
      },
      view(name) {
        const d = dist();
        if (name === 'front') return go(new THREE.Vector3(0, CAM_HEIGHT, d), new THREE.Vector3(0, centerY, 0));
        if (name === 'angle') return go(new THREE.Vector3(Math.sin(0.85) * d * 0.9, 1.55, Math.cos(0.85) * d * 0.9), new THREE.Vector3(0, centerY, 0));
        if (name === 'back') return go(new THREE.Vector3(-Math.sin(0.35) * d, CAM_HEIGHT, -Math.cos(0.35) * d), new THREE.Vector3(0, centerY, 0));
        // Detalj kvake: kamera ispred i malo sa strane kvake.
        const root = doorRef.current;
        const handle = root?.getObjectByName('kvaka-0') ?? root?.getObjectByName('kvaka-1') ?? root?.getObjectByName('prihvat-0');
        const p = new THREE.Vector3(0, 1.05, 0.05);
        if (handle) handle.getWorldPosition(p);
        const side = p.x >= 0 ? 1 : -1;
        go(new THREE.Vector3(p.x + side * 0.22, p.y + 0.12, p.z + 0.62), p);
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, controls, invalidate, spec, size.width, size.height, centerY, doorRef, reducedMotion]);
  return null;
}

/**
 * Kosa sunčeva svjetlost kroz prozor s krošnjom (gobo maska), kao na početnoj fotografiji:
 * topli trapez svjetla i sjene lišća padaju na zid i vrata, okvir baca stvarnu sjenu.
 */
function Sunlight({ low }: { low: boolean }) {
  const gobo = useTexture('/textures/gobo-window.jpg');
  const light = useRef<THREE.SpotLight>(null);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(0.45, 1.25, 0);
    scene.add(l.target);
    l.target.updateMatrixWorld();
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);
  return (
    <spotLight
      ref={light}
      position={[-3.4, 3.3, 3.1]}
      angle={0.46}
      penumbra={0.5}
      decay={0}
      intensity={5.2}
      color="#fff0de"
      map={gobo}
      castShadow
      shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.025}
      shadow-camera-near={1.5}
      shadow-camera-far={12}
    />
  );
}

/**
 * Javlja prvi stvarno nacrtan kadar s vratima za tačno ovu sesiju.
 * Bez postprocesinga preuzima i crtanje (prioritet 1); s njim crta EffectComposer (prioritet 1),
 * a provjera ide poslije (prioritet 2).
 */
function FrameConfirm({ session, onFirstFrame, selfRender }: { session: number; onFirstFrame: (session: number) => void; selfRender: boolean }) {
  const confirmed = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [session, invalidate]);
  useFrame(
    ({ gl, scene, camera }) => {
      if (selfRender) gl.render(scene, camera);
      if (confirmed.current === session) return;
      let hasDoor = false;
      scene.traverse((o) => {
        if (o.userData.maderaDoor && o.visible) hasDoor = true;
      });
      if (hasDoor && !gl.getContext().isContextLost() && gl.info.render.calls > 0) {
        confirmed.current = session;
        onFirstFrame(session);
      } else {
        invalidate();
      }
    },
    selfRender ? 1 : 2,
  );
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
  const doorRef = useRef<THREE.Object3D | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const failRef = useRef(onFail);
  failRef.current = onFail;
  useImperativeHandle(ref, () => ({
    reset: () => apiRef.current?.reset(),
    zoom: (d) => apiRef.current?.zoom(d),
    view: (n) => apiRef.current?.view(n),
  }));
  const low = quality === 'low';
  const maxDpr = Math.min(low ? 1.5 : 1.75, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  return (
    <Canvas
      className="viewer__canvas"
      shadows="soft"
      frameloop={active ? 'demand' : 'never'}
      dpr={[1, maxDpr]}
      camera={{ fov: FOV, near: 0.05, far: 40, position: [0, CAM_HEIGHT, 5] }}
      gl={{ antialias: low, powerPreference: 'default', failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        // Khronos PBR Neutral: vjerne boje proizvoda (hrast, lak, metal) uz mekan prijelaz u svjetlima.
        // Na visokoj kvaliteti isto mapiranje radi ToneMapping efekt na kraju postprocesinga.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        // Izgubljen kontekst vraća fotografiju; ponovni pokušaj je na akciju korisnika.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          failRef.current(sessionRef.current, 'context-lost');
        });
      }}
    >
      <color attach="background" args={['#efe9e0']} />
      <fog attach="fog" args={['#efe9e0', 10, 26]} />
      {/* Mekano popunjavanje iz sobe; glavni ton daje sunce kroz prozor. */}
      <hemisphereLight args={['#fff6ea', '#cbb89f', 0.14]} />
      <directionalLight position={[3, 3.5, 4]} intensity={0.22} color="#eef2ff" />
      {/* Dnevno svjetlo u susjednoj prostoriji: pogled „druga strana” i otvor nisu u mraku. */}
      <directionalLight position={[1.5, 3.2, -4.5]} intensity={0.9} color="#fff4e6" />
      <Suspense fallback={null}>
        {/* HDR okruženje (CC0, Poly Haven „apartment”) daje realne odsjaje na laku, staklu i metalu. */}
        <Environment files="/hdri/apartment.exr" environmentIntensity={0.4} />
        <Sunlight low={low} />
        {glbPath ? (
          <GlbDoor key={resetKey} path={glbPath} open={open} reducedMotion={reducedMotion} />
        ) : (
          <ProceduralDoor key={resetKey} spec={spec} open={open} reducedMotion={reducedMotion} doorRef={doorRef} />
        )}
        <FrameConfirm session={session} onFirstFrame={onFirstFrame} selfRender={low} />
        {!low && (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={2.2} quality="medium" halfRes />
            <SMAA />
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          </EffectComposer>
        )}
      </Suspense>
      <ContactShadows position={[0, 0.002, 0.6]} scale={[6, 3]} opacity={0.42} blur={2.4} far={2.4} resolution={low ? 256 : 512} color="#4a3926" />
      <OrbitControls makeDefault enablePan={false} enableZoom={false} enableDamping={false} rotateSpeed={0.55} minPolarAngle={0.9} maxPolarAngle={1.68} />
      <CameraRig spec={spec} apiRef={apiRef} doorRef={doorRef} reducedMotion={reducedMotion} />
      <Wake active={active} />
    </Canvas>
  );
});

export default DoorViewer;
