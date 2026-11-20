import * as THREE from 'three';

/**
 * Generates a subtle tactile clay/paper micro-grain texture for low-poly hex terrain.
 * Keeps the handcrafted tabletop diorama feel with zero external image dependencies.
 */
export function createDioramaGrainTexture(
  renderer: THREE.WebGLRenderer,
  baseHex: string,
  accentHex?: string
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle organic rice-field / terrain bands
  if (accentHex) {
    ctx.fillStyle = accentHex;
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 6; i++) {
      const y = (i / 6) * size;
      ctx.fillRect(0, y, size, size / 14);
    }
    ctx.globalAlpha = 1;
  }

  // Deterministic tactile paper-clay speckles
  let seed = baseHex.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 17, 13);
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 1400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.8 + rand() * 1.8;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
    ctx.fillRect(x, y, r, r);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

/**
 * Generates a crisp night-market signboard texture (e.g., 羅東夜市) for miniature landmarks.
 */
export function createSignboardTexture(
  renderer: THREE.WebGLRenderer,
  text: string,
  bgColor: string,
  textColor: string,
  borderColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 96);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 80);

  ctx.fillStyle = textColor;
  ctx.font = '700 42px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

/**
 * Creates a soft radial contact shadow texture for grounding floating props and mascot.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(12, 24, 34, 0.42)');
  grad.addColorStop(0.55, 'rgba(12, 24, 34, 0.16)');
  grad.addColorStop(1, 'rgba(12, 24, 34, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
