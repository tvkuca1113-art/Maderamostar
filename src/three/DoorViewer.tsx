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
  onReady?: () => void;
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
  return <primitive object={scene} />;
}

function CameraRig({ distance, apiRef }: { distance: number; apiRef: React.MutableRefObject<ViewerApi | null> }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!controls) return;
    const target = new THREE.Vector3(0, 1.05, 0);
    camera.position.set(Math.sin(AZIMUTH) * distance, CAM_HEIGHT, Math.cos(AZIMUTH) * distance);
    controls.target.copy(target);
    controls.minDistance = distance * 0.55;
    controls.maxDistance = distance * 1.25;
    controls.update();
    controls.saveState();
    invalidate();
  }, [camera, controls, distance, invalidate]);

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
  }, [apiRef, camera, controls, invalidate]);
  return null;
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

const DoorViewer = forwardRef<ViewerApi, Props>(function DoorViewer({ spec, glbPath, open, reducedMotion, active, resetKey, onReady }, ref) {
  const apiRef = useRef<ViewerApi | null>(null);
  useImperativeHandle(ref, () => ({
    reset: () => apiRef.current?.reset(),
    zoom: (d) => apiRef.current?.zoom(d),
  }));
  const distance = spec.kind === 'sliding' ? 6.2 : spec.kind === 'double' ? 5.1 : 4.3;

  return (
    <Canvas
      className="viewer__canvas"
      shadows
      frameloop={active ? 'demand' : 'never'}
      dpr={[1, Math.min(1.75, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)]}
      camera={{ fov: 36, near: 0.1, far: 40, position: [Math.sin(AZIMUTH) * distance, CAM_HEIGHT, Math.cos(AZIMUTH) * distance] }}
      gl={{ antialias: true, powerPreference: 'default' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <color attach="background" args={['#f2ede5']} />
      <fog attach="fog" args={['#f2ede5', 9, 22]} />
      <hemisphereLight args={['#fffaf2', '#e3d8c8', 1.25]} />
      <directionalLight
        position={[-3, 4.5, 4]}
        intensity={2.1}
        color="#fff1dc"
        castShadow
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
      <Environment resolution={128} frames={1}>
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
        <ReadySignal onReady={onReady} />
      </Suspense>
      <ContactShadows position={[0, 0.002, 0.6]} scale={[6, 3]} opacity={0.32} blur={2.4} far={2.4} resolution={512} color="#5b4630" />
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
      <CameraRig distance={distance} apiRef={apiRef} />
    </Canvas>
  );
});

export default DoorViewer;
