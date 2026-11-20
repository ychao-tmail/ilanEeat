import * as THREE from 'three';
import { TownId } from '../data/yilanData';
import { createSignboardTexture } from './proceduralTextures';

export interface AnimatedProp {
  object: THREE.Object3D;
  kind: 'steam' | 'boat' | 'lantern' | 'beacon';
  baseY: number;
  phase: number;
  speed: number;
}

export interface LandmarkBuildResult {
  group: THREE.Group;
  nightEmissiveMaterials: {
    material: THREE.MeshStandardMaterial;
    maxIntensity: number;
  }[];
  animatedProps: AnimatedProp[];
  soapboxPosition: THREE.Vector3;
}

/** Shared low-poly pine / broadleaf tree builder (3-4 composite parts, grounded at y=0) */
function createMiniTree(
  scale = 1,
  foliageHex = 0x3b7d47,
  style: 'pine' | 'round' | 'sakura' = 'pine'
): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6e4f3a,
    roughness: 0.9,
    metalness: 0.0,
  });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * scale, 0.065 * scale, 0.24 * scale, 6),
    trunkMat
  );
  trunk.position.y = 0.12 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: style === 'sakura' ? 0xf2a7ba : foliageHex,
    roughness: 0.78,
    metalness: 0.02,
    flatShading: true,
  });

  if (style === 'pine') {
    const cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.22 * scale, 0.36 * scale, 6),
      leafMat
    );
    cone1.position.y = 0.34 * scale;
    cone1.castShadow = true;
    const cone2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.16 * scale, 0.28 * scale, 6),
      leafMat
    );
    cone2.position.y = 0.52 * scale;
    cone2.castShadow = true;
    g.add(cone1, cone2);
  } else {
    const crown1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2 * scale, 0),
      leafMat
    );
    crown1.position.y = 0.34 * scale;
    crown1.castShadow = true;
    const crown2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.13 * scale, 0),
      leafMat
    );
    crown2.position.set(0.1 * scale, 0.42 * scale, 0.06 * scale);
    crown2.castShadow = true;
    g.add(crown1, crown2);
  }

  return g;
}

/** Wooden soapbox / tasting podium where the Scallion Traveler pauses to wave */
function createSoapbox(x: number, z: number): THREE.Group {
  const box = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb57c4a,
    roughness: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x7c4e29,
    roughness: 0.75,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.32), woodMat);
  base.position.y = 0.055;
  base.castShadow = true;
  base.receiveShadow = true;
  const topLip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.36), trimMat);
  topLip.position.y = 0.115;
  topLip.castShadow = true;
  box.add(base, topLip);
  box.position.set(x, 0, z);
  return box;
}

/** Glowing festive lantern (red or warm amber) */
function createLantern(
  colorHex: number,
  radius: number,
  emissiveList: { material: THREE.MeshStandardMaterial; maxIntensity: number }[]
): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.05,
    roughness: 0.42,
    metalness: 0.05,
  });
  emissiveList.push({ material: mat, maxIntensity: 2.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), mat);
  body.scale.set(1, 1.25, 1);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2a1d17,
    roughness: 0.6,
    metalness: 0.4,
  });
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.45, radius * 0.55, radius * 0.35, 6),
    capMat
  );
  topCap.position.y = radius * 1.2;
  const botCap = topCap.clone();
  botCap.position.y = -radius * 1.2;
  g.add(body, topCap, botCap);
  return g;
}

/** Mini low-poly fishing / whale-watching boat */
function createMiniBoat(
  hullColor: number,
  cabinColor: number,
  emissiveList: { material: THREE.MeshStandardMaterial; maxIntensity: number }[]
): THREE.Group {
  const boat = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColor,
    roughness: 0.6,
    metalness: 0.1,
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: cabinColor,
    roughness: 0.5,
  });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xfff0b3,
    emissive: new THREE.Color(0xffca63),
    emissiveIntensity: 0.05,
    roughness: 0.25,
    metalness: 0.2,
  });
  emissiveList.push({ material: winMat, maxIntensity: 1.8 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.52), hullMat);
  hull.position.y = 0.05;
  hull.castShadow = true;

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.z = Math.PI / 4;
  bow.position.set(0, 0.055, 0.33);
  bow.scale.set(1.1, 1, 0.42);
  bow.castShadow = true;

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.22), cabinMat);
  cabin.position.set(0, 0.17, -0.02);
  cabin.castShadow = true;

  const win = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.06, 0.12), winMat);
  win.position.set(0, 0.19, 0.04);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.015, 0.24, 5),
    new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.6, roughness: 0.4 })
  );
  mast.position.set(0, 0.32, -0.05);

  boat.add(hull, bow, cabin, win, mast);
  return boat;
}

