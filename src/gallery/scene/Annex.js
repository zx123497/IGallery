/* eslint-disable react/no-unknown-property, react/prop-types */
import * as React from "react";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {MeshReflectorMaterial, useTexture} from "@react-three/drei";
import ARTWORKS, {ARTWORKS_BY_ID} from "../artworks";
import {ROOMS} from "../layout";
import {RADIUS, PROJECTION, PORTAL} from "../layout/annex";
import {useGalleryStore, getGalleryState} from "../store";
import {markActive} from "../runtime";
import Painting from "./Painting";
import Portal from "./Portal";

const WALL_HEIGHT = 7;
const PROJECTOR_HEIGHT = 6.4;
const CYCLE_MS = 7000;

// One artwork hovering above its glowing pedestal disc.
const FloatingPiece = ({entry, index}) => {
  const group = React.useRef();
  const {placement} = entry;
  const frustum = React.useMemo(() => new THREE.Frustum(), []);
  const matrix = React.useMemo(() => new THREE.Matrix4(), []);
  const bounds = React.useMemo(() => new THREE.Sphere(new THREE.Vector3(...placement.position), 1.8), [placement]);
  useFrame(({camera, clock}) => {
    // pieces behind the camera don't need to bob
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    if (!frustum.intersectsSphere(bounds)) return;
    const time = clock.elapsedTime + index * 1.3;
    group.current.position.y = Math.sin(time * 0.7) * 0.1;
    group.current.rotation.y = Math.sin(time * 0.3) * 0.06;
  });
  return (
    <group>
      <group ref={group}>
        <Painting artwork={entry.artwork} placement={placement} floating />
      </group>
      <mesh position={[placement.position[0], 0.01, placement.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.55, 48]} />
        <meshBasicMaterial color="#9fdcff" toneMapped={false} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// A ceiling projector throwing the current artwork onto the floor disc. When
// nothing is in focus it cycles through the collection.
const Projector = () => {
  const spot = React.useRef();
  const target = React.useMemo(() => new THREE.Object3D(), []);
  const focusedId = useGalleryStore((state) => state.focusedId);
  const [cycleIndex, setCycleIndex] = React.useState(0);
  const artwork = focusedId ? ARTWORKS_BY_ID[focusedId] : ARTWORKS[cycleIndex % ARTWORKS.length];
  const texture = useTexture(artwork.previewUrl, (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
  });
  const gl = useThree((state) => state.gl);

  React.useEffect(() => {
    if (focusedId) return undefined;
    const timer = setInterval(() => setCycleIndex((i) => i + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [focusedId]);

  React.useEffect(() => {
    target.position.set(PROJECTION.center[0], 0, PROJECTION.center[1]);
    target.updateMatrixWorld();
    spot.current.target = target;
    // nothing in this room moves through the beam, so render its shadow map once per change
    spot.current.shadow.autoUpdate = false;
    spot.current.shadow.needsUpdate = true;
    gl.shadowMap.needsUpdate = true;
    markActive(1500);
  }, [target, texture, gl]);

  return (
    <group>
      <spotLight
        ref={spot}
        position={[PROJECTION.center[0], PROJECTOR_HEIGHT, PROJECTION.center[1]]}
        angle={0.36}
        penumbra={0.15}
        distance={12}
        decay={1.2}
        intensity={22}
        map={texture}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <primitive object={target} />
      {/* the visible beam */}
      <mesh position={[PROJECTION.center[0], PROJECTOR_HEIGHT / 2, PROJECTION.center[1]]}>
        <coneGeometry args={[PROJECTION.radius, PROJECTOR_HEIGHT, 48, 1, true]} />
        <meshBasicMaterial color="#cfe9ff" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[PROJECTION.center[0], PROJECTOR_HEIGHT + 0.15, PROJECTION.center[1]]}>
        <cylinderGeometry args={[0.25, 0.3, 0.3, 24]} />
        <meshStandardMaterial color="#202024" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

const Stars = () => {
  const geometry = React.useMemo(() => {
    const positions = [];
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = RADIUS * 0.98;
      positions.push(Math.sin(phi) * Math.cos(theta) * r, WALL_HEIGHT + Math.cos(phi) * r * 0.5, Math.sin(phi) * Math.sin(theta) * r);
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return buffer;
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#dfe8ff" size={0.05} sizeAttenuation toneMapped={false} />
    </points>
  );
};

const Annex = () => {
  const quality = useGalleryStore((state) => state.resolvedQuality());
  const room = ROOMS.annex;

  React.useEffect(() => {
    getGalleryState().set({focusedId: null});
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[RADIUS, 96]} />
        {quality === "high" ? (
          <MeshReflectorMaterial color="#0e0d14" roughness={0.9} metalness={0.4} blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={2} mirror={0.7} />
        ) : (
          <meshStandardMaterial color="#121119" roughness={0.4} />
        )}
      </mesh>
      {/* projection disc and guide rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <circleGeometry args={[PROJECTION.radius, 64]} />
        <meshStandardMaterial color="#8d8b99" roughness={0.9} />
      </mesh>
      {[PROJECTION.radius + 0.06, RADIUS - 0.25].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <ringGeometry args={[radius, radius + 0.03, 128]} />
          <meshBasicMaterial color="#7fd8ff" toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
      <mesh position={[0, WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS, WALL_HEIGHT, 96, 1, true]} />
        <meshStandardMaterial color="#17151f" roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* vertical light slits around the wall */}
      {Array.from({length: 24}, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(angle) * (RADIUS - 0.02), WALL_HEIGHT / 2, Math.cos(angle) * (RADIUS - 0.02)]} rotation={[0, angle + Math.PI, 0]}>
            <planeGeometry args={[0.04, WALL_HEIGHT * 0.8]} />
            <meshBasicMaterial color="#6f7dff" toneMapped={false} transparent opacity={0.55} />
          </mesh>
        );
      })}
      <mesh position={[0, WALL_HEIGHT, 0]}>
        <sphereGeometry args={[RADIUS, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#07070c" side={THREE.BackSide} />
      </mesh>
      <Stars />
      <React.Suspense fallback={null}>
        <Projector />
        {room.artworks.map((entry, index) => (
          <FloatingPiece key={entry.artwork.id} entry={entry} index={index} />
        ))}
      </React.Suspense>
      <Portal placement={PORTAL} colors={["#7a3b2a", "#ffd27f"]} label="← 回到主展廳" />
    </group>
  );
};

export default Annex;
