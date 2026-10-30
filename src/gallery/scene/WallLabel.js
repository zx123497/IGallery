/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import PropTypes from "prop-types";
import {useFrame} from "@react-three/fiber";
import {markActive} from "../runtime";

// A museum wall label: title on top, a thin rule, then the 作者 / 角色 / 描述 rows.
export const LABEL_WIDTH = 1.3;
const PIXELS_PER_METER = 800;
const CANVAS_WIDTH = Math.round(LABEL_WIDTH * PIXELS_PER_METER);
const PADDING = 54;
const TITLE_SIZE = 68;
const ROW_SIZE = 40;
const ROW_HEIGHT = 60;
const SERIF = "\"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif";
const SANS = "\"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", sans-serif";
const EMPTY = "--";

// Breaks text into lines that fit maxWidth. Splits per character so CJK text wraps too.
const wrapText = (context, text, maxWidth) => {
  const lines = [];
  let line = "";
  [...text].forEach((char) => {
    if (line && context.measureText(line + char).width > maxWidth) {
      lines.push(line);
      line = "";
    }
    line += char;
  });
  lines.push(line);
  return lines;
};

const drawLabel = ({title, rows, colors}) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const innerWidth = CANVAS_WIDTH - PADDING * 2;

  context.font = `600 ${TITLE_SIZE}px ${SERIF}`;
  const titleLines = wrapText(context, title || EMPTY, innerWidth);
  context.font = `500 ${ROW_SIZE}px ${SANS}`;
  const keyWidth = context.measureText("描述　").width;
  const wrapped = rows.map(([key, value]) => [key, wrapText(context, value || EMPTY, innerWidth - keyWidth)]);
  const rowLines = wrapped.reduce((count, [, lines]) => count + lines.length, 0);

  const titleBlock = titleLines.length * TITLE_SIZE * 1.3;
  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.round(PADDING * 2 + titleBlock + 34 + rowLines * ROW_HEIGHT);

  context.fillStyle = colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.textBaseline = "top";
  context.fillStyle = colors.text;
  context.font = `600 ${TITLE_SIZE}px ${SERIF}`;
  titleLines.forEach((line, i) => context.fillText(line, PADDING, PADDING + i * TITLE_SIZE * 1.3));

  let y = PADDING + titleBlock + 10;
  context.fillStyle = colors.rule;
  context.fillRect(PADDING, y, 56, 3);
  y += 24;

  wrapped.forEach(([key, lines]) => {
    context.font = `500 ${ROW_SIZE}px ${SANS}`;
    context.fillStyle = colors.muted;
    context.fillText(key, PADDING, y);
    context.fillStyle = colors.text;
    lines.forEach((line) => {
      context.fillText(line, PADDING + keyWidth, y);
      y += ROW_HEIGHT;
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return {texture, height: canvas.height / PIXELS_PER_METER};
};

// Canvas text needs the web fonts loaded first, otherwise it falls back silently.
const useFontsReady = () => {
  const [ready, setReady] = React.useState(() => !document.fonts || document.fonts.status === "loaded");
  React.useEffect(() => {
    if (ready || !document.fonts) return undefined;
    let cancelled = false;
    Promise.all([
      document.fonts.load(`600 ${TITLE_SIZE}px "Noto Serif TC"`, "作品"),
      document.fonts.load(`500 ${ROW_SIZE}px "Noto Sans TC"`, "作者"),
    ]).finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);
  return ready;
};

/**
 * The bottom-left corner sits at `position`. Fades in while `visible` is true.
 * @return {WallLabel} wall label
 */
const WallLabel = ({artwork, colors, position, visible}) => {
  const mesh = React.useRef();
  const fontsReady = useFontsReady();
  // redrawn once the web fonts arrive, so the first frame may use a fallback font
  const {texture, height} = React.useMemo(
      () => drawLabel({
        title: artwork.title,
        rows: [["作者", artwork.author], ["角色", artwork.character], ["描述", artwork.description]],
        colors,
        fontsReady,
      }),
      [artwork, colors, fontsReady],
  );
  React.useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, delta) => {
    const material = mesh.current.material;
    const goal = visible ? 1 : 0;
    if (material.opacity === goal) return;
    material.opacity = THREE.MathUtils.lerp(material.opacity, goal, 1 - Math.exp(-Math.min(delta, 0.1) * 5));
    if (Math.abs(material.opacity - goal) < 0.01) material.opacity = goal;
    mesh.current.visible = material.opacity > 0.01;
    // slide up a touch as it appears
    mesh.current.position.y = position[1] + height / 2 - (1 - material.opacity) * 0.05;
    markActive(100);
  });

  return (
    <mesh ref={mesh} position={[position[0] + LABEL_WIDTH / 2, position[1] + height / 2, position[2]]} visible={false}>
      <planeGeometry args={[LABEL_WIDTH, height]} />
      <meshBasicMaterial map={texture} transparent opacity={0} toneMapped={false} />
    </mesh>
  );
};

WallLabel.propTypes = {
  artwork: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  visible: PropTypes.bool,
};

export default WallLabel;
