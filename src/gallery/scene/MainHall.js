/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import THEMES, {SEASONS} from "../themes";
import ARTWORKS from "../artworks";
import {ROOMS} from "../layout";
import {PLATFORM, PORTAL} from "../layout/mainHall";
import {useGalleryStore} from "../store";
import Painting from "./Painting";
import Portal from "./Portal";
import GraffitiWall from "./GraffitiWall";
import Ball from "./Ball";
import Outdoors from "./Outdoors";
import {Floor, Ceiling, PerimeterWalls, SouthWall, WindowLight, Partitions, Benches, Platform} from "./Architecture";

const FEATURED = ARTWORKS.find((artwork) => artwork.featured) || ARTWORKS[0];
const FLOAT_HEIGHT = 2.35;
const FEATURE_ANCHOR = [PLATFORM.center[0], FLOAT_HEIGHT, PLATFORM.center[1]];
const FEATURE_PLACEMENT = {position: [0, 0, 0], rotationY: 0};

// The featured piece hovers and slowly turns above the central platform.
// It stops animating while it is off screen.
const FloatingFeature = () => {
  const group = React.useRef();
  const frustum = React.useMemo(() => new THREE.Frustum(), []);
  const matrix = React.useMemo(() => new THREE.Matrix4(), []);
  const bounds = React.useMemo(() => new THREE.Sphere(new THREE.Vector3(...FEATURE_ANCHOR), 2), []);
  useFrame(({camera, clock}) => {
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    if (!frustum.intersectsSphere(bounds)) return;
    const time = clock.elapsedTime;
    group.current.position.y = FLOAT_HEIGHT + Math.sin(time * 0.8) * 0.12;
    group.current.rotation.y = time * 0.25;
  });
  return (
    <group ref={group} position={FEATURE_ANCHOR}>
      <Painting artwork={FEATURED} placement={FEATURE_PLACEMENT} anchor={FEATURE_ANCHOR} floating />
    </group>
  );
};

const MainHall = () => {
  const themeId = useGalleryStore((state) => state.theme);
  const seasonId = useGalleryStore((state) => state.season);
  const weather = useGalleryStore((state) => state.weather);
  const quality = useGalleryStore((state) => state.resolvedQuality());
  const theme = THEMES[themeId];
  const room = ROOMS.main;

  return (
    <group>
      <Floor theme={theme} reflective={theme.reflective && quality === "high"} />
      <Ceiling theme={theme} />
      <PerimeterWalls theme={theme} />
      <SouthWall theme={theme} />
      <WindowLight color={SEASONS[seasonId].light} strength={weather === "rain" ? 0.12 : 0.28} />
      <Partitions theme={theme} />
      <Benches themeId={themeId} />
      <Platform theme={theme} />
      <FloatingFeature />
      <Portal placement={PORTAL} colors={["#3b2a7a", "#7fd8ff"]} label="→ 懸浮展廳" />
      <GraffitiWall />
      <Ball />
      <Outdoors />
      <React.Suspense fallback={null}>
        {room.artworks.map(({artwork, placement}) => (
          <Painting key={artwork.id} artwork={artwork} placement={placement} />
        ))}
      </React.Suspense>
    </group>
  );
};

export default MainHall;
