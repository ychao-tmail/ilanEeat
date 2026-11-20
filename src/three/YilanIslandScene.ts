import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  axialToWorld,
  FOOD_ROUTES,
  HEX_RADIUS,
  MAINLAND_TOWN_IDS,
  TOWN_MAP,
  TOWN_TILES,
  TownId,
} from '../data/yilanData';
import {
  AnimatedProp,
  buildTownLandmark,
} from './landmarkBuilders';
import { buildScallionMascot, ScallionMascotRig } from './mascotBuilder';
import {
  createContactShadowTexture,
  createDioramaGrainTexture,
} from './proceduralTextures';

export interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface MascotStateUpdate {
  townId: TownId;
  townName: string;
  quote: string;
  isWaving: boolean;
}

export interface YilanSceneCallbacks {
  onSelectTown: (townId: TownId | null) => void;
  onHoverTown: (townId: TownId | null, screenPos: ProjectedPoint | null) => void;
  onMascotUpdate: (update: MascotStateUpdate) => void;
  onMascotScreenPos: (pos: ProjectedPoint) => void;
  onMascotClick: (townId: TownId) => void;
  onUserOrbitStart: () => void;
  onWebGLContextLost: () => void;
}

interface TileRuntime {
  id: TownId;
  root: THREE.Group;
  baseY: number;
  currentLift: number;
  targetLift: number;
  topMesh: THREE.Mesh;
  topMaterial: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
  dimColor: THREE.Color;
  rimMesh: THREE.LineLoop;
  rimMaterial: THREE.LineBasicMaterial;
  worldPos: THREE.Vector3;
  surfaceY: number;
  soapboxWorldPos: THREE.Vector3;
  nightEmissives: { material: THREE.MeshStandardMaterial; maxIntensity: number }[];
  animatedProps: AnimatedProp[];
}

interface RouteBeamRuntime {
  group: THREE.Group;
  curves: THREE.CatmullRomCurve3[];
  beads: { mesh: THREE.Mesh; offset: number; speed: number }[];
}

// Pre-allocated math helpers outside render loop (zero GC in tick)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Proj = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _colorSky = new THREE.Color();
const _colorFog = new THREE.Color();
const _colorSun = new THREE.Color();
const _colorHemiSky = new THREE.Color();
const _colorHemiGround = new THREE.Color();
const _colorOcean = new THREE.Color();
const _dummy = new THREE.Object3D();

// Palette keyframes for 24-hour cycle
const SKY_NIGHT = new THREE.Color('#0E182B');
const SKY_DAWN = new THREE.Color('#F2B28C');
const SKY_DAY = new THREE.Color('#B9DCE8');
const SKY_DUSK = new THREE.Color('#E08A6C');

const SUN_NIGHT = new THREE.Color('#6F8EC9');
const SUN_DAWN = new THREE.Color('#FFBE85');
const SUN_DAY = new THREE.Color('#FFF7E6');
const SUN_DUSK = new THREE.Color('#FF9259');

const OCEAN_NIGHT = new THREE.Color('#132944');
const OCEAN_DAWN = new THREE.Color('#3D7A94');
const OCEAN_DAY = new THREE.Color('#2D89A8');
const OCEAN_DUSK = new THREE.Color('#34607E');

const HEMI_GROUND_DAY = new THREE.Color('#6B7E68');
const HEMI_GROUND_NIGHT = new THREE.Color('#1A2233');

