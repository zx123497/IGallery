import * as THREE from "three";

// Procedural textures drawn once on a canvas and cached. Keeping them grayscale
// lets each theme tint them through the material color.
const cache = new Map();

const cached = (key, create) => {
  if (!cache.has(key)) cache.set(key, create());
  return cache.get(key);
};

const makeCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return [canvas, canvas.getContext("2d")];
};

// Cheap seeded random so textures look the same on every load.
const seededRandom = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const toTexture = (canvas, {repeat = [1, 1], color = true} = {}) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const speckle = (context, size, random, count, alpha) => {
  for (let i = 0; i < count; i++) {
    const shade = Math.floor(random() * 255);
    context.fillStyle = `rgba(${shade},${shade},${shade},${alpha * random()})`;
    context.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
};

const blotches = (context, size, random, count, alpha) => {
  for (let i = 0; i < count; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = size * (0.05 + random() * 0.2);
    const gradient = context.createRadialGradient(x, y, 0, x, y, r);
    const shade = random() > 0.5 ? 255 : 0;
    gradient.addColorStop(0, `rgba(${shade},${shade},${shade},${alpha})`);
    gradient.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
    context.fillStyle = gradient;
    context.fillRect(x - r, y - r, r * 2, r * 2);
  }
};

export const plasterTexture = () => cached("plaster", () => {
  const size = 512;
  const [canvas, context] = makeCanvas(size, size);
  const random = seededRandom(11);
  context.fillStyle = "#e6e6e6";
  context.fillRect(0, 0, size, size);
  blotches(context, size, random, 60, 0.05);
  speckle(context, size, random, 9000, 0.08);
  return toTexture(canvas, {repeat: [3, 1]});
});

export const concreteTexture = () => cached("concrete", () => {
  const size = 1024;
  const [canvas, context] = makeCanvas(size, size);
  const random = seededRandom(23);
  context.fillStyle = "#dcdcdc";
  context.fillRect(0, 0, size, size);
  blotches(context, size, random, 140, 0.07);
  speckle(context, size, random, 30000, 0.1);
  // large poured-concrete slabs
  context.strokeStyle = "rgba(0,0,0,0.18)";
  context.lineWidth = 2;
  for (let i = 0; i <= 2; i++) {
    context.beginPath();
    context.moveTo(0, (i * size) / 2);
    context.lineTo(size, (i * size) / 2);
    context.moveTo((i * size) / 2, 0);
    context.lineTo((i * size) / 2, size);
    context.stroke();
  }
  return toTexture(canvas, {repeat: [5, 5]});
});

export const woodTexture = () => cached("wood", () => {
  const width = 1024;
  const height = 1024;
  const [canvas, context] = makeCanvas(width, height);
  const random = seededRandom(37);
  const plankHeight = height / 8;
  for (let row = 0; row < 8; row++) {
    let x = -random() * 300;
    while (x < width) {
      const length = 260 + random() * 260;
      const base = 190 + random() * 50;
      context.fillStyle = `rgb(${base},${base},${base})`;
      context.fillRect(x, row * plankHeight, length, plankHeight);
      // grain lines
      for (let g = 0; g < 14; g++) {
        const y = row * plankHeight + random() * plankHeight;
        context.strokeStyle = `rgba(60,40,20,${0.05 + random() * 0.08})`;
        context.lineWidth = 1 + random() * 2;
        context.beginPath();
        context.moveTo(x, y);
        context.bezierCurveTo(x + length * 0.3, y + random() * 6 - 3, x + length * 0.7, y + random() * 6 - 3, x + length, y);
        context.stroke();
      }
      context.fillStyle = "rgba(0,0,0,0.35)";
      context.fillRect(x, row * plankHeight, 2, plankHeight);
      x += length;
    }
    context.fillStyle = "rgba(0,0,0,0.3)";
    context.fillRect(0, row * plankHeight, width, 2);
  }
  return toTexture(canvas, {repeat: [4, 4]});
});

// Soft radial falloff, used for light pools, blob shadows and glows.
export const radialTexture = () => cached("radial", () => {
  const size = 256;
  const [canvas, context] = makeCanvas(size, size);
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});

// A cone of wall-washer light: bright at the top, spreading and fading downward.
export const lightPoolTexture = () => cached("pool", () => {
  const width = 256;
  const height = 512;
  const [canvas, context] = makeCanvas(width, height);
  const image = context.createImageData(width, height);
  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < height; y++) {
    const t = y / height;
    // the cone widens as it falls from the fixture
    const spread = 0.18 + 0.78 * Math.sqrt(t);
    const vertical = smooth(0, 0.06, t) * (1 - smooth(0.5, 1, t)) * (1 - t * 0.35);
    for (let x = 0; x < width; x++) {
      const u = Math.abs(x / width - 0.5) * 2;
      const alpha = vertical * (1 - smooth(spread * 0.35, spread, u));
      const i = (y * width + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(alpha * 255);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});

// Rounded-rectangle glow for the halo behind a focused frame.
export const haloTexture = () => cached("halo", () => {
  const size = 256;
  const [canvas, context] = makeCanvas(size, size);
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // distance outside the inner rectangle, in texture units
      const dx = Math.max(0, Math.abs(x / size - 0.5) - 0.24);
      const dy = Math.max(0, Math.abs(y / size - 0.5) - 0.24);
      const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / 0.26);
      const i = (y * size + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(falloff * falloff * 255);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});

export const footprintTexture = () => cached("footprint", () => {
  const width = 64;
  const height = 128;
  const [canvas, context] = makeCanvas(width, height);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.ellipse(width / 2, height * 0.38, width * 0.3, height * 0.28, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(width / 2, height * 0.82, width * 0.24, height * 0.14, 0, 0, Math.PI * 2);
  context.fill();
  return new THREE.CanvasTexture(canvas);
});
