/* eslint-disable react/no-unknown-property, react/prop-types */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {SEASONS} from "../themes";
import {useGalleryStore} from "../store";
import {markActive} from "../runtime";

// The world outside the south window and door: sky, ground, trees, and weather
// particles. Particles only update while the window or door is on screen.
const PARTICLE_COUNTS = {high: 700, balanced: 380, low: 150};
const VOLUME = {minX: -18, maxX: 18, minY: 0, maxY: 12, minZ: 10.6, maxZ: 30};
// What the camera has to see for the particles to be worth animating.
const OPENINGS = new THREE.Box3(new THREE.Vector3(-14, 0, 9.5), new THREE.Vector3(14, 6, 12));

const RAIN_SKY = ["#6f7a86", "#a9b2ba"];

const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const Sky = ({top, bottom}) => {
  const uniforms = React.useMemo(() => ({
    topColor: {value: new THREE.Color()},
    bottomColor: {value: new THREE.Color()},
  }), []);
  uniforms.topColor.value.set(top);
  uniforms.bottomColor.value.set(bottom);
  return (
    <mesh position={[0, 22, 70]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[220, 70]} />
      <shaderMaterial
        uniforms={uniforms}
        depthWrite={false}
        vertexShader={"varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"}
        fragmentShader={"uniform vec3 topColor; uniform vec3 bottomColor; varying vec2 vUv; void main() { gl_FragColor = vec4(mix(bottomColor, topColor, smoothstep(0.25, 0.9, vUv.y)), 1.0); }"}
      />
    </mesh>
  );
};

const Trees = ({foliage, bare}) => {
  const trees = React.useMemo(() => {
    const random = seeded(5);
    return Array.from({length: 34}, () => ({
      x: -45 + random() * 90,
      z: 15 + random() * 40,
      height: 2.5 + random() * 3.5,
      crown: 1.2 + random() * 1.4,
      shade: Math.floor(random() * 3),
    }));
  }, []);
  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, tree.height / 2, 0]}>
            <cylinderGeometry args={[0.12, 0.2, tree.height, 6]} />
            <meshStandardMaterial color="#5b4636" roughness={1} fog={false} />
          </mesh>
          {!bare && (
            <mesh position={[0, tree.height + tree.crown * 0.4, 0]}>
              <icosahedronGeometry args={[tree.crown, 0]} />
              <meshStandardMaterial color={foliage[tree.shade]} roughness={0.9} flatShading fog={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

const PARTICLE_STYLE = {
  rain: {size: [0.012, 0.55], color: "#b9cde0", fall: 13, sway: 0, spin: 0, glow: false},
  snow: {size: [0.07, 0.07], color: "#ffffff", fall: 1.1, sway: 0.6, spin: 0, glow: false},
  petal: {size: [0.09, 0.065], color: "#f7b6cc", fall: 0.9, sway: 1, spin: 2.2, glow: false},
  leaf: {size: [0.14, 0.09], color: "#e07a32", fall: 1.4, sway: 1.2, spin: 2.8, glow: false},
  firefly: {size: [0.05, 0.05], color: "#fff3a0", fall: 0, sway: 0.4, spin: 0, glow: true},
};

const Particles = ({kind, count}) => {
  const mesh = React.useRef();
  const style = PARTICLE_STYLE[kind];
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const frustum = React.useMemo(() => new THREE.Frustum(), []);
  const matrix = React.useMemo(() => new THREE.Matrix4(), []);
  const particles = React.useMemo(() => {
    const random = seeded(17);
    return Array.from({length: count}, () => ({
      x: VOLUME.minX + random() * (VOLUME.maxX - VOLUME.minX),
      y: VOLUME.minY + random() * (VOLUME.maxY - VOLUME.minY),
      z: VOLUME.minZ + random() * (VOLUME.maxZ - VOLUME.minZ),
      phase: random() * Math.PI * 2,
      speed: 0.7 + random() * 0.6,
    }));
  }, [count]);

  useFrame(({camera, clock}, delta) => {
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    if (!frustum.intersectsBox(OPENINGS)) return;
    const dt = Math.min(delta, 0.1);
    const time = clock.elapsedTime;
    particles.forEach((p, i) => {
      if (style.fall) {
        p.y -= style.fall * p.speed * dt;
        if (p.y < VOLUME.minY) p.y = VOLUME.maxY;
      } else {
        // fireflies drift around a home position
        p.y = 0.6 + ((i * 0.37) % 3) + Math.sin(time * 0.6 + p.phase) * 0.4;
      }
      const sway = Math.sin(time * p.speed + p.phase) * style.sway;
      dummy.position.set(p.x + sway, p.y, p.z + (kind === "rain" ? 0 : Math.cos(time * 0.7 + p.phase) * style.sway * 0.5));
      dummy.rotation.set(time * style.spin * p.speed + p.phase, p.phase + time * style.spin * 0.5, kind === "rain" ? 0.12 : 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    markActive(120);
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={style.size} />
      <meshBasicMaterial color={style.color} side={THREE.DoubleSide} transparent opacity={kind === "rain" ? 0.55 : 0.95} toneMapped={!style.glow} depthWrite={false} />
    </instancedMesh>
  );
};

const Outdoors = () => {
  const seasonId = useGalleryStore((state) => state.season);
  const weather = useGalleryStore((state) => state.weather);
  const quality = useGalleryStore((state) => state.resolvedQuality());
  const season = SEASONS[seasonId];
  const raining = weather === "rain";
  const snowing = weather === "snow" || seasonId === "winter";
  const sky = raining ? RAIN_SKY : season.sky;
  const kind = raining ? "rain" : weather === "snow" ? "snow" : season.particle;
  const ground = snowing ? SEASONS.winter.ground : raining ? new THREE.Color(season.ground).multiplyScalar(0.7).getStyle() : season.ground;

  return (
    <group>
      <Sky top={sky[1]} bottom={sky[0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 45]}>
        <planeGeometry args={[220, 70]} />
        <meshStandardMaterial color={ground} roughness={1} fog={false} />
      </mesh>
      {/* path from the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.01, 16]}>
        <planeGeometry args={[3.2, 12]} />
        <meshStandardMaterial color="#b9b2a6" roughness={1} fog={false} />
      </mesh>
      <Trees foliage={snowing ? SEASONS.winter.foliage : season.foliage} bare={false} />
      <Particles key={`${kind}-${quality}`} kind={kind} count={PARTICLE_COUNTS[quality]} />
    </group>
  );
};

export default Outdoors;
