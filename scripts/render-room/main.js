/**
 * Soba iza vrata za početni ulaz: isti kameni pod, žbuka i sunce s krošnjom kao na početnoj fotografiji.
 * Render je „offline”: render.mjs traži više kadrova s pomaknutim suncem i podpikselnim pomakom kamere
 * i usrednjava ih (meke sjene + antialiasing), pa slika izgleda kao arhitektonska vizualizacija.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') || 2400);
const H = Number(q.get('h') || 1500);
const VFOV = Number(q.get('fov') || 46);
const CAM_Z = Number(q.get('z') || 4.8);
const CAM_Y = Number(q.get('y') || 1.5);
const CAM_X = Number(q.get('x') || 0);
// Pomak objektiva (shift) naniže: manje stropa, uspravne linije ostaju uspravne kao u arhitektonskoj fotografiji.
const SHIFT = Number(q.get('shift') || 0);

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f4efe6');
const camera = new THREE.PerspectiveCamera(VFOV, W / H, 0.05, 60);
camera.position.set(CAM_X, CAM_Y, CAM_Z);
camera.lookAt(CAM_X, CAM_Y, 0);

let seed = 3;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const loader = new THREE.TextureLoader();
async function tex(url, srgb, rx = 1, ry = 1) {
  const t = await loader.loadAsync(url);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Dimenzije sobe (m).
const RW = 2.6; // pola širine
const RD = 7.2;
const RH = 2.85;
const T = 0.25; // debljina zida s prozorom
const WX0 = -1.2;
const WX1 = 0.5;
const WY0 = 0.42;
const WY1 = 2.52;
const WMID = (WX0 + WX1) / 2;
const SUN = new THREE.Vector3(-4.4, 8.2, -5.4);

function box(x0, x1, y0, y1, z0, z1, mat, cast = true) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

async function build() {
  const [plaster, floorMap, floorNormal, floorRough, oakMap, oakNormal, oakRough, gobo] = await Promise.all([
    tex('/textures/plaster-normal.jpg', false, 3, 2),
    tex('/textures/floor-color.jpg', true, (2 * RW) / 1.2, RD / 1.2),
    tex('/textures/floor-normal.jpg', false, (2 * RW) / 1.2, RD / 1.2),
    tex('/textures/floor-rough.jpg', false, (2 * RW) / 1.2, RD / 1.2),
    tex('/textures/oak-h-color.jpg', true, 3, 1),
    tex('/textures/oak-h-normal.jpg', false, 3, 1),
    tex('/textures/oak-h-rough.jpg', false, 3, 1),
    tex('./gobo-leaves.jpg', false),
  ]);

  const exr = await new EXRLoader().loadAsync('/hdri/apartment.exr');
  exr.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(exr).texture;
  scene.environmentIntensity = 0.62;

  const wall = new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: 0.95, normalMap: plaster, normalScale: new THREE.Vector2(0.3, 0.3) });
  const ceiling = new THREE.MeshStandardMaterial({ color: '#f7f6f3', roughness: 0.95 });
  const skirting = new THREE.MeshStandardMaterial({ color: '#e6ddcf', roughness: 0.6 });
  const stone = new THREE.MeshStandardMaterial({ map: floorMap, normalMap: floorNormal, roughnessMap: floorRough, roughness: 0.75, envMapIntensity: 1.1 });
  const frame = new THREE.MeshStandardMaterial({ color: '#2d2c2a', roughness: 0.42, metalness: 0.35 });
  const sillMat = new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.5 });

  // Zid s prozorom (z = −T … 0) i bočni zidovi, strop i zid iza kamere — svjetlo ulazi samo kroz prozor.
  box(-RW - 0.1, WX0, 0, RH, -T, 0, wall);
  box(WX1, RW + 0.1, 0, RH, -T, 0, wall);
  box(WX0, WX1, 0, WY0, -T, 0, wall);
  box(WX0, WX1, WY1, RH, -T, 0, wall);
  box(-RW - 0.1, -RW, 0, RH, -T, RD, wall);
  box(RW, RW + 0.1, 0, RH, -T, RD, wall);
  box(-RW - 0.1, RW + 0.1, RH, RH + 0.1, -T - 0.1, RD, ceiling);
  box(-RW - 0.1, RW + 0.1, 0, RH, RD, RD + 0.1, wall);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * RW, RD), stone);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, RD / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // Sokl uz zidove.
  box(-RW, RW, 0, 0.08, 0, 0.012, skirting, false);
  box(-RW, -RW + 0.012, 0, 0.08, 0, RD, skirting, false);
  box(RW - 0.012, RW, 0, 0.08, 0, RD, skirting, false);

  // Prozor: tanki antracit profili, prečka i staklo s blagim odsjajem.
  const fz0 = -0.14;
  const fz1 = -0.07;
  const fw = 0.055;
  box(WX0, WX1, WY0, WY0 + fw, fz0, fz1, frame);
  box(WX0, WX1, WY1 - fw, WY1, fz0, fz1, frame);
  box(WX0, WX0 + fw, WY0, WY1, fz0, fz1, frame);
  box(WX1 - fw, WX1, WY0, WY1, fz0, fz1, frame);
  box(WMID - 0.025, WMID + 0.025, WY0, WY1, fz0, fz1, frame);
  box(WX0, WX1, 2.02, 2.06, fz0, fz1, frame);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.4 }),
  );
  glass.position.set(WMID, (WY0 + WY1) / 2, -0.105);
  scene.add(glass);
  // Unutrašnja klupčica prozora.
  box(WX0 - 0.04, WX1 + 0.04, WY0 - 0.03, WY0, -T, 0.035, sillMat);

  // Vani: presvijetlo nebo i zamućena krošnja (van fokusa), kao kad se gleda iz osvijetljene sobe.
  const sky = document.createElement('canvas');
  sky.width = 1024;
  sky.height = 640;
  const c = sky.getContext('2d');
  const grad = c.createLinearGradient(0, 0, 0, 640);
  grad.addColorStop(0, '#fbf8f1');
  grad.addColorStop(0.55, '#f6efe2');
  grad.addColorStop(1, '#efe4d0');
  c.fillStyle = grad;
  c.fillRect(0, 0, 1024, 640);
  c.filter = 'blur(16px)';
  c.globalAlpha = 0.32;
  c.fillStyle = '#a4ad93';
  for (let i = 0; i < 70; i++) {
    const x = 200 + rnd() * 480;
    const y = 40 + rnd() * 330;
    c.beginPath();
    c.ellipse(x, y, 30 + rnd() * 60, 20 + rnd() * 40, rnd() * 3, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 0.35;
  c.fillStyle = '#b9b39a';
  c.fillRect(0, 470, 1024, 170);
  const skyTex = new THREE.CanvasTexture(sky);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ map: skyTex, color: new THREE.Color(1.55, 1.5, 1.42) }));
  outside.position.set(-0.8, 2.2, -4.5);
  scene.add(outside);

  // Niska hrastova klupa ispod prozora.
  const oak = new THREE.MeshPhysicalMaterial({
    map: oakMap,
    normalMap: oakNormal,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughnessMap: oakRough,
    roughness: 1,
    color: new THREE.Color(0.97, 0.83, 0.66),
    clearcoat: 0.15,
    clearcoatRoughness: 0.45,
  });
  const slab = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.008), oak);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  };
  slab(1.55, 0.05, 0.4, WMID, 0.415, 0.46);
  slab(0.05, 0.39, 0.36, WMID - 0.68, 0.195, 0.46);
  slab(0.05, 0.39, 0.36, WMID + 0.68, 0.195, 0.46);
  // Prirodna lanena zavjesa lijevo od prozora: mekani nabori, propušta svjetlo.
  const cw = 0.95;
  const cg = new THREE.PlaneGeometry(cw, RH - 0.05, 120, 1);
  const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i);
    cp.setZ(i, Math.sin((x / cw) * Math.PI * 11 + Math.sin(x * 7) * 1.2) * 0.022 + Math.sin((x / cw) * Math.PI * 3.3) * 0.02);
  }
  cg.computeVertexNormals();
  const curtain = new THREE.Mesh(
    cg,
    new THREE.MeshPhysicalMaterial({ color: '#f4efe6', roughness: 0.95, transparent: true, opacity: 0.58, side: THREE.DoubleSide, sheen: 1, sheenColor: new THREE.Color('#fff4e2'), sheenRoughness: 0.8 }),
  );
  curtain.position.set(WX0 + 0.12, (RH - 0.05) / 2, 0.1);
  curtain.castShadow = true;
  scene.add(curtain);
  box(-RW, WX1 + 0.4, RH - 0.06, RH - 0.035, 0.1, 0.14, frame, false);

  // Keramička vaza sa suhim granama.
  const vaseMat = new THREE.MeshStandardMaterial({ color: '#e7dfd2', roughness: 0.88, normalMap: plaster, normalScale: new THREE.Vector2(0.6, 0.6) });
  const profile = [
    [0, 0],
    [0.11, 0],
    [0.17, 0.08],
    [0.2, 0.24],
    [0.18, 0.4],
    [0.11, 0.53],
    [0.075, 0.58],
    [0.085, 0.62],
    [0.07, 0.62],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), vaseMat);
  const VX = 1.45;
  const VZ = 0.62;
  vase.position.set(VX, 0, VZ);
  vase.castShadow = true;
  vase.receiveShadow = true;
  scene.add(vase);
  const twig = new THREE.MeshStandardMaterial({ color: '#3b2f26', roughness: 0.9 });
  const branch = (from, dir, len, radius, depth) => {
    const pts = [from.clone()];
    let p = from.clone();
    const d = dir.clone();
    for (let i = 0; i < 4; i++) {
      d.add(new THREE.Vector3((rnd() - 0.5) * 0.35, (rnd() - 0.3) * 0.2, (rnd() - 0.5) * 0.25)).normalize();
      p = p.clone().addScaledVector(d, len / 4);
      pts.push(p);
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, radius, 6, false), twig);
    m.castShadow = true;
    scene.add(m);
    if (depth > 0) {
      for (let k = 1; k < pts.length - 1; k++) {
        if (rnd() < 0.55) {
          const nd = d.clone().add(new THREE.Vector3((rnd() - 0.5) * 1.4, rnd() * 0.5, (rnd() - 0.5) * 0.8)).normalize();
          branch(pts[k], nd, len * (0.32 + rnd() * 0.25), radius * 0.6, depth - 1);
        }
      }
    }
  };
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a) * 0.35, 1, Math.sin(a) * 0.2).normalize();
    branch(new THREE.Vector3(VX + Math.cos(a) * 0.03, 0.6, VZ + Math.sin(a) * 0.03), dir, 0.9 + rnd() * 0.5, 0.0055, 2);
  }

  // Sunce kroz prozor s krošnjom (gobo) — meke ivice dobiju se usrednjavanjem pomjerenih kadrova.
  const sun = new THREE.SpotLight('#ffe2bd', 12, 0, 0.36, 0.25, 0);
  sun.position.copy(SUN);
  sun.target.position.set(0.55, 0, 1.05);
  sun.map = gobo;
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 26;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  scene.add(new THREE.HemisphereLight('#fff6ea', '#f1ebe2', 0.5));
  // Svjetlo odbijeno prema stropu.
  const lift = new THREE.PointLight('#fffaf3', 3, 9, 2);
  lift.position.set(0.2, 1.3, 2.2);
  scene.add(lift);
  // Odbijeno toplo svjetlo sa sunčane mrlje na podu.
  const bounce = new THREE.PointLight('#ffdcb0', 3, 8, 2);
  bounce.position.set(0.5, 0.4, 1.4);
  scene.add(bounce);

  return { sun };
}

const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
const ao = new N8AOPostPass(scene, camera, W, H);
ao.configuration.aoRadius = 0.55;
ao.configuration.distanceFalloff = 0.9;
ao.configuration.intensity = 2.4;
ao.configuration.aoSamples = 32;
ao.configuration.denoiseSamples = 8;
ao.configuration.denoiseRadius = 10;
composer.addPass(ao);
composer.addPass(new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL })));

const ready = build();
const basePos = SUN;

/** Usrednjava n kadrova i vraća PNG (data URL). */
window.renderAccum = async (n = 24) => {
  const { sun } = await ready;
  const acc = new Float32Array(W * H * 4);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  for (let i = 0; i < n; i++) {
    // Sunce kao disk (≈ 1,5°): meke rubove sjena daje usrednjavanje.
    const a = i * 2.39996;
    const r = 0.32 * Math.sqrt((i + 0.5) / n);
    sun.position.copy(basePos).add(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.7, Math.sin(a) * r * 0.5));
    const jx = ((i * 0.618) % 1) - 0.5;
    const jy = ((i * 0.382 + 0.25) % 1) - 0.5;
    camera.setViewOffset(W, H, jx, jy + SHIFT * H, W, H);
    composer.render();
    ctx.drawImage(renderer.domElement, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let k = 0; k < d.length; k++) acc[k] += d[k];
  }
  const out = ctx.createImageData(W, H);
  for (let k = 0; k < acc.length; k++) out.data[k] = acc[k] / n;
  ctx.putImageData(out, 0, 0);
  return cv.toDataURL('image/png');
};
window.renderReady = ready.then(() => true);