// Patrol loop order across the 12 mainland townships (follows geographical neighbors)
const MASCOT_PATROL_ORDER: TownId[] = [
  'sanxing',
  'luodong',
  'dongshan',
  'wujie',
  'yilan',
  'zhuangwei',
  'toucheng',
  'jiaoxi',
  'yuanshan',
  'luodong',
  'suao',
  'nanao',
  'datong',
];

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/** Creates a pointy-top hexagonal shape centered at (0, 0) */
function createHexShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export class YilanIslandScene {
  private container: HTMLElement;
  private callbacks: YilanSceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();

  private tiles = new Map<TownId, TileRuntime>();
  private hitMeshes: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private lastRaycastMs = 0;
  private pointerDownPos = { x: 0, y: 0 };
  private isPointerDown = false;

  // Lighting & Atmosphere
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private nightPointLights: THREE.PointLight[] = [];
  private oceanMaterial!: THREE.MeshStandardMaterial;
  private oceanTimeUniform = { value: 0 };
  private starsPoints!: THREE.Points;
  private starsMaterial!: THREE.PointsMaterial;
  private cloudInstancedMesh!: THREE.InstancedMesh;
  private cloudData: { x: number; y: number; z: number; sx: number; sy: number; sz: number; speed: number }[] = [];

  // Interactive State
  private targetTimeOfDay = 10.5;
  private currentTimeOfDay = 10.5;
  private hoveredTownId: TownId | null = null;
  private selectedTownId: TownId | null = null;
  private activeRouteId: string | null = null;
  private activeRouteBeam: RouteBeamRuntime | null = null;
  private followMascot = false;

  // Smooth Camera Flight
  private defaultCameraPos = new THREE.Vector3(10.5, 14.5, 16.5);
  private defaultTargetPos = new THREE.Vector3(-0.6, 0.4, 1.0);
  private cameraGoalPos: THREE.Vector3 | null = null;
  private cameraGoalTarget: THREE.Vector3 | null = null;

  // Sanxing Scallion Mascot State Machine
  private mascot!: ScallionMascotRig;
  private mascotPatrolIndex = 0;
  private mascotPhase: 'pause' | 'walk' = 'pause';
  private mascotTimer = 0;
  private mascotWalkDuration = 2.6;
  private mascotPauseDuration = 4.6;
  private mascotFromPos = new THREE.Vector3();
  private mascotToPos = new THREE.Vector3();
  private mascotCurrentTown: TownId = 'sanxing';
  private mascotCelebrateTimer = 0;

  // Frame loop management
  private frameId = 0;
  private isDisposed = false;
  private isPaused = false;
  private elapsedTotal = 0;

  // Disposables registry
  private texturesToDispose: THREE.Texture[] = [];

  constructor(container: HTMLElement, callbacks: YilanSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = SKY_DAY.clone();
    this.scene.fog = new THREE.FogExp2(SKY_DAY.getHex(), 0.0155);

    // Mandatory studio environment map via RoomEnvironment on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.52;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.2, 180);
    this.camera.position.copy(this.defaultCameraPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 6.2;
    this.controls.maxDistance = 34;
    this.controls.minPolarAngle = 0.28;
    this.controls.maxPolarAngle = Math.PI / 2.28;
    this.controls.target.copy(this.defaultTargetPos);
    this.controls.update();

    this.controls.addEventListener('start', this.handleOrbitStart);

    // Raycaster checks only layer 1 (fast simplified hit proxies)
    this.raycaster.layers.set(1);

    this.setupLighting();
    this.setupEnvironmentWorld();
    this.buildArchipelago();
    this.setupMascot();

    this.applyTimeOfDayLighting(this.currentTimeOfDay);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.startLoop();
  }

  private setupLighting(): void {
    this.hemiLight = new THREE.HemisphereLight(0xdaf0ff, 0x6b7e68, 0.85);
    this.hemiLight.position.set(0, 30, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7e6, 1.85);
    this.keyLight.position.set(14, 22, 10);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 65;
    const d = 16;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.025;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x88c7e8, 0.45);
    this.rimLight.position.set(-16, 10, -14);
    this.scene.add(this.rimLight);
  }

  private setupEnvironmentWorld(): void {
    // 1. Expansive Pacific Ocean with gentle PBR wave displacement via onBeforeCompile
    const oceanGeo = new THREE.PlaneGeometry(180, 180, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);

    this.oceanMaterial = new THREE.MeshStandardMaterial({
      color: OCEAN_DAY.clone(),
      roughness: 0.24,
      metalness: 0.14,
      flatShading: true,
    });

    const uTime = this.oceanTimeUniform;
    this.oceanMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uOceanTime = uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uOceanTime;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float wave1 = sin(transformed.x * 0.35 + uOceanTime * 1.15) * 0.065;
           float wave2 = cos(transformed.z * 0.32 + uOceanTime * 0.92) * 0.055;
           transformed.y += wave1 + wave2;`
        );
    };

    const oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMaterial);
    oceanMesh.position.y = -0.32;
    oceanMesh.receiveShadow = true;
    this.scene.add(oceanMesh);

    // Subtle turquoise coastal shoal halo around the archipelago
    const shoalMat = new THREE.MeshStandardMaterial({
      color: 0x55b6c4,
      roughness: 0.35,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shoalGeo = new THREE.CircleGeometry(10.8, 32);
    shoalGeo.rotateX(-Math.PI / 2);
    const shoal = new THREE.Mesh(shoalGeo, shoalMat);
    shoal.position.set(-1.5, -0.22, 1.5);
    this.scene.add(shoal);

    // 2. Distant Western Xueshan Mountain Range Silhouette (natural outdoor perimeter)
    const ridgeGroup = new THREE.Group();
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x5f8580,
      roughness: 0.92,
      flatShading: true,
    });
    const peaks = [
      { x: -16, z: -9, r: 5.2, h: 6.2 },
      { x: -18, z: -2, r: 6.4, h: 7.8 },
      { x: -19, z: 5, r: 6.8, h: 8.6 },
      { x: -16, z: 12, r: 5.5, h: 6.8 },
      { x: -11, z: 17, r: 4.8, h: 5.4 },
    ];
    for (const p of peaks) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 6), ridgeMat);
      cone.position.set(p.x, p.h * 0.42 - 0.5, p.z);
      ridgeGroup.add(cone);
    }
    this.scene.add(ridgeGroup);

    // 3. Drifting Low-Poly Clouds (InstancedMesh)
    const cloudGeo = new THREE.DodecahedronGeometry(0.65, 0);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      transparent: true,
      opacity: 0.82,
      flatShading: true,
    });
    const cloudSeeds = [
      { x: -7, y: 6.4, z: -5, sx: 2.1, sy: 0.65, sz: 1.2, speed: 0.16 },
      { x: 5, y: 7.1, z: -6.5, sx: 1.8, sy: 0.55, sz: 1.1, speed: 0.12 },
      { x: 9, y: 6.2, z: 2.5, sx: 2.3, sy: 0.6, sz: 1.3, speed: 0.14 },
      { x: -9.5, y: 7.5, z: 5.5, sx: 2.0, sy: 0.62, sz: 1.1, speed: 0.11 },
      { x: 1.5, y: 8.0, z: 9.5, sx: 1.7, sy: 0.52, sz: 1.0, speed: 0.15 },
      { x: -3.5, y: 6.8, z: -10.5, sx: 2.2, sy: 0.58, sz: 1.25, speed: 0.13 },
    ];
    this.cloudData = cloudSeeds;
    this.cloudInstancedMesh = new THREE.InstancedMesh(
      cloudGeo,
      cloudMat,
      cloudSeeds.length
    );
    this.cloudInstancedMesh.frustumCulled = false;
    cloudSeeds.forEach((c, idx) => {
      _dummy.position.set(c.x, c.y, c.z);
      _dummy.scale.set(c.sx, c.sy, c.sz);
      _dummy.updateMatrix();
      this.cloudInstancedMesh.setMatrixAt(idx, _dummy.matrix);
    });
    this.cloudInstancedMesh.instanceMatrix.needsUpdate = true;
    this.cloudInstancedMesh.computeBoundingSphere();
    this.scene.add(this.cloudInstancedMesh);

    // 4. Night Starfield (smoothly fades in after sunset)
    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < starCount; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI * 0.42;
      const r = 68 + rand() * 16;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) + 8;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starsMaterial = new THREE.PointsMaterial({
      color: 0xfff4d6,
      size: 0.42,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.starsPoints = new THREE.Points(starsGeo, this.starsMaterial);
    this.scene.add(this.starsPoints);
  }

  private buildArchipelago(): void {
    const hexTopShape = createHexShape(HEX_RADIUS * 0.96);
    const hexCliffShape = createHexShape(HEX_RADIUS * 0.985);
    const contactShadowTex = createContactShadowTexture();
    this.texturesToDispose.push(contactShadowTex);

    for (const town of TOWN_TILES) {
      const { x, z } = axialToWorld(town.q, town.r);
      const tileGroup = new THREE.Group();
      tileGroup.position.set(x, 0, z);

      // Layered Beveled Extruded Hexagonal Cliff Base
      const cliffHeight = town.elevation;
      const cliffGeo = new THREE.ExtrudeGeometry(hexCliffShape, {
        depth: cliffHeight,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.06,
        bevelSegments: 2,
      });
      cliffGeo.rotateX(Math.PI / 2);
      const cliffMat = new THREE.MeshStandardMaterial({
        color: town.cliffColor,
        roughness: 0.9,
        metalness: 0.02,
        flatShading: true,
      });
      const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
      cliffMesh.position.y = cliffHeight;
      cliffMesh.castShadow = true;
      cliffMesh.receiveShadow = true;
      tileGroup.add(cliffMesh);

      // Textured Top Cap with subtle diorama paper-clay grain
      const capHeight = 0.14;
      const topGeo = new THREE.ExtrudeGeometry(hexTopShape, {
        depth: capHeight,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.04,
        bevelSegments: 2,
      });
      topGeo.rotateX(Math.PI / 2);

      const grainTex = createDioramaGrainTexture(
        this.renderer,
        town.topColor,
        town.accentColor
      );
      this.texturesToDispose.push(grainTex);

      const topMat = new THREE.MeshStandardMaterial({
        map: grainTex,
        color: 0xffffff,
        roughness: 0.84,
        metalness: 0.02,
        flatShading: true,
      });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = cliffHeight + capHeight + 0.02;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      tileGroup.add(topMesh);

      const surfaceY = cliffHeight + capHeight + 0.07;

      // Crisp Hexagonal Highlight Rim (shown on hover / selection / route)
      const rimPoints: THREE.Vector3[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        rimPoints.push(
          new THREE.Vector3(
            Math.cos(a) * HEX_RADIUS * 1.03,
            surfaceY + 0.02,
            Math.sin(a) * HEX_RADIUS * 1.03
          )
        );
      }
      const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
      const rimMat = new THREE.LineBasicMaterial({
        color: town.accentColor,
        transparent: true,
        opacity: 0.0,
      });
      const rimMesh = new THREE.LineLoop(rimGeo, rimMat);
      tileGroup.add(rimMesh);

      // Bespoke Composite Miniature Landmark for this Township
      const landmark = buildTownLandmark(town.id, this.renderer);
      landmark.group.position.y = surfaceY;
      tileGroup.add(landmark.group);

      // Soft underwater coastal contact shadow halo under each hex
      const underHalo = new THREE.Mesh(
        new THREE.CircleGeometry(HEX_RADIUS * 1.15, 6),
        new THREE.MeshBasicMaterial({
          map: contactShadowTex,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })
      );
      underHalo.rotation.x = -Math.PI / 2;
      underHalo.rotation.z = Math.PI / 6;
      underHalo.position.y = -0.26;
      tileGroup.add(underHalo);

      // Warm Night Market PointLight for signature nightlife hubs
      if (town.hasNightMarketGlow) {
        const pt = new THREE.PointLight(
          town.id === 'luodong' ? 0xff9142 : 0xffbe63,
          0,
          7.5,
          1.8
        );
        pt.position.set(0, surfaceY + 1.05, 0);
        tileGroup.add(pt);
        this.nightPointLights.push(pt);
      }

      // Dedicated Invisible Collision Proxy on Layer 1 for crisp, fast raycasting
      const hitGeo = new THREE.CylinderGeometry(
        HEX_RADIUS * 0.98,
        HEX_RADIUS * 0.98,
        surfaceY + 0.85,
        6
      );
      const hitMesh = new THREE.Mesh(
        hitGeo,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.position.y = (surfaceY + 0.85) / 2;
      hitMesh.layers.set(1);
      hitMesh.userData = { kind: 'town', townId: town.id };
      tileGroup.add(hitMesh);
      this.hitMeshes.push(hitMesh);

      this.scene.add(tileGroup);

      const soapboxWorldPos = new THREE.Vector3(
        x + landmark.soapboxPosition.x,
        surfaceY + landmark.soapboxPosition.y,
        z + landmark.soapboxPosition.z
      );

      this.tiles.set(town.id, {
        id: town.id,
        root: tileGroup,
        baseY: 0,
        currentLift: 0,
        targetLift: 0,
        topMesh,
        topMaterial: topMat,
        baseColor: new THREE.Color(0xffffff),
        dimColor: new THREE.Color(0x8899a6),
        rimMesh,
        rimMaterial: rimMat,
        worldPos: new THREE.Vector3(x, surfaceY, z),
        surfaceY,
        soapboxWorldPos,
        nightEmissives: landmark.nightEmissiveMaterials,
        animatedProps: landmark.animatedProps,
      });
    }
  }

  private setupMascot(): void {
    this.mascot = buildScallionMascot();

    // Soft contact shadow directly beneath mascot feet
    const shadowTex = createContactShadowTexture();
    this.texturesToDispose.push(shadowTex);
    const footShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.62),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      })
    );
    footShadow.rotation.x = -Math.PI / 2;
    footShadow.position.y = 0.015;
    this.mascot.root.add(footShadow);

    // Invisible click proxy sphere on Layer 1 so users can click the Scallion Traveler!
    const mascotHit = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mascotHit.position.y = 0.52;
    mascotHit.layers.set(1);
    mascotHit.userData = { kind: 'mascot' };
    this.mascot.root.add(mascotHit);
    this.hitMeshes.push(mascotHit);

    const startTile = this.tiles.get('sanxing')!;
    this.mascotCurrentTown = 'sanxing';
    this.mascotFromPos.copy(startTile.soapboxWorldPos);
    this.mascotToPos.copy(startTile.soapboxWorldPos);
    this.mascot.root.position.copy(startTile.soapboxWorldPos);
    this.scene.add(this.mascot.root);

    this.emitMascotUpdate(true);
  }

  private emitMascotUpdate(isWaving: boolean): void {
    const town = TOWN_MAP[this.mascotCurrentTown];
    this.callbacks.onMascotUpdate({
      townId: town.id,
      townName: town.name,
      quote: town.mascotQuote,
      isWaving,
    });
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    dom.addEventListener('pointermove', this.handlePointerMove);
    dom.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('webglcontextlost', this.handleContextLost, false);
    dom.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    window.addEventListener('resize', this.handleResize);
  }

  private handleOrbitStart = (): void => {
    this.cameraGoalPos = null;
    this.cameraGoalTarget = null;
    if (this.followMascot) {
      this.followMascot = false;
      this.callbacks.onUserOrbitStart();
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.isPaused = true;
    this.callbacks.onWebGLContextLost();
  };

  private handleContextRestored = (): void => {
    this.isPaused = false;
  };

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointerDown = (e: PointerEvent): void => {
    this.isPointerDown = true;
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastRaycastMs < 40) return;
    this.lastRaycastMs = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);

    if (hits.length > 0) {
      const data = hits[0].object.userData;
      this.renderer.domElement.style.cursor = 'pointer';
      if (data.kind === 'town') {
        const tid = data.townId as TownId;
        this.hoveredTownId = tid;
        const tile = this.tiles.get(tid)!;
        const proj = this.projectToScreen(
          _vec3Proj.set(tile.worldPos.x, tile.surfaceY + 1.15, tile.worldPos.z)
        );
        this.callbacks.onHoverTown(tid, proj);
        return;
      }
      if (data.kind === 'mascot') {
        this.hoveredTownId = null;
        this.callbacks.onHoverTown(null, null);
        return;
      }
    }

    if (this.hoveredTownId !== null) {
      this.hoveredTownId = null;
      this.callbacks.onHoverTown(null, null);
    }
    this.renderer.domElement.style.cursor = this.isPointerDown ? 'grabbing' : 'grab';
  };

  private handlePointerUp = (e: PointerEvent): void => {
    this.isPointerDown = false;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return; // Dragged camera, not a click

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);

    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.kind === 'mascot') {
        this.mascotCelebrateTimer = 3.0;
        this.mascotPhase = 'pause';
        this.mascotTimer = 0;
        this.emitMascotUpdate(true);
        this.callbacks.onMascotClick(this.mascotCurrentTown);
        return;
      }
      if (data.kind === 'town') {
        const tid = data.townId as TownId;
        this.focusTown(tid);
        this.callbacks.onSelectTown(tid);
        return;
      }
    }
  };

  private projectToScreen(worldPos: THREE.Vector3): ProjectedPoint {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _vec3A.copy(worldPos).project(this.camera);
    const visible = _vec3A.z > -1 && _vec3A.z < 1;
    return {
      x: ((_vec3A.x + 1) * 0.5) * rect.width,
      y: ((-_vec3A.y + 1) * 0.5) * rect.height,
      visible,
    };
  }

  // ===== Public Control API =====

  public setTimeOfDay(hour: number): void {
    this.targetTimeOfDay = ((hour % 24) + 24) % 24;
  }

  public setSelectedTown(townId: TownId | null): void {
    this.selectedTownId = townId;
    if (townId) {
      this.focusTown(townId);
    }
  }

  public focusTown(townId: TownId): void {
    const tile = this.tiles.get(townId);
    if (!tile) return;
    this.followMascot = false;
    this.cameraGoalTarget = tile.worldPos.clone().add(new THREE.Vector3(0, 0.35, 0));
    this.cameraGoalPos = tile.worldPos.clone().add(new THREE.Vector3(4.6, 5.8, 6.2));
  }

  public resetView(): void {
    this.followMascot = false;
    this.cameraGoalPos = this.defaultCameraPos.clone();
    this.cameraGoalTarget = this.defaultTargetPos.clone();
  }

  public setFollowMascot(enabled: boolean): void {
    this.followMascot = enabled;
    if (enabled) {
      this.cameraGoalPos = null;
      this.cameraGoalTarget = null;
      this.mascotCelebrateTimer = 2.4;
      this.emitMascotUpdate(true);
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public setActiveRoute(routeId: string | null): void {
    this.activeRouteId = routeId;

    // Clean up existing route beam
    if (this.activeRouteBeam) {
      this.scene.remove(this.activeRouteBeam.group);
      this.activeRouteBeam.group.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      this.activeRouteBeam = null;
    }

    if (!routeId) return;
    const route = FOOD_ROUTES.find((r) => r.id === routeId);
    if (!route || route.townIds.length < 2) return;

    const beamGroup = new THREE.Group();
    const curves: THREE.CatmullRomCurve3[] = [];
    const beads: { mesh: THREE.Mesh; offset: number; speed: number }[] = [];
    const routeColor = new THREE.Color(route.color);

    const tubeMat = new THREE.MeshStandardMaterial({
      color: routeColor,
      emissive: routeColor,
      emissiveIntensity: 1.15,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const nodeMat = new THREE.MeshStandardMaterial({
      color: routeColor,
      emissive: routeColor,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    for (let i = 0; i < route.townIds.length - 1; i++) {
      const fromTile = this.tiles.get(route.townIds[i]);
      const toTile = this.tiles.get(route.townIds[i + 1]);
      if (!fromTile || !toTile) continue;

      const p0 = fromTile.worldPos.clone().add(new THREE.Vector3(0, 0.95, 0));
      const p2 = toTile.worldPos.clone().add(new THREE.Vector3(0, 0.95, 0));
      const dist = p0.distanceTo(p2);
      const mid = p0
        .clone()
        .add(p2)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 1.35 + dist * 0.22, 0));

      const curve = new THREE.CatmullRomCurve3([p0, mid, p2]);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.068, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      beamGroup.add(tubeMesh);

      // Luminous traveling beads gliding along each arch
      for (let b = 0; b < 2; b++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 10), glowMat);
        beamGroup.add(bead);
        beads.push({ mesh: bead, offset: b * 0.5 + i * 0.15, speed: 0.42 });
      }
    }

    // Glowing floating pin beacons on each route stop
    route.townIds.forEach((tid) => {
      const t = this.tiles.get(tid);
      if (!t) return;
      const pin = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), nodeMat);
      pin.position.set(t.worldPos.x, t.surfaceY + 1.02, t.worldPos.z);
      beamGroup.add(pin);
    });

    this.scene.add(beamGroup);
    this.activeRouteBeam = { group: beamGroup, curves, beads };

    // Frame the full archipelago smoothly when switching routes
    this.followMascot = false;
    this.cameraGoalPos = new THREE.Vector3(11.2, 15.2, 17.2);
    this.cameraGoalTarget = new THREE.Vector3(-0.6, 0.5, 1.2);
  }

  // ===== Per-Frame Simulation & Rendering =====

  private applyTimeOfDayLighting(hour: number): void {
    const h = ((hour % 24) + 24) % 24;

    // Night intensity factor: 0 during day (8..16), 1 during full night (19.5..4.5)
    let nightFactor = 0;
    if (h >= 19.5 || h <= 4.5) {
      nightFactor = 1;
    } else if (h > 4.5 && h < 8.0) {
      nightFactor = 1 - (h - 4.5) / 3.5;
    } else if (h > 16.0 && h < 19.5) {
      nightFactor = (h - 16.0) / 3.5;
    }

    // Smooth Sky, Sun, and Ocean interpolation across 4 anchor periods
    if (h >= 5 && h < 7.5) {
      const t = (h - 5) / 2.5;
      _colorSky.copy(SKY_NIGHT).lerp(SKY_DAWN, t);
      _colorSun.copy(SUN_NIGHT).lerp(SUN_DAWN, t);
      _colorOcean.copy(OCEAN_NIGHT).lerp(OCEAN_DAWN, t);
    } else if (h >= 7.5 && h < 10.5) {
      const t = (h - 7.5) / 3.0;
      _colorSky.copy(SKY_DAWN).lerp(SKY_DAY, t);
      _colorSun.copy(SUN_DAWN).lerp(SUN_DAY, t);
      _colorOcean.copy(OCEAN_DAWN).lerp(OCEAN_DAY, t);
    } else if (h >= 10.5 && h < 16.2) {
      _colorSky.copy(SKY_DAY);
      _colorSun.copy(SUN_DAY);
      _colorOcean.copy(OCEAN_DAY);
    } else if (h >= 16.2 && h < 18.4) {
      const t = (h - 16.2) / 2.2;
      _colorSky.copy(SKY_DAY).lerp(SKY_DUSK, t);
      _colorSun.copy(SUN_DAY).lerp(SUN_DUSK, t);
      _colorOcean.copy(OCEAN_DAY).lerp(OCEAN_DUSK, t);
    } else if (h >= 18.4 && h < 20.4) {
      const t = (h - 18.4) / 2.0;
      _colorSky.copy(SKY_DUSK).lerp(SKY_NIGHT, t);
      _colorSun.copy(SUN_DUSK).lerp(SUN_NIGHT, t);
      _colorOcean.copy(OCEAN_DUSK).lerp(OCEAN_NIGHT, t);
    } else {
      _colorSky.copy(SKY_NIGHT);
      _colorSun.copy(SUN_NIGHT);
      _colorOcean.copy(OCEAN_NIGHT);
    }

    (this.scene.background as THREE.Color).copy(_colorSky);
    _colorFog.copy(_colorSky);
    (this.scene.fog as THREE.FogExp2).color.copy(_colorFog);
    this.oceanMaterial.color.copy(_colorOcean);

    // Sun / Moon Orbital Arc (East = +X rising over Pacific & Guishan Island!)
    const sunAngle = ((h - 6) / 12) * Math.PI; // 0 at 06:00 East, PI/2 at 12:00 zenith, PI at 18:00 West
    const isDayArc = h >= 5.5 && h <= 18.5;
    if (isDayArc) {
      const elev = Math.max(0.18, Math.sin(sunAngle));
      this.keyLight.position.set(
        Math.cos(sunAngle) * 24,
        elev * 24 + 3,
        10
      );
      this.keyLight.intensity = THREE.MathUtils.lerp(0.65, 2.0, elev);
    } else {
      // Soft moonlight from high northeast
      this.keyLight.position.set(10, 19, -8);
      this.keyLight.intensity = 0.62;
    }
    this.keyLight.color.copy(_colorSun);

    _colorHemiSky.copy(_colorSky).lerp(new THREE.Color(0xffffff), 0.25);
    _colorHemiGround.copy(HEMI_GROUND_DAY).lerp(HEMI_GROUND_NIGHT, nightFactor);
    this.hemiLight.color.copy(_colorHemiSky);
    this.hemiLight.groundColor.copy(_colorHemiGround);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.9, 0.36, nightFactor);

    this.scene.environmentIntensity = THREE.MathUtils.lerp(0.54, 0.16, nightFactor);
    this.starsMaterial.opacity = Math.max(0, (nightFactor - 0.35) / 0.65) * 0.9;

    // Ignite Night Market lanterns, windows, signs, and lighthouse beacon!
    const lanternGlow = Math.pow(nightFactor, 1.15);
    for (const tile of this.tiles.values()) {
      for (const item of tile.nightEmissives) {
        item.material.emissiveIntensity = 0.04 + lanternGlow * item.maxIntensity;
      }
    }

    for (const pt of this.nightPointLights) {
      pt.intensity = lanternGlow * 4.6;
    }
  }

  private updateMascot(dt: number): void {
    this.mascotTimer += dt;
    if (this.mascotCelebrateTimer > 0) {
      this.mascotCelebrateTimer = Math.max(0, this.mascotCelebrateTimer - dt);
    }

    if (this.mascotPhase === 'pause') {
      const tile = this.tiles.get(this.mascotCurrentTown)!;
      const targetY = tile.soapboxWorldPos.y + tile.currentLift;

      // Joyful wave & gentle bounce on the soapbox
      const waveFreq = this.mascotCelebrateTimer > 0 ? 11.0 : 6.2;
      const hop = Math.abs(Math.sin(this.elapsedTotal * (this.mascotCelebrateTimer > 0 ? 7.5 : 3.2))) *
        (this.mascotCelebrateTimer > 0 ? 0.16 : 0.045);

      this.mascot.root.position.set(
        tile.soapboxWorldPos.x,
        targetY + hop,
        tile.soapboxWorldPos.z
      );

      // Face smoothly toward camera-ish front-right
      const desiredRotY = Math.atan2(
        this.camera.position.x - this.mascot.root.position.x,
        this.camera.position.z - this.mascot.root.position.z
      );
      this.mascot.root.rotation.y = THREE.MathUtils.damp(
        this.mascot.root.rotation.y,
        desiredRotY,
        4.5,
        dt
      );

      // Show scallion pancake snack prop & wave right arm!
      this.mascot.snackProp.visible = true;
      this.mascot.rightArm.rotation.z = -1.65 + Math.sin(this.elapsedTotal * waveFreq) * 0.42;
      this.mascot.leftArm.rotation.z = 0.25 + Math.cos(this.elapsedTotal * 4.0) * 0.12;
      this.mascot.leftLeg.rotation.x = THREE.MathUtils.damp(this.mascot.leftLeg.rotation.x, 0, 8, dt);
      this.mascot.rightLeg.rotation.x = THREE.MathUtils.damp(this.mascot.rightLeg.rotation.x, 0, 8, dt);
      this.mascot.leafGroup.rotation.z = Math.sin(this.elapsedTotal * 3.8) * 0.11;

      if (this.mascotTimer >= this.mascotPauseDuration && this.mascotCelebrateTimer <= 0) {
        // Begin walking to the next township in patrol loop
        this.mascotPhase = 'walk';
        this.mascotTimer = 0;
        this.mascotFromPos.copy(tile.soapboxWorldPos);
        this.mascotPatrolIndex = (this.mascotPatrolIndex + 1) % MASCOT_PATROL_ORDER.length;
        const nextTownId = MASCOT_PATROL_ORDER[this.mascotPatrolIndex];
        const nextTile = this.tiles.get(nextTownId)!;
        this.mascotToPos.copy(nextTile.soapboxWorldPos);
        this.mascotCurrentTown = nextTownId;
        this.mascot.snackProp.visible = false;
        this.emitMascotUpdate(false);
      }
    } else {
      // Smoothly hopping-walking across hexes to next soapbox
      const progress = Math.min(this.mascotTimer / this.mascotWalkDuration, 1);
      const eased = progress * progress * (3 - 2 * progress);

      _vec3A.lerpVectors(this.mascotFromPos, this.mascotToPos, eased);
      // Slight graceful arch when crossing hex channels + energetic walking steps
      const channelArc = Math.sin(progress * Math.PI) * 0.42;
      const stepBounce = Math.abs(Math.sin(progress * Math.PI * 8)) * 0.08;
      this.mascot.root.position.set(_vec3A.x, _vec3A.y + channelArc + stepBounce, _vec3A.z);

      const moveDx = this.mascotToPos.x - this.mascotFromPos.x;
      const moveDz = this.mascotToPos.z - this.mascotFromPos.z;
      const walkYaw = Math.atan2(moveDx, moveDz);
      this.mascot.root.rotation.y = THREE.MathUtils.damp(
        this.mascot.root.rotation.y,
        walkYaw,
        9.0,
        dt
      );

      // Walking limb swing
      const swing = Math.sin(this.elapsedTotal * 13.5) * 0.55;
      this.mascot.leftLeg.rotation.x = swing;
      this.mascot.rightLeg.rotation.x = -swing;
      this.mascot.leftArm.rotation.z = 0.15;
      this.mascot.leftArm.rotation.x = -swing * 0.7;
      this.mascot.rightArm.rotation.z = -0.15;
      this.mascot.rightArm.rotation.x = swing * 0.7;
      this.mascot.leafGroup.rotation.z = Math.sin(this.elapsedTotal * 13.5) * 0.14;

      if (progress >= 1) {
        this.mascotPhase = 'pause';
        this.mascotTimer = 0;
        this.mascot.leftArm.rotation.x = 0;
        this.mascot.rightArm.rotation.x = 0;
        this.emitMascotUpdate(true);
      }
    }

    // Project head position for floating React speech bubble
    this.mascot.headAnchor.getWorldPosition(_vec3Proj);
    this.callbacks.onMascotScreenPos(this.projectToScreen(_vec3Proj));
  }

  private updateTilesAndAnimations(dt: number): void {
    const activeRoute = this.activeRouteId
      ? FOOD_ROUTES.find((r) => r.id === this.activeRouteId) ?? null
      : null;

    for (const tile of this.tiles.values()) {
      const isSelected = this.selectedTownId === tile.id;
      const isHovered = this.hoveredTownId === tile.id;
      const inRoute = activeRoute ? activeRoute.townIds.includes(tile.id) : false;

      tile.targetLift = isSelected
        ? 0.34
        : isHovered
          ? 0.2
          : inRoute
            ? 0.14
            : 0;

      tile.currentLift = THREE.MathUtils.damp(
        tile.currentLift,
        tile.targetLift,
        8.5,
        dt
      );

      // Gentle island bob for detached Guishan Island
      const islandBob =
        tile.id === 'guishan'
          ? Math.sin(this.elapsedTotal * 1.15) * 0.055
          : 0;
      tile.root.position.y = tile.baseY + tile.currentLift + islandBob;

      // Focus tinting when a food route is active
      const shouldDim = activeRoute !== null && !inRoute && !isSelected && !isHovered;
      const targetColor = shouldDim ? tile.dimColor : tile.baseColor;
      tile.topMaterial.color.lerp(targetColor, Math.min(1, dt * 7));

      // Crisp Rim Highlight
      const targetRimOpacity = isSelected
        ? 0.95
        : isHovered
          ? 0.85
          : inRoute
            ? 0.75
            : 0.0;
      tile.rimMaterial.opacity = THREE.MathUtils.damp(
        tile.rimMaterial.opacity,
        targetRimOpacity,
        9.0,
        dt
      );
      if (inRoute && activeRoute) {
        tile.rimMaterial.color.set(activeRoute.color);
      } else {
        tile.rimMaterial.color.set(TOWN_MAP[tile.id].accentColor);
      }

      // Animate steam puffs, bobbing boats, swaying lanterns, and lighthouse beacon
      for (const prop of tile.animatedProps) {
        if (prop.kind === 'steam') {
          const cycle = (this.elapsedTotal * prop.speed + prop.phase) % 1;
          prop.object.position.y = prop.baseY + cycle * 0.58;
          const s = 0.55 + Math.sin(cycle * Math.PI) * 0.75;
          prop.object.scale.setScalar(s);
        } else if (prop.kind === 'boat') {
          prop.object.position.y =
            prop.baseY + Math.sin(this.elapsedTotal * prop.speed + prop.phase) * 0.025;
          prop.object.rotation.z =
            Math.cos(this.elapsedTotal * prop.speed * 0.85 + prop.phase) * 0.05;
        } else if (prop.kind === 'lantern') {
          prop.object.rotation.z =
            Math.sin(this.elapsedTotal * prop.speed + prop.phase) * 0.09;
        } else if (prop.kind === 'beacon') {
          const pulse = 1 + Math.sin(this.elapsedTotal * prop.speed) * 0.16;
          prop.object.scale.setScalar(pulse);
        }
      }
    }

    // Update traveling light beads along active Food Route beams
    if (this.activeRouteBeam) {
      const { curves, beads } = this.activeRouteBeam;
      const totalSegments = curves.length;
      if (totalSegments > 0) {
        for (const bead of beads) {
          const globalT = (this.elapsedTotal * bead.speed + bead.offset) % 1;
          const scaled = globalT * totalSegments;
          const segIdx = Math.min(Math.floor(scaled), totalSegments - 1);
          const localT = scaled - segIdx;
          curves[segIdx].getPointAt(localT, bead.mesh.position);
        }
      }
    }

    // Drift instanced low-poly clouds smoothly across the Lanyang sky
    for (let i = 0; i < this.cloudData.length; i++) {
      const c = this.cloudData[i];
      c.x += c.speed * dt;
      if (c.x > 17) c.x = -17;
      _dummy.position.set(c.x, c.y + Math.sin(this.elapsedTotal * 0.5 + i) * 0.08, c.z);
      _dummy.scale.set(c.sx, c.sy, c.sz);
      _dummy.updateMatrix();
      this.cloudInstancedMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.cloudInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateCamera(dt: number): void {
    if (this.followMascot) {
      _vec3A.copy(this.mascot.root.position).add(new THREE.Vector3(0, 0.45, 0));
      _vec3B.copy(_vec3A).add(new THREE.Vector3(3.8, 4.4, 4.8));
      this.controls.target.lerp(_vec3A, 1 - Math.exp(-5.0 * dt));
      this.camera.position.lerp(_vec3B, 1 - Math.exp(-3.6 * dt));
    } else if (this.cameraGoalPos && this.cameraGoalTarget) {
      const alpha = 1 - Math.exp(-5.5 * dt);
      this.camera.position.lerp(this.cameraGoalPos, alpha);
      this.controls.target.lerp(this.cameraGoalTarget, alpha);
      if (
        this.camera.position.distanceTo(this.cameraGoalPos) < 0.06 &&
        this.controls.target.distanceTo(this.cameraGoalTarget) < 0.06
      ) {
        this.cameraGoalPos = null;
        this.cameraGoalTarget = null;
      }
    }

    this.controls.update();
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.isDisposed) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.1);

      if (!this.isPaused) {
        this.elapsedTotal += dt;
        this.oceanTimeUniform.value = this.elapsedTotal;

        // Smoothly damp time-of-day lighting
        let timeDiff = this.targetTimeOfDay - this.currentTimeOfDay;
        if (Math.abs(timeDiff) > 12) {
          timeDiff = timeDiff > 0 ? timeDiff - 24 : timeDiff + 24;
        }
        if (Math.abs(timeDiff) > 0.002) {
          this.currentTimeOfDay =
            (((this.currentTimeOfDay + timeDiff * (1 - Math.exp(-7 * dt))) % 24) + 24) % 24;
          this.applyTimeOfDayLighting(this.currentTimeOfDay);
        }

        this.updateTilesAndAnimations(dt);
        this.updateMascot(dt);
        this.updateCamera(dt);

        // Keep hovered town floating tag anchored if camera moves
        if (this.hoveredTownId) {
          const t = this.tiles.get(this.hoveredTownId);
          if (t) {
            const proj = this.projectToScreen(
              _vec3Proj.set(t.worldPos.x, t.surfaceY + 1.15, t.worldPos.z)
            );
            this.callbacks.onHoverTown(this.hoveredTownId, proj);
          }
        }

        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = requestAnimationFrame(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    dom.removeEventListener('pointermove', this.handlePointerMove);
    dom.removeEventListener('pointerup', this.handlePointerUp);
    dom.removeEventListener('webglcontextlost', this.handleContextLost);
    dom.removeEventListener('webglcontextrestored', this.handleContextRestored);
    window.removeEventListener('resize', this.handleResize);
    this.controls.removeEventListener('start', this.handleOrbitStart);
    this.controls.dispose();

    this.texturesToDispose.forEach((tex) => tex.dispose());
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });

    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}

export { MAINLAND_TOWN_IDS };