/** Rising soft steam puffs for hot springs / geothermal */
function createSteamCluster(
  x: number,
  y: number,
  z: number,
  count: number,
  animatedProps: AnimatedProp[]
): THREE.Group {
  const g = new THREE.Group();
  const steamMat = new THREE.MeshStandardMaterial({
    color: 0xf6fbff,
    roughness: 0.95,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });

  for (let i = 0; i < count; i++) {
    const puff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.075 + (i % 2) * 0.03, 0),
      steamMat
    );
    const angle = (i / count) * Math.PI * 2;
    puff.position.set(
      x + Math.cos(angle) * 0.12,
      y + i * 0.12,
      z + Math.sin(angle) * 0.12
    );
    g.add(puff);
    animatedProps.push({
      object: puff,
      kind: 'steam',
      baseY: y,
      phase: i * 1.35,
      speed: 0.75 + (i % 3) * 0.15,
    });
  }
  return g;
}

/**
 * Builds the bespoke composite 3D miniature landmark for each of the 13 Yilan hex tiles.
 * All geometry sits cleanly at local y = 0 (top surface of the hex tile).
 */
export function buildTownLandmark(
  townId: TownId,
  renderer: THREE.WebGLRenderer
): LandmarkBuildResult {
  const group = new THREE.Group();
  const nightEmissiveMaterials: {
    material: THREE.MeshStandardMaterial;
    maxIntensity: number;
  }[] = [];
  const animatedProps: AnimatedProp[] = [];
  let soapboxPosition = new THREE.Vector3(0.68, 0.13, 0.56);

  const warmWindowMat = () => {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffefc2,
      emissive: new THREE.Color(0xffb84d),
      emissiveIntensity: 0.04,
      roughness: 0.3,
      metalness: 0.15,
    });
    nightEmissiveMaterials.push({ material: m, maxIntensity: 2.0 });
    return m;
  };

  switch (townId) {
    case 'toucheng': {
      // Lanyang Museum iconic tilted asymmetric basalt-and-glass pyramid + Wushi Harbor surfboards & boat
      const museumGroup = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x4b5c66,
        roughness: 0.78,
        metalness: 0.12,
        flatShading: true,
      });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7cb7cc,
        emissive: new THREE.Color(0xffe19c),
        emissiveIntensity: 0.03,
        roughness: 0.18,
        metalness: 0.55,
      });
      nightEmissiveMaterials.push({ material: glassMat, maxIntensity: 1.1 });

      const prism = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.88, 4), stoneMat);
      prism.scale.set(1.2, 1.0, 0.8);
      prism.rotation.set(0.28, Math.PI / 5, -0.34);
      prism.position.set(-0.22, 0.34, -0.18);
      prism.castShadow = true;
      prism.receiveShadow = true;

      const glassStrip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.18), glassMat);
      glassStrip.rotation.set(0.22, Math.PI / 5, -0.34);
      glassStrip.position.set(-0.08, 0.25, -0.02);
      museumGroup.add(prism, glassStrip);
      group.add(museumGroup);

      // Wushi Harbor pond + wooden pier
      const harborWater = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.04, 12),
        new THREE.MeshStandardMaterial({
          color: 0x3b8ea5,
          roughness: 0.18,
          metalness: 0.25,
        })
      );
      harborWater.position.set(0.52, 0.02, 0.24);
      group.add(harborWater);

      const boat = createMiniBoat(0xe8eef2, 0xd64e34, nightEmissiveMaterials);
      boat.position.set(0.56, 0.04, 0.28);
      boat.rotation.y = -0.6;
      boat.scale.setScalar(0.85);
      group.add(boat);
      animatedProps.push({ object: boat, kind: 'boat', baseY: 0.04, phase: 0.3, speed: 1.4 });

      // Colorful surfboards standing on the beach
      const surfColors = [0xf27d3b, 0x2ec4b6, 0xf7c948];
      surfColors.forEach((hex, idx) => {
        const board = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.05, 0.28, 4, 6),
          new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.1 })
        );
        board.scale.set(1, 1, 0.3);
        board.position.set(-0.7 + idx * 0.14, 0.18, 0.45);
        board.rotation.z = -0.15 + idx * 0.12;
        board.castShadow = true;
        group.add(board);
      });

      const tree = createMiniTree(0.85, 0x488b54, 'round');
      tree.position.set(-0.78, 0, -0.36);
      group.add(tree);

      soapboxPosition = new THREE.Vector3(-0.05, 0.13, 0.72);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'jiaoxi': {
      // Timber Hot Spring Bathhouse + Steaming Pool + Scallion Pancake Stall Cart
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a4e32, roughness: 0.85 });
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e4d0, roughness: 0.8 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b444d, roughness: 0.65, metalness: 0.15 });

      const bathBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.44, 0.64), wallMat);
      bathBody.position.set(-0.24, 0.22, -0.26);
      bathBody.castShadow = true;
      bathBody.receiveShadow = true;

      const bathRoof = new THREE.Mesh(new THREE.ConeGeometry(0.74, 0.34, 4), roofMat);
      bathRoof.rotation.y = Math.PI / 4;
      bathRoof.scale.set(1.15, 1, 0.92);
      bathRoof.position.set(-0.24, 0.6, -0.26);
      bathRoof.castShadow = true;

      const shojiWin = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.66), warmWindowMat());
      shojiWin.position.set(-0.24, 0.22, -0.26);

      // Hot spring rock rim & turquoise thermal pool
      const poolRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.085, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x7b7874, roughness: 0.92, flatShading: true })
      );
      poolRim.rotation.x = Math.PI / 2;
      poolRim.position.set(0.42, 0.06, -0.18);
      poolRim.castShadow = true;

      const poolWater = new THREE.Mesh(
        new THREE.CylinderGeometry(0.33, 0.33, 0.06, 10),
        new THREE.MeshStandardMaterial({
          color: 0x5cc5c9,
          emissive: new THREE.Color(0x2d7f87),
          emissiveIntensity: 0.15,
          roughness: 0.15,
          metalness: 0.2,
        })
      );
      poolWater.position.set(0.42, 0.05, -0.18);

      // Scallion Pancake Food Cart
      const cart = new THREE.Group();
      const cartBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.26, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xd96b27, roughness: 0.72 })
      );
      cartBody.position.y = 0.16;
      cartBody.castShadow = true;
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.06, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x2e7d52, roughness: 0.65 })
      );
      awning.position.y = 0.44;
      awning.rotation.x = 0.1;
      awning.castShadow = true;
      const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 5);
      for (const sx of [-0.2, 0.2]) {
        for (const sz of [-0.11, 0.11]) {
          const p = new THREE.Mesh(poleGeo, woodMat);
          p.position.set(sx, 0.32, sz);
          cart.add(p);
        }
      }
      const cartLantern = createLantern(0xffa93a, 0.055, nightEmissiveMaterials);
      cartLantern.position.set(0.24, 0.38, 0.16);
      cart.add(cartBody, awning, cartLantern);
      cart.position.set(-0.36, 0, 0.56);
      cart.rotation.y = 0.35;

      const steam = createSteamCluster(0.42, 0.14, -0.18, 4, animatedProps);
      const pine1 = createMiniTree(0.9, 0x3b7a4a, 'pine');
      pine1.position.set(-0.85, 0, 0.05);
      const pine2 = createMiniTree(0.75, 0x4d8c57, 'pine');
      pine2.position.set(0.78, 0, -0.58);

      group.add(bathBody, bathRoof, shojiWin, poolRim, poolWater, cart, steam, pine1, pine2);
      soapboxPosition = new THREE.Vector3(0.46, 0.13, 0.56);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'yilan': {
      // Historic Red-Brick Archway Gate + Old Street Shophouses + Steaming Meat Soup Stall
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xb04833, roughness: 0.82 });
      const tileMat = new THREE.MeshStandardMaterial({ color: 0x3f434a, roughness: 0.68 });
      const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xefe3cf, roughness: 0.8 });

      // Red brick arch gate
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.24), brickMat);
      pillarL.position.set(-0.32, 0.31, -0.12);
      pillarL.castShadow = true;
      const pillarR = pillarL.clone();
      pillarR.position.x = 0.32;
      const archBeam = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.28), brickMat);
      archBeam.position.set(0, 0.64, -0.12);
      archBeam.castShadow = true;
      const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(0.76, 0.26, 4), tileMat);
      gateRoof.rotation.y = Math.PI / 4;
      gateRoof.scale.set(1.25, 1, 0.6);
      gateRoof.position.set(0, 0.86, -0.12);
      gateRoof.castShadow = true;

      // Old street shophouse left & right
      const shopL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.46), stuccoMat);
      shopL.position.set(-0.62, 0.22, 0.26);
      shopL.castShadow = true;
      const shopRoofL = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.52), brickMat);
      shopRoofL.position.set(-0.62, 0.47, 0.26);
      const shopWinL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.48), warmWindowMat());
      shopWinL.position.set(-0.62, 0.2, 0.26);

      // Signboard
      const signTex = createSignboardTexture(renderer, '宜蘭舊城', '#8F2D21', '#FFE8B6', '#F2B84B');
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.16, 0.04),
        new THREE.MeshStandardMaterial({
          map: signTex,
          emissiveMap: signTex,
          emissive: new THREE.Color(0xffd28a),
          emissiveIntensity: 0.08,
          roughness: 0.4,
        })
      );
      nightEmissiveMaterials.push({
        material: signMesh.material as THREE.MeshStandardMaterial,
        maxIntensity: 1.35,
      });
      signMesh.position.set(0, 0.64, 0.03);

      // Hanging lanterns on the gate
      for (const lx of [-0.32, 0.32]) {
        const lan = createLantern(0xe8482e, 0.06, nightEmissiveMaterials);
        lan.position.set(lx, 0.48, 0.06);
        group.add(lan);
      }

      const tree = createMiniTree(0.85, 0x4d8a4b, 'round');
      tree.position.set(0.78, 0, -0.35);

      group.add(pillarL, pillarR, archBeam, gateRoof, shopL, shopRoofL, shopWinL, signMesh, tree);
      soapboxPosition = new THREE.Vector3(0.42, 0.13, 0.58);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'zhuangwei': {
      // Coastal Glass Cafe Pavilion + Cantaloupe Melon Patch
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c363f, roughness: 0.45, metalness: 0.65 });
      const glassMat = warmWindowMat();
      glassMat.color.setHex(0xdcf0f5);
      glassMat.roughness = 0.15;
      glassMat.metalness = 0.25;

      const cafeBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.1, 0.66),
        new THREE.MeshStandardMaterial({ color: 0xc29e75, roughness: 0.85 })
      );
      cafeBase.position.set(-0.18, 0.05, -0.22);
      cafeBase.receiveShadow = true;

      const cafeBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.52), glassMat);
      cafeBox.position.set(-0.18, 0.31, -0.22);
      cafeBox.castShadow = true;

      const cafeRoof = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.07, 0.68), frameMat);
      cafeRoof.position.set(-0.18, 0.55, -0.22);
      cafeRoof.rotation.z = -0.07;
      cafeRoof.castShadow = true;

      // Cantaloupe Melon patch rows
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x8f6b48, roughness: 0.94 });
      const melonMat = new THREE.MeshStandardMaterial({ color: 0xd9b36c, roughness: 0.72 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f8c47, roughness: 0.85 });

      for (let row = 0; row < 2; row++) {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.22), soilMat);
        ridge.position.set(-0.24, 0.04, 0.42 + row * 0.32);
        group.add(ridge);

        for (let m = 0; m < 3; m++) {
          const melon = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), melonMat);
          melon.position.set(-0.5 + m * 0.26, 0.12, 0.42 + row * 0.32);
          melon.castShadow = true;
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.06, 5), leafMat);
          leaf.position.set(-0.44 + m * 0.26, 0.11, 0.48 + row * 0.32);
          group.add(melon, leaf);
        }
      }

      const tree = createMiniTree(0.85, 0x5c9652, 'round');
      tree.position.set(0.68, 0, -0.45);
      group.add(cafeBase, cafeBox, cafeRoof, tree);

      soapboxPosition = new THREE.Vector3(0.58, 0.13, 0.46);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'yuanshan': {
      // Crystal Spring Pond + Red-Brick Distillery Hall + Cypress Grove
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xa44b39, roughness: 0.82 });
      const slateMat = new THREE.MeshStandardMaterial({ color: 0x3b4856, roughness: 0.65, metalness: 0.2 });

      const hall = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.46, 0.56), brickMat);
      hall.position.set(-0.22, 0.23, -0.26);
      hall.castShadow = true;

      const hallRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.45, 0.96, 4), slateMat);
      hallRoof.rotation.z = Math.PI / 2;
      hallRoof.rotation.x = Math.PI / 4;
      hallRoof.position.set(-0.22, 0.62, -0.26);
      hallRoof.castShadow = true;

      // Iconic pagoda chimney vent on distillery
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 6), brickMat);
      chimney.position.set(0.08, 0.78, -0.26);
      chimney.castShadow = true;

      const win = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.58), warmWindowMat());
      win.position.set(-0.22, 0.24, -0.26);

      // Spring Pond & tiny arched wooden bridge
      const pond = new THREE.Mesh(
        new THREE.CylinderGeometry(0.54, 0.54, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x4ca6b5, roughness: 0.15, metalness: 0.2 })
      );
      pond.position.set(0.32, 0.02, 0.42);
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.06, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xc24838, roughness: 0.7 })
      );
      bridge.position.set(0.32, 0.1, 0.42);
      bridge.rotation.y = 0.4;
      bridge.castShadow = true;

      const t1 = createMiniTree(0.95, 0x387846, 'pine');
      t1.position.set(-0.82, 0, 0.28);
      const t2 = createMiniTree(0.75, 0x4a8f54, 'pine');
      t2.position.set(0.72, 0, -0.35);

      group.add(hall, hallRoof, chimney, win, pond, bridge, t1, t2);
      soapboxPosition = new THREE.Vector3(-0.46, 0.13, 0.64);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'wujie': {
      // Traditional Arts Center Red-Brick Street + Curved Eave Hall + Duck Shed
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xb34d38, roughness: 0.84 });
      const darkRoof = new THREE.MeshStandardMaterial({ color: 0x3b3533, roughness: 0.72 });

      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.42, 0.46), brickMat);
      mainHall.position.set(-0.18, 0.21, -0.26);
      mainHall.castShadow = true;

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.3, 4), darkRoof);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.3, 1, 0.8);
      roof.position.set(-0.18, 0.56, -0.26);
      roof.castShadow = true;

      const win = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.48), warmWindowMat());
      win.position.set(-0.18, 0.2, -0.26);

      // Decorative red lanterns along old street
      for (let i = 0; i < 3; i++) {
        const lan = createLantern(0xe3422b, 0.055, nightEmissiveMaterials);
        lan.position.set(-0.45 + i * 0.27, 0.36, 0.04);
        group.add(lan);
      }

      // Traditional duck-smoking timber pavilion
      const shed = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.3, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x8f6241, roughness: 0.86 })
      );
      shed.position.set(0.52, 0.15, 0.24);
      shed.castShadow = true;
      const shedRoof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.2, 4), darkRoof);
      shedRoof.rotation.y = Math.PI / 4;
      shedRoof.position.set(0.52, 0.4, 0.24);
      shedRoof.castShadow = true;

      const t1 = createMiniTree(0.85, 0x4b8a4b, 'round');
      t1.position.set(-0.76, 0, 0.38);

      group.add(mainHall, roof, win, shed, shedRoof, t1);
      soapboxPosition = new THREE.Vector3(-0.15, 0.13, 0.66);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'luodong': {
      // Hero Landmark: Luodong Night Market Grand Red Lantern Archway + Glowing Stalls + Forestry Pond
      const redPillarMat = new THREE.MeshStandardMaterial({ color: 0xc42d23, roughness: 0.55, metalness: 0.12 });
      const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf2b84b, roughness: 0.35, metalness: 0.65 });

      // Grand Archway
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.78, 8), redPillarMat);
      pL.position.set(-0.48, 0.39, -0.05);
      pL.castShadow = true;
      const pR = pL.clone();
      pR.position.x = 0.48;

      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 0.2), redPillarMat);
      beam.position.set(0, 0.78, -0.05);
      beam.castShadow = true;

      const eave = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.3), goldTrimMat);
      eave.position.set(0, 0.9, -0.05);
      eave.castShadow = true;

      // Crisp illuminated signboard "羅東夜市"
      const signTex = createSignboardTexture(renderer, '羅東夜市', '#A91E1A', '#FFF2C6', '#F4C14F');
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex,
        emissiveMap: signTex,
        emissive: new THREE.Color(0xffc966),
        emissiveIntensity: 0.12,
        roughness: 0.35,
      });
      nightEmissiveMaterials.push({ material: signMat, maxIntensity: 1.9 });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.24, 0.06), signMat);
      sign.position.set(0, 0.78, 0.08);

      // Festive hanging lantern garland (5 bright lanterns)
      for (let i = -2; i <= 2; i++) {
        const lan = createLantern(i % 2 === 0 ? 0xff4b2b : 0xffb336, 0.065, nightEmissiveMaterials);
        lan.position.set(i * 0.24, 0.62 - Math.abs(i) * 0.025, 0.06);
        group.add(lan);
        animatedProps.push({
          object: lan,
          kind: 'lantern',
          baseY: lan.position.y,
          phase: i * 0.9,
          speed: 2.0,
        });
      }

      // Two Night Market Food Stalls behind archway
      const stallColors = [0xe87a35, 0x2d8a68];
      stallColors.forEach((hex, idx) => {
        const sx = idx === 0 ? -0.44 : 0.44;
        const stallBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.28, 0.36),
          new THREE.MeshStandardMaterial({ color: 0xf4e8d6, roughness: 0.75 })
        );
        stallBase.position.set(sx, 0.14, -0.58);
        stallBase.castShadow = true;
        const stallCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.07, 0.44),
          new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6 })
        );
        stallCanopy.position.set(sx, 0.42, -0.58);
        stallCanopy.castShadow = true;
        const bulb = createLantern(0xffd25a, 0.05, nightEmissiveMaterials);
        bulb.position.set(sx, 0.34, -0.38);
        group.add(stallBase, stallCanopy, bulb);
      });

      // Miniature Forestry Pond with floating logs
      const logPond = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.03, 10),
        new THREE.MeshStandardMaterial({ color: 0x3c8999, roughness: 0.2 })
      );
      logPond.position.set(-0.56, 0.02, 0.56);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x734a2d, roughness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6), logMat);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = 0.25;
        log.position.set(-0.56, 0.05, 0.46 + i * 0.09);
        group.add(log);
      }

      group.add(pL, pR, beam, eave, sign, logPond);
      soapboxPosition = new THREE.Vector3(0.46, 0.13, 0.58);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'sanxing': {
      // Lush Sanxing Scallion Farm Rows + Tiansongpi Nostalgic Blue Timber Station
      const stationWall = new THREE.MeshStandardMaterial({ color: 0x7db3c8, roughness: 0.78 });
      const stationRoof = new THREE.MeshStandardMaterial({ color: 0x46525c, roughness: 0.7 });

      const station = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.38, 0.46), stationWall);
      station.position.set(-0.26, 0.19, -0.32);
      station.castShadow = true;
      const stRoof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.28, 4), stationRoof);
      stRoof.rotation.y = Math.PI / 4;
      stRoof.scale.set(1.28, 1, 0.8);
      stRoof.position.set(-0.26, 0.52, -0.32);
      stRoof.castShadow = true;
      const stWin = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.48), warmWindowMat());
      stWin.position.set(-0.26, 0.2, -0.32);

      // Iconic Sanxing Scallion beds (crisp white stems + vivid green shoots)
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c4635, roughness: 0.94 });
      const whiteStemMat = new THREE.MeshStandardMaterial({ color: 0xf4f7ee, roughness: 0.55 });
      const greenLeafMat = new THREE.MeshStandardMaterial({ color: 0x2a944a, roughness: 0.52 });

      for (let row = 0; row < 3; row++) {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.22), soilMat);
        bed.position.set(-0.18, 0.045, 0.22 + row * 0.28);
        group.add(bed);
        for (let s = 0; s < 5; s++) {
          const sx = -0.56 + s * 0.19;
          const sz = 0.22 + row * 0.28;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.14, 5), whiteStemMat);
          stem.position.set(sx, 0.14, sz);
          const shoot = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 5), greenLeafMat);
          shoot.position.set(sx, 0.28, sz);
          shoot.castShadow = true;
          group.add(stem, shoot);
        }
      }

      const tree = createMiniTree(0.9, 0x3b8048, 'pine');
      tree.position.set(0.68, 0, -0.32);

      group.add(station, stRoof, stWin, tree);
      soapboxPosition = new THREE.Vector3(0.66, 0.13, 0.46);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'dongshan': {
      // Iconic Dongshan Curved Melon-Trellis Station Canopy + Tea Hills
      const archMat = new THREE.MeshStandardMaterial({
        color: 0xeaf2ef,
        roughness: 0.4,
        metalness: 0.35,
      });
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x3b8f64,
        roughness: 0.55,
        transparent: true,
        opacity: 0.88,
      });

      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.1, 0.54),
        new THREE.MeshStandardMaterial({ color: 0xb5b2a8, roughness: 0.85 })
      );
      platform.position.set(-0.08, 0.05, -0.22);
      platform.receiveShadow = true;
      group.add(platform);

      for (let i = 0; i < 4; i++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 6, 12, Math.PI), archMat);
        rib.position.set(-0.46 + i * 0.26, 0.1, -0.22);
        rib.rotation.y = Math.PI / 2;
        rib.castShadow = true;
        group.add(rib);
      }

      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.27, 0.86, 10, 1, true, 0, Math.PI),
        canopyMat
      );
      canopy.rotation.z = Math.PI / 2;
      canopy.position.set(-0.08, 0.1, -0.22);
      group.add(canopy);

      // Station warm lamp underneath canopy
      const lamp = createLantern(0xffe082, 0.055, nightEmissiveMaterials);
      lamp.position.set(-0.08, 0.26, -0.22);
      group.add(lamp);

      // Terraced Tea Bushes
      const teaMat = new THREE.MeshStandardMaterial({ color: 0x4b8f42, roughness: 0.82 });
      for (let t = 0; t < 3; t++) {
        const hedge = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.56, 4, 6), teaMat);
        hedge.rotation.z = Math.PI / 2;
        hedge.position.set(-0.34, 0.09, 0.34 + t * 0.22);
        hedge.castShadow = true;
        group.add(hedge);
      }

      const tree = createMiniTree(0.82, 0x3b7d47, 'round');
      tree.position.set(0.76, 0, -0.35);
      group.add(tree);

      soapboxPosition = new THREE.Vector3(0.56, 0.13, 0.52);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'suao': {
      // Iconic Nanfang'ao Crimson Single-Arch Steel Bridge + Harbor Water + Fishing Boat + Cold Spring Pavilion
      const harborWater = new THREE.Mesh(
        new THREE.BoxGeometry(1.36, 0.04, 0.72),
        new THREE.MeshStandardMaterial({ color: 0x2e7f99, roughness: 0.16, metalness: 0.25 })
      );
      harborWater.position.set(0, 0.02, -0.18);
      group.add(harborWater);

      const bridgeRed = new THREE.MeshStandardMaterial({
        color: 0xc9362b,
        roughness: 0.42,
        metalness: 0.45,
      });
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(1.24, 0.06, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x5c636a, roughness: 0.78 })
      );
      deck.position.set(0, 0.24, -0.18);
      deck.castShadow = true;

      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.045, 8, 18, Math.PI), bridgeRed);
      arch.position.set(0, 0.24, -0.18);
      arch.castShadow = true;

      // Vertical suspension cables
      const cableMat = new THREE.MeshStandardMaterial({ color: 0xe6e8eb, metalness: 0.6, roughness: 0.3 });
      for (const cx of [-0.34, -0.17, 0, 0.17, 0.34]) {
        const h = Math.sqrt(Math.max(0.01, 0.52 * 0.52 - cx * cx));
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 4), cableMat);
        cable.position.set(cx, 0.24 + h / 2, -0.18);
        group.add(cable);
      }

      // Bridge night accent lights
      for (const lx of [-0.46, 0.46]) {
        const l = createLantern(0xffc14d, 0.045, nightEmissiveMaterials);
        l.position.set(lx, 0.36, -0.06);
        group.add(l);
      }

      const boat = createMiniBoat(0xf0f4f7, 0x2d689c, nightEmissiveMaterials);
      boat.position.set(-0.36, 0.04, 0.48);
      boat.rotation.y = 0.7;
      boat.scale.setScalar(0.88);
      animatedProps.push({ object: boat, kind: 'boat', baseY: 0.04, phase: 1.8, speed: 1.3 });

      group.add(deck, arch, boat);
      soapboxPosition = new THREE.Vector3(0.56, 0.13, 0.54);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'datong': {
      // Qingshui Geothermal Steaming Egg-Boiling Pool + Bamboo Baskets + Mountain Peak & Sakura
      const peakMat = new THREE.MeshStandardMaterial({
        color: 0x45754e,
        roughness: 0.88,
        flatShading: true,
      });
      const peak1 = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.92, 6), peakMat);
      peak1.position.set(-0.46, 0.46, -0.34);
      peak1.castShadow = true;
      const peak2 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.64, 6), peakMat);
      peak2.position.set(0.12, 0.32, -0.52);
      peak2.castShadow = true;

      // Geothermal stone pool
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.09, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x73706a, roughness: 0.92, flatShading: true })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0.32, 0.07, 0.08);

      const boilingPool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.06, 10),
        new THREE.MeshStandardMaterial({
          color: 0x73d1d9,
          emissive: new THREE.Color(0x3a919e),
          emissiveIntensity: 0.2,
          roughness: 0.15,
        })
      );
      boilingPool.position.set(0.32, 0.05, 0.08);

      // Tiny bamboo egg-boiling basket
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.12, 7),
        new THREE.MeshStandardMaterial({ color: 0xc9a15b, roughness: 0.85 })
      );
      basket.position.set(0.24, 0.13, 0.12);
      const egg = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xfff8eb, roughness: 0.4 })
      );
      egg.position.set(0.24, 0.19, 0.12);

      const steam = createSteamCluster(0.32, 0.16, 0.08, 5, animatedProps);
      const sakura = createMiniTree(0.92, 0xf2a7ba, 'sakura');
      sakura.position.set(-0.62, 0, 0.42);
      const pine = createMiniTree(0.8, 0x356942, 'pine');
      pine.position.set(0.75, 0, -0.34);

      const lamp = createLantern(0xffb84d, 0.055, nightEmissiveMaterials);
      lamp.position.set(-0.1, 0.24, 0.44);

      group.add(peak1, peak2, rim, boilingPool, basket, egg, steam, sakura, pine, lamp);
      soapboxPosition = new THREE.Vector3(-0.08, 0.13, 0.68);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'nanao': {
      // Coastal Cliff Ridge + Nostalgic Jianhua Wooden Ice Parlor + Warm Lantern
      const cliffMat = new THREE.MeshStandardMaterial({ color: 0x67756d, roughness: 0.9, flatShading: true });
      const cliff = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.72, 5), cliffMat);
      cliff.position.set(-0.52, 0.36, -0.35);
      cliff.castShadow = true;

      // Nostalgic Timber Ice Shop
      const shopBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.4, 0.52),
        new THREE.MeshStandardMaterial({ color: 0xd9c2a3, roughness: 0.82 })
      );
      shopBody.position.set(0.18, 0.2, -0.14);
      shopBody.castShadow = true;

      const shopRoof = new THREE.Mesh(
        new THREE.ConeGeometry(0.64, 0.26, 4),
        new THREE.MeshStandardMaterial({ color: 0x326e7a, roughness: 0.65 })
      );
      shopRoof.rotation.y = Math.PI / 4;
      shopRoof.scale.set(1.2, 1, 0.85);
      shopRoof.position.set(0.18, 0.52, -0.14);
      shopRoof.castShadow = true;

      const shopWin = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.54), warmWindowMat());
      shopWin.position.set(0.18, 0.2, -0.14);

      // Giant decorative ice-bowl sign sculpture in front
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.07, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b8ea5, roughness: 0.4 })
      );
      bowl.position.set(-0.56, 0.06, 0.44);
      const shavedIce = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.14, 8),
        new THREE.MeshStandardMaterial({ color: 0xfefcf5, roughness: 0.75 })
      );
      shavedIce.position.set(-0.56, 0.16, 0.44);

      const lan = createLantern(0xffb84d, 0.055, nightEmissiveMaterials);
      lan.position.set(0.56, 0.36, 0.15);

      const tree = createMiniTree(0.85, 0x3d7d52, 'pine');
      tree.position.set(0.78, 0, -0.46);

      group.add(cliff, shopBody, shopRoof, shopWin, bowl, shavedIce, lan, tree);
      soapboxPosition = new THREE.Vector3(0.2, 0.13, 0.62);
      group.add(createSoapbox(soapboxPosition.x, soapboxPosition.z));
      break;
    }

    case 'guishan': {
      // Iconic Guishan Island Twin Volcanic Turtle Peaks + White Lighthouse + Whale-Watching Boat!
      const volcanoMat = new THREE.MeshStandardMaterial({
        color: 0x4c7c52,
        roughness: 0.85,
        flatShading: true,
      });
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x5c5c58,
        roughness: 0.9,
        flatShading: true,
      });

      // Main Turtle Shell Peak (401 Highlands)
      const shellPeak = new THREE.Mesh(new THREE.ConeGeometry(0.76, 1.05, 7), volcanoMat);
      shellPeak.position.set(-0.22, 0.52, -0.08);
      shellPeak.castShadow = true;
      shellPeak.receiveShadow = true;

      // Turtle Head Peak (east cliff)
      const headPeak = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.62, 6), rockMat);
      headPeak.position.set(0.58, 0.31, -0.02);
      headPeak.rotation.z = -0.14;
      headPeak.castShadow = true;

      // Tail spit sandbar (west)
      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.54, 5),
        new THREE.MeshStandardMaterial({ color: 0xc9b489, roughness: 0.9 })
      );
      tail.rotation.z = Math.PI / 2;
      tail.position.set(-0.92, 0.08, 0.18);

      // White Coastal Lighthouse with glowing rotating beacon
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.085, 0.38, 8),
        new THREE.MeshStandardMaterial({ color: 0xf7f9fa, roughness: 0.55 })
      );
      tower.position.set(0.56, 0.72, -0.02);
      tower.castShadow = true;

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: new THREE.Color(0xffd75e),
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      nightEmissiveMaterials.push({ material: beaconMat, maxIntensity: 2.8 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), beaconMat);
      beacon.position.set(0.56, 0.94, -0.02);
      animatedProps.push({ object: beacon, kind: 'beacon', baseY: 0.94, phase: 0, speed: 2.2 });

      // Whale-watching boat cruising just off the edge
      const whaleBoat = createMiniBoat(0xffffff, 0x267996, nightEmissiveMaterials);
      whaleBoat.position.set(-0.35, 0.04, 0.78);
      whaleBoat.rotation.y = 0.9;
      whaleBoat.scale.setScalar(0.8);
      animatedProps.push({ object: whaleBoat, kind: 'boat', baseY: 0.04, phase: 0.5, speed: 1.5 });

      group.add(shellPeak, headPeak, tail, tower, beacon, whaleBoat);
      soapboxPosition = new THREE.Vector3(0.2, 0.12, 0.65);
      break;
    }
  }

  return {
    group,
    nightEmissiveMaterials,
    animatedProps,
    soapboxPosition,
  };
}
