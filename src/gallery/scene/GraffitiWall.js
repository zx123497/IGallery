/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {GRAFFITI} from "../layout/mainHall";
import {useGalleryStore, getGalleryState} from "../store";
import {markActive} from "../runtime";

const STORAGE_KEY = "igallery:graffiti";
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = Math.round((CANVAS_WIDTH * GRAFFITI.height) / GRAFFITI.width);
const PAPER = "#ebe7df";

const drawBase = (context) => {
  context.globalCompositeOperation = "source-over";
  context.fillStyle = PAPER;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = "rgba(0,0,0,0.06)";
  context.font = "700 120px \"Noto Sans TC\", sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("FREE WALL · 自由塗鴉牆", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
};

const save = (canvas) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, canvas.toDataURL("image/webp", 0.85));
  } catch (error) {
    // quota or private mode: the drawing just won't survive a reload
  }
};

// A wall the visitor can paint on. Strokes are drawn into a canvas texture at the
// pointer's UV coordinate on the wall mesh, and saved to localStorage.
const GraffitiWall = () => {
  const drawing = React.useRef(null);
  const clearToken = useGalleryStore((state) => state.graffitiClearToken);
  const active = useGalleryStore((state) => state.mode === "graffiti");
  const {canvas, context, texture} = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const context = canvas.getContext("2d");
    drawBase(context);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    let saved = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      saved = null;
    }
    if (saved) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0);
        texture.needsUpdate = true;
        markActive();
      };
      image.src = saved;
    }
    return {canvas, context, texture};
  }, []);

  React.useEffect(() => {
    if (!clearToken) return;
    drawBase(context);
    texture.needsUpdate = true;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // nothing to clear
    }
    markActive();
  }, [clearToken, context, texture]);

  React.useEffect(() => {
    if (!active) save(canvas);
  }, [active, canvas]);

  const toCanvas = (uv) => [uv.x * CANVAS_WIDTH, (1 - uv.y) * CANVAS_HEIGHT];

  const stroke = (from, to) => {
    const {color, size, eraser} = getGalleryState().graffiti;
    context.globalCompositeOperation = "source-over";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = eraser ? PAPER : color;
    context.lineWidth = eraser ? size * 2.5 : size;
    context.beginPath();
    context.moveTo(from[0], from[1]);
    context.lineTo(to[0], to[1]);
    context.stroke();
    if (!eraser) {
      // a little overspray makes it read as paint
      context.fillStyle = color;
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = size * (0.6 + Math.random() * 0.9);
        context.globalAlpha = 0.25;
        context.beginPath();
        context.arc(to[0] + Math.cos(angle) * radius, to[1] + Math.sin(angle) * radius, Math.random() * 1.8 + 0.4, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }
    texture.needsUpdate = true;
    markActive(500);
  };

  const handleDown = (event) => {
    if (getGalleryState().mode !== "graffiti" || !event.uv) return;
    event.stopPropagation();
    const point = toCanvas(event.uv);
    drawing.current = point;
    stroke(point, [point[0] + 0.1, point[1]]);
  };
  const handleMove = (event) => {
    if (!drawing.current || !event.uv) return;
    event.stopPropagation();
    const point = toCanvas(event.uv);
    stroke(drawing.current, point);
    drawing.current = point;
  };
  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = null;
    save(canvas);
  };

  return (
    <group position={GRAFFITI.position} rotation={[0, GRAFFITI.rotationY, 0]}>
      <mesh
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      >
        <planeGeometry args={[GRAFFITI.width, GRAFFITI.height]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
      {/* masking-tape border */}
      {[
        [0, GRAFFITI.height / 2, GRAFFITI.width + 0.1, 0.06],
        [0, -GRAFFITI.height / 2, GRAFFITI.width + 0.1, 0.06],
        [GRAFFITI.width / 2, 0, 0.06, GRAFFITI.height],
        [-GRAFFITI.width / 2, 0, 0.06, GRAFFITI.height],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.004]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#e8d9a8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

export default GraffitiWall;
