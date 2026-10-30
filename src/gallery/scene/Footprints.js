/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {runtime} from "../runtime";
import {useGalleryStore} from "../store";
import {footprintTexture} from "../textures";

const MAX_PRINTS = 160;
const LIFETIME_MS = 45000;
// Prints shrink away over the last part of their life.
const FADE_MS = 12000;
const COLORS = {night: "#cdb894", white: "#7d756b", warm: "#4a3020"};

// The trail of footprints the robot leaves behind.
const Footprints = () => {
  const mesh = React.useRef();
  const roomId = useGalleryStore((state) => state.room);
  const themeId = useGalleryStore((state) => state.theme);
  const dummy = React.useMemo(() => {
    const object = new THREE.Object3D();
    object.rotation.order = "YXZ";
    return object;
  }, []);
  const lastUpdate = React.useRef(0);

  useFrame(() => {
    const now = performance.now();
    // footprints change slowly; a few updates a second is plenty
    if (now - lastUpdate.current < 150) return;
    lastUpdate.current = now;
    let count = 0;
    runtime.footprints.forEach((print) => {
      const age = now - print.time;
      if (print.room !== roomId || age > LIFETIME_MS || count >= MAX_PRINTS) return;
      const scale = Math.min(1, (LIFETIME_MS - age) / FADE_MS);
      dummy.position.set(print.x, 0.008, print.z);
      dummy.rotation.set(-Math.PI / 2, print.heading + Math.PI, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(count, dummy.matrix);
      count++;
    });
    mesh.current.count = count;
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, MAX_PRINTS]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[0.14, 0.28]} />
      <meshBasicMaterial map={footprintTexture()} color={COLORS[themeId]} transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  );
};

export default Footprints;
