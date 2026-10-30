/* eslint-disable react/no-unknown-property, react/prop-types */
import * as React from "react";
import * as THREE from "three";
import {MeshReflectorMaterial} from "@react-three/drei";
import {runtime} from "../runtime";
import {plasterTexture, concreteTexture, woodTexture, radialTexture} from "../textures";
import {
  BOUNDARY, PERIMETER_WALLS, SOUTH_WALL, PARTITIONS, PARTITION_HEIGHT, PARTITION_THICKNESS,
  WALL_HEIGHT, BENCHES, BENCH_SIZE, PLATFORM, ARC,
} from "../layout/mainHall";

const BENCH_WOOD = {night: "#4a3426", white: "#d9c3a0", warm: "#7a4c2c"};

// A texture copy with its own repeat; copies share the source canvas.
const repeated = (texture, x, y) => {
  const copy = texture.clone();
  copy.repeat.set(x, y);
  copy.needsUpdate = true;
  return copy;
};

const segmentPose = (start, end) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  return {
    length: Math.hypot(dx, dz),
    mid: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
    // turns local +x onto the segment direction
    rotationY: Math.atan2(-dz, dx),
  };
};

// A mesh that fades out when it hides the robot from the camera.
const Occluder = ({children, ...props}) => {
  const ref = React.useRef();
  React.useEffect(() => {
    const mesh = ref.current;
    runtime.occluders.add(mesh);
    return () => runtime.occluders.delete(mesh);
  }, []);
  return <mesh ref={ref} {...props}>{children}</mesh>;
};

export const Floor = ({theme, reflective}) => {
  const geometry = React.useMemo(() => {
    const shape = new THREE.Shape(BOUNDARY.map(([x, z]) => new THREE.Vector2(x, -z)));
    return new THREE.ShapeGeometry(shape);
  }, []);
  const map = React.useMemo(
      () => repeated(theme.floorTexture === "wood" ? woodTexture() : concreteTexture(), 0.16, 0.16),
      [theme.floorTexture],
  );
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      {reflective ? (
        <MeshReflectorMaterial
          map={map}
          color={theme.floor}
          roughness={0.85}
          metalness={0.35}
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={1.6}
          mirror={0.6}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
        />
      ) : (
        <meshStandardMaterial map={map} color={theme.floor} roughness={theme.floorRoughness} />
      )}
    </mesh>
  );
};

