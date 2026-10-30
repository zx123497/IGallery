/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import PropTypes from "prop-types";
import {useFrame} from "@react-three/fiber";
import {useTexture, Html} from "@react-three/drei";
import WallLabel from "./WallLabel";
import THEMES from "../themes";
import {useGalleryStore, getGalleryState} from "../store";
import {runtime, markActive} from "../runtime";
import {openDetail} from "../actions";
import {lightPoolTexture, haloTexture} from "../textures";

export const PAINTING_HEIGHT = 2.0;
const FRAME = 0.045;
const MAT = 0.13;
const LABEL_GAP = 0.22;
// Within this distance the full resolution image replaces the preview.
const SHARP_DISTANCE = 7;

const textureLoader = new THREE.TextureLoader();

const usePaintingTexture = (artwork, anchor) => {
  const preview = useTexture(artwork.previewUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  });
  const [sharp, setSharp] = React.useState(null);
  const requested = React.useRef(false);

  useFrame(() => {
    if (requested.current) return;
    const near = Math.hypot(runtime.player.position.x - anchor[0], runtime.player.position.z - anchor[2]) < SHARP_DISTANCE;
    if (!near && getGalleryState().detailId !== artwork.id) return;
    requested.current = true;
    textureLoader.load(artwork.url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      setSharp(texture);
      markActive();
    });
  });
  return sharp || preview;
};

/**
 * A framed artwork with its wall light, focus glow and label.
 * @return {Painting} painting
 */
const Painting = ({artwork, placement, anchor, floating = false}) => {
  const texture = usePaintingTexture(artwork, anchor || placement.position);
  const themeId = useGalleryStore((state) => state.theme);
  const focusedId = useGalleryStore((state) => state.focusedId);
  const hovered = useGalleryStore((state) => state.hoveredId === artwork.id);
  const theme = THEMES[themeId];
  const focused = focusedId === artwork.id;
  const pool = React.useRef();
  const halo = React.useRef();

  const image = texture.image;
  const width = (PAINTING_HEIGHT * image.width) / image.height;
  const outerWidth = width + (MAT + FRAME) * 2;
  const outerHeight = PAINTING_HEIGHT + (MAT + FRAME) * 2;

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 4);
    // the room dims around the focused piece and its own light comes up
    const poolGoal = theme.poolStrength * (focused ? 1.35 : focusedId ? 0.3 : 1);
    const haloGoal = focused ? 0.32 : 0;
    let changed = false;
    if (pool.current) {
      const material = pool.current.material;
      if (Math.abs(material.opacity - poolGoal) > 0.003) {
        material.opacity = THREE.MathUtils.lerp(material.opacity, poolGoal, k);
        changed = true;
      }
    }
    const haloMaterial = halo.current.material;
    if (Math.abs(haloMaterial.opacity - haloGoal) > 0.003) {
      haloMaterial.opacity = THREE.MathUtils.lerp(haloMaterial.opacity, haloGoal, k);
      halo.current.visible = haloMaterial.opacity > 0.01;
      changed = true;
    }
    if (changed) markActive(100);
  });

  const handleOver = (event) => {
    event.stopPropagation();
    if (getGalleryState().mode !== "explore") return;
    getGalleryState().set({hoveredId: artwork.id});
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    if (getGalleryState().hoveredId === artwork.id) getGalleryState().set({hoveredId: null});
    document.body.style.cursor = "";
  };
  const handleClick = (event) => {
    event.stopPropagation();
    // ignore the click that ends a camera drag
    if (event.delta > 6 || getGalleryState().mode !== "explore" || getGalleryState().phase !== "explore") return;
    document.body.style.cursor = "";
    openDetail(artwork.id);
  };

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      {!floating && (
        <mesh ref={pool} position={[0, 0.55, -0.045]} renderOrder={1}>
          <planeGeometry args={[outerWidth * 2.4, 5]} />
          <meshBasicMaterial map={lightPoolTexture()} color={theme.pool} transparent opacity={theme.poolStrength} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <mesh ref={halo} position={[0, 0, -0.04]} visible={false} renderOrder={2}>
        <planeGeometry args={[outerWidth * 1.9, outerHeight * 1.6]} />
        <meshBasicMaterial map={haloTexture()} color={theme.glow} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
        {/* frame */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[outerWidth, outerHeight, 0.06]} />
          <meshStandardMaterial color={theme.frame} roughness={0.45} metalness={0.15} />
        </mesh>
        {/* passe-partout */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[width + MAT * 2, PAINTING_HEIGHT + MAT * 2]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[width, PAINTING_HEIGHT]} />
          <meshStandardMaterial map={texture} roughness={0.7} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={floating ? 0.35 : 0.12} />
        </mesh>
        {floating && (
          // a floating piece shows the artwork on both faces
          <group rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 0, 0.051]}>
              <planeGeometry args={[width + MAT * 2, PAINTING_HEIGHT + MAT * 2]} />
              <meshStandardMaterial color="#f4f1ea" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0, 0.053]}>
              <planeGeometry args={[width, PAINTING_HEIGHT]} />
              <meshStandardMaterial map={texture} roughness={0.7} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.35} />
            </mesh>
          </group>
        )}
      </group>
      <WallLabel
        artwork={artwork}
        colors={theme.label}
        position={[outerWidth / 2 + LABEL_GAP, -outerHeight / 2, placement.labelDepth || 0.01]}
        visible={focused}
      />
      {hovered && !focused && (
        <Html position={[outerWidth / 2, outerHeight / 2, 0.05]} zIndexRange={[20, 0]} style={{pointerEvents: "none"}}>
          <div className="gallery-hover-card">
            <div className="gallery-hover-card__title">{artwork.title}</div>
            <div className="gallery-hover-card__hint">點擊查看作品細節</div>
          </div>
        </Html>
      )}
    </group>
  );
};

Painting.propTypes = {
  artwork: PropTypes.object.isRequired,
  placement: PropTypes.shape({
    position: PropTypes.arrayOf(PropTypes.number).isRequired,
    rotationY: PropTypes.number.isRequired,
    // how far the wall label stands off the wall
    labelDepth: PropTypes.number,
  }).isRequired,
  // world position used for distance checks when the painting sits inside a moving group
  anchor: PropTypes.arrayOf(PropTypes.number),
  floating: PropTypes.bool,
};

export default Painting;
