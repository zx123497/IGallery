/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import THEMES from "../themes";
import {ROOMS} from "../layout";
import {useGalleryStore, getGalleryState} from "../store";
import {markActive} from "../runtime";

const SPOT_INTENSITY = 38;
// How much the rest of the room dims while a painting is in focus.
const FOCUS_DIM = 0.45;

// Static fill light for the room, plus one real spotlight that follows the
// focused painting. Every other painting is lit by a baked light-pool decal.
const Lighting = () => {
  const themeId = useGalleryStore((state) => state.theme);
  const roomId = useGalleryStore((state) => state.room);
  const theme = THEMES[themeId];
  const ambient = React.useRef();
  const hemisphere = React.useRef();
  const key = React.useRef();
  const spot = React.useRef();
  const target = React.useMemo(() => new THREE.Object3D(), []);
  const dim = React.useRef(1);

  React.useEffect(() => {
    spot.current.target = target;
  }, [target]);

  useFrame((_, delta) => {
    const state = getGalleryState();
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 3);
    const roomScale = roomId === "annex" ? 0.45 : 1;
    const dimGoal = state.focusedId ? FOCUS_DIM : 1;
    if (Math.abs(dim.current - dimGoal) > 0.002) {
      dim.current = THREE.MathUtils.lerp(dim.current, dimGoal, k);
      markActive(100);
    }
    ambient.current.intensity = theme.ambient * dim.current * roomScale;
    hemisphere.current.intensity = theme.hemisphere[2] * dim.current * roomScale;
    key.current.intensity = theme.key * dim.current * roomScale;

    const entry = state.focusedId && ROOMS[roomId].artworks.find((item) => item.artwork.id === state.focusedId);
    if (entry) {
      const {position, normal} = entry.placement;
      spot.current.position.set(position[0] + normal[0] * 2.4, position[1] + 2.6, position[2] + normal[1] * 2.4);
      target.position.set(position[0], position[1], position[2]);
      target.updateMatrixWorld();
    }
    const spotGoal = entry ? SPOT_INTENSITY : 0;
    if (Math.abs(spot.current.intensity - spotGoal) > 0.05) {
      spot.current.intensity = THREE.MathUtils.lerp(spot.current.intensity, spotGoal, k);
      markActive(100);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} color="#ffffff" />
      <hemisphereLight ref={hemisphere} args={[theme.hemisphere[0], theme.hemisphere[1], theme.hemisphere[2]]} />
      <directionalLight ref={key} position={[-6, 12, 8]} color="#fff4e6" />
      <spotLight ref={spot} angle={0.36} penumbra={0.75} distance={9} decay={2} intensity={0} color={theme.pool} />
      <primitive object={target} />
    </>
  );
};

export default Lighting;