export const Ceiling = ({theme}) => {
  const geometry = React.useMemo(() => {
    const shape = new THREE.Shape(BOUNDARY.map(([x, z]) => new THREE.Vector2(x, z)));
    return new THREE.ShapeGeometry(shape);
  }, []);
  // light strips that follow the curved wall, plus two straight runs
  const strips = React.useMemo(() => {
    const arcStrips = Array.from({length: 12}, (_, i) => {
      const angle = ARC.from + ((ARC.to - ARC.from) * (i + 0.5)) / 12;
      const radius = ARC.radius - 2.2;
      return {
        position: [ARC.center[0] + Math.sin(angle) * radius, ARC.center[1] - Math.cos(angle) * radius],
        rotationY: -angle,
        length: 1.25,
      };
    });
    return [
      ...arcStrips,
      {position: [-7.5, 3], rotationY: Math.PI / 2, length: 9},
      {position: [7.5, 3], rotationY: Math.PI / 2, length: 9},
    ];
  }, []);
  return (
    <group>
      <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
        <meshStandardMaterial color={theme.ceiling} roughness={1} />
      </mesh>
      {strips.map((strip, i) => (
        <mesh key={i} position={[strip.position[0], WALL_HEIGHT - 0.03, strip.position[1]]} rotation={[0, strip.rotationY, 0]}>
          <boxGeometry args={[strip.length, 0.04, 0.09]} />
          <meshBasicMaterial color={theme.dark ? "#ffe2b8" : "#ffffff"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

export const PerimeterWalls = ({theme}) => {
  const plaster = plasterTexture();
  const maps = React.useMemo(() => new Map(), []);
  const mapFor = (length) => {
    const key = Math.max(1, Math.round(length / 4));
    if (!maps.has(key)) maps.set(key, repeated(plaster, key, 1.2));
    return maps.get(key);
  };
  return (
    <group>
      {PERIMETER_WALLS.map((wall, i) => {
        const pose = segmentPose(wall.start, wall.end);
        const rotationY = Math.atan2(wall.normal[0], wall.normal[1]);
        return (
          <group key={i} position={[pose.mid[0], 0, pose.mid[1]]} rotation={[0, rotationY, 0]}>
            <mesh position={[0, WALL_HEIGHT / 2, 0]}>
              <planeGeometry args={[pose.length + 0.02, WALL_HEIGHT]} />
              <meshStandardMaterial map={mapFor(pose.length)} color={theme.wall} roughness={0.95} />
            </mesh>
            {/* shadow gap at the floor */}
            <mesh position={[0, 0.04, 0.004]}>
              <planeGeometry args={[pose.length + 0.02, 0.08]} />
              <meshBasicMaterial color={theme.trim} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// The south wall is built from boxes around a window and the entrance door, so it
// also reads correctly from outside during the entrance sequence.
export const SouthWall = ({theme}) => {
  const {thickness, window: win, door} = SOUTH_WALL;
  const z = SOUTH_WALL.start[1] + thickness / 2;
  const pieces = [
    [-14, win.from, 0, WALL_HEIGHT],
    [win.from, win.to, 0, win.bottom],
    [win.from, win.to, win.top, WALL_HEIGHT],
    [win.to, door.from, 0, WALL_HEIGHT],
    [door.from, door.to, door.top, WALL_HEIGHT],
    [door.to, 14, 0, WALL_HEIGHT],
  ];
  const plaster = React.useMemo(() => repeated(plasterTexture(), 2, 1), []);
  const sign = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    context.fillStyle = "#1a1714";
    context.fillRect(0, 0, 1024, 256);
    context.fillStyle = "#f2e6d0";
    context.font = "600 120px \"Noto Serif TC\", serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("IGallery", 512, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const windowWidth = win.to - win.from;
  const windowHeight = win.top - win.bottom;
  const windowCenter = [(win.from + win.to) / 2, (win.bottom + win.top) / 2];
  return (
    <group>
      {pieces.map(([x0, x1, y0, y1], i) => (
        <Occluder key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, z]}>
          <boxGeometry args={[x1 - x0, y1 - y0, thickness]} />
          <meshStandardMaterial map={plaster} color={theme.wall} roughness={0.95} />
        </Occluder>
      ))}
      {/* window glass and mullions */}
      <mesh position={[windowCenter[0], windowCenter[1], z]}>
        <planeGeometry args={[windowWidth, windowHeight]} />
        <meshStandardMaterial color="#cfe3f5" transparent opacity={0.1} roughness={0.05} metalness={0.2} depthWrite={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[windowCenter[0] + (side * windowWidth) / 6, windowCenter[1], z]}>
          <boxGeometry args={[0.06, windowHeight, 0.08]} />
          <meshStandardMaterial color={theme.trim} />
        </mesh>
      ))}
      <mesh position={[windowCenter[0], win.bottom - 0.02, z - 0.1]}>
        <boxGeometry args={[windowWidth + 0.1, 0.05, 0.3]} />
        <meshStandardMaterial color={theme.trim} />
      </mesh>
      {/* door frame */}
      {[door.from, door.to].map((x) => (
        <mesh key={x} position={[x, door.top / 2, z]}>
          <boxGeometry args={[0.08, door.top, thickness + 0.04]} />
          <meshStandardMaterial color={theme.trim} />
        </mesh>
      ))}
      {/* sign above the door, outside */}
      <mesh position={[(door.from + door.to) / 2, door.top + 0.75, z + thickness / 2 + 0.02]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* entrance mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(door.from + door.to) / 2, 0.006, SOUTH_WALL.start[1] - 0.9]}>
        <planeGeometry args={[door.to - door.from - 0.2, 1.4]} />
        <meshStandardMaterial color={theme.trim} roughness={1} />
      </mesh>
    </group>
  );
};

export const WindowLight = ({color, strength}) => {
  const {window: win} = SOUTH_WALL;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(win.from + win.to) / 2, 0.01, SOUTH_WALL.start[1] - 2.4]} renderOrder={1}>
      <planeGeometry args={[(win.to - win.from) * 1.3, 5]} />
      <meshBasicMaterial map={radialTexture()} color={color} transparent opacity={strength} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const Partitions = ({theme}) => {
  const plaster = React.useMemo(() => repeated(plasterTexture(), 1, 1), []);
  return (
    <group>
      {PARTITIONS.map((partition, i) => {
        const pose = segmentPose(partition.start, partition.end);
        return (
          <group key={i} position={[pose.mid[0], 0, pose.mid[1]]} rotation={[0, pose.rotationY, 0]}>
            {/* the wall floats on a recessed dark plinth */}
            <Occluder position={[0, PARTITION_HEIGHT / 2 + 0.06, 0]}>
              <boxGeometry args={[pose.length, PARTITION_HEIGHT, PARTITION_THICKNESS]} />
              <meshStandardMaterial map={plaster} color={theme.partition} roughness={0.9} />
            </Occluder>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[pose.length - 0.12, 0.06, PARTITION_THICKNESS - 0.08]} />
              <meshBasicMaterial color={theme.trim} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Benches = ({themeId}) => (
  <group>
    {BENCHES.map((bench, i) => (
      <group key={i} position={[bench.position[0], 0, bench.position[1]]} rotation={[0, bench.rotationY, 0]}>
        <mesh position={[0, BENCH_SIZE.height - 0.04, 0]}>
          <boxGeometry args={[BENCH_SIZE.length, 0.08, BENCH_SIZE.depth]} />
          <meshStandardMaterial color={BENCH_WOOD[themeId]} roughness={0.55} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (BENCH_SIZE.length / 2 - 0.2), (BENCH_SIZE.height - 0.08) / 2, 0]}>
            <boxGeometry args={[0.05, BENCH_SIZE.height - 0.08, BENCH_SIZE.depth - 0.06]} />
            <meshStandardMaterial color="#1c1c1e" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

export const Platform = ({theme}) => (
  <group position={[PLATFORM.center[0], 0, PLATFORM.center[1]]}>
    <mesh position={[0, PLATFORM.height / 2, 0]}>
      <cylinderGeometry args={[PLATFORM.radius, PLATFORM.radius + 0.05, PLATFORM.height, 64]} />
      <meshStandardMaterial color={theme.partition} roughness={0.6} />
    </mesh>
    <mesh position={[0, PLATFORM.height + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[PLATFORM.radius - 0.08, PLATFORM.radius - 0.04, 96]} />
      <meshBasicMaterial color={theme.accent} toneMapped={false} />
    </mesh>
  </group>
);
