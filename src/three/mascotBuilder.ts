import * as THREE from 'three';

export interface ScallionMascotRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leafGroup: THREE.Group;
  snackProp: THREE.Group;
  headAnchor: THREE.Object3D;
}

/**
 * Builds the composite 3D "三星蔥小旅人" (Sanxing Scallion Little Traveler) character.
 * Pivoted cleanly at bottom-center (y = 0) with 12 distinct sculpted parts:
 * white bulbous scallion torso, forked vivid-green scallion stalks, glossy eyes,
 * rosy cheeks, tilted woven straw hat, traveler scarf, leather backpack, articulated
 * walking legs & waving arms, and a crispy scallion-pancake snack prop!
 */
export function buildScallionMascot(): ScallionMascotRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const whiteBulbMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5eb,
    roughness: 0.58,
    metalness: 0.02,
  });
  const stemTransitionMat = new THREE.MeshStandardMaterial({
    color: 0x9ed477,
    roughness: 0.55,
    metalness: 0.02,
  });
  const greenLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2f944d,
    roughness: 0.48,
    metalness: 0.04,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0xe6632e,
    roughness: 0.78,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0xe3c07d,
    roughness: 0.85,
  });
  const backpackMat = new THREE.MeshStandardMaterial({
    color: 0x8f5634,
    roughness: 0.78,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x162028,
    roughness: 0.15,
    metalness: 0.2,
  });
  const cheekMat = new THREE.MeshStandardMaterial({
    color: 0xf59a8e,
    roughness: 0.7,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a24,
    roughness: 0.75,
  });

  // 1. Articulated Legs (bottom-grounded at y = 0)
  const legGeo = new THREE.CapsuleGeometry(0.055, 0.08, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, bootMat);
  leftLeg.position.set(-0.09, 0.095, 0);
  leftLeg.castShadow = true;

  const rightLeg = new THREE.Mesh(legGeo, bootMat);
  rightLeg.position.set(0.09, 0.095, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(leftLeg, rightLeg);

  // 2. Plump White Scallion Bulb Torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), whiteBulbMat);
  torso.scale.set(1.0, 1.18, 0.95);
  torso.position.set(0, 0.37, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // 3. Light-green neck collar transitioning into scallion stalk
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.18, 12), stemTransitionMat);
  neck.position.set(0, 0.62, 0);
  neck.castShadow = true;
  bodyGroup.add(neck);

  // 4. Expressive Face (eyes + catchlights + rosy cheeks)
  for (const sx of [-0.075, 0.075]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
    eye.position.set(sx, 0.44, 0.195);
    bodyGroup.add(eye);

    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), cheekMat);
    cheek.scale.set(1.2, 0.7, 0.4);
    cheek.position.set(sx * 1.65, 0.39, 0.18);
    bodyGroup.add(cheek);
  }

  // Cute smile arc
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.009, 6, 10, Math.PI),
    eyeMat
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.395, 0.202);
  bodyGroup.add(smile);

  // 5. Orange Traveler Scarf around waist/neck
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.038, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 0.26, 0);
  scarf.castShadow = true;
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.03), scarfMat);
  scarfTail.position.set(0.12, 0.19, 0.15);
  scarfTail.rotation.z = 0.25;
  bodyGroup.add(scarf, scarfTail);

  // 6. Forked Vivid-Green Scallion Leaf Sprouts (wobbles playfully when walking!)
  const leafGroup = new THREE.Group();
  leafGroup.position.set(0, 0.69, 0);
  bodyGroup.add(leafGroup);

  const leafMain = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.42, 8), greenLeafMat);
  leafMain.position.set(-0.04, 0.18, 0);
  leafMain.rotation.z = 0.18;
  leafMain.castShadow = true;

  const leafSide = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.34, 8), greenLeafMat);
  leafSide.position.set(0.06, 0.14, 0.02);
  leafSide.rotation.z = -0.34;
  leafSide.castShadow = true;

  const leafBack = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.26, 7), greenLeafMat);
  leafBack.position.set(0.01, 0.11, -0.05);
  leafBack.rotation.x = -0.28;
  leafGroup.add(leafMain, leafSide, leafBack);

  // 7. Jaunty Tilted Traveler Straw Hat perched on one leaf side
  const hatGroup = new THREE.Group();
  hatGroup.position.set(-0.08, 0.1, 0.03);
  hatGroup.rotation.set(0.1, 0, 0.28);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.024, 14), hatMat);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 12), hatMat);
  crown.position.y = 0.05;
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.132, 0.03, 12), scarfMat);
  ribbon.position.y = 0.02;
  hatGroup.add(brim, crown, ribbon);
  leafGroup.add(hatGroup);

  // 8. Explorer Leather Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.13), backpackMat);
  pack.position.set(0, 0.38, -0.22);
  pack.castShadow = true;
  const packFlap = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.07, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x6e3f23, roughness: 0.72 })
  );
  packFlap.position.set(0, 0.47, -0.22);
  bodyGroup.add(pack, packFlap);

  // 9. Articulated Left & Right Arms (right arm holds a crispy golden scallion pancake!)
  const armGeo = new THREE.CapsuleGeometry(0.04, 0.12, 4, 8);
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, 0.41, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, whiteBulbMat);
  leftArmMesh.position.set(-0.04, -0.05, 0);
  leftArmMesh.rotation.z = -0.35;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22, 0.41, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, whiteBulbMat);
  rightArmMesh.position.set(0.04, -0.05, 0);
  rightArmMesh.rotation.z = 0.35;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Crispy Golden Scallion Pancake Snack Prop (shown when waving/eating!)
  const snackProp = new THREE.Group();
  const pancake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.025, 10),
    new THREE.MeshStandardMaterial({ color: 0xe6a642, roughness: 0.65 })
  );
  const speckMat = new THREE.MeshStandardMaterial({ color: 0x2e8c45, roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const speck = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.025), speckMat);
    speck.position.set(Math.cos(i * 1.6) * 0.04, 0.005, Math.sin(i * 1.6) * 0.04);
    snackProp.add(speck);
  }
  snackProp.add(pancake);
  snackProp.rotation.x = Math.PI / 3;
  snackProp.position.set(0.08, 0.02, 0.08);
  snackProp.visible = false;
  rightArm.add(snackProp);
  bodyGroup.add(rightArm);

  // Anchor above head for clean 2D speech bubble projection
  const headAnchor = new THREE.Object3D();
  headAnchor.position.set(0, 1.32, 0);
  root.add(headAnchor);

  return {
    root,
    bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leafGroup,
    snackProp,
    headAnchor,
  };
}
