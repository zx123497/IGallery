/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import PropTypes from "prop-types";
import {useFrame} from "@react-three/fiber";
import {Html} from "@react-three/drei";
import {runtime} from "../runtime";

const WIDTH = 2.4;
const PILLAR_HEIGHT = 2.3;
const ARCH_RADIUS = WIDTH / 2;

const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A slow spiral of two colors with a bright core.
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vPosition;
  void main() {
    vec2 p = vPosition.xy - vec2(0.0, ${(PILLAR_HEIGHT * 0.78).toFixed(2)});
    float r = length(p);
    float a = atan(p.y, p.x);
    float swirl = sin(a * 3.0 + r * 6.0 - uTime * 2.2) * 0.5 + 0.5;
    float rings = sin(r * 14.0 - uTime * 3.0) * 0.5 + 0.5;
    float core = smoothstep(1.7, 0.0, r);
    vec3 color = mix(uColorA, uColorB, swirl) * (0.45 + core * 0.9) + vec3(1.0) * pow(core, 5.0) * 0.8;
    color += rings * 0.08;
    gl_FragColor = vec4(color, 0.92);
  }
`;

// Opening shape: a rectangle topped by a half circle.
const openingShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-ARCH_RADIUS, 0);
  shape.lineTo(-ARCH_RADIUS, PILLAR_HEIGHT);
  shape.absarc(0, PILLAR_HEIGHT, ARCH_RADIUS, Math.PI, 0, true);
  shape.lineTo(ARCH_RADIUS, 0);
  shape.lineTo(-ARCH_RADIUS, 0);
  return shape;
};

/**
 * A glowing archway leading to another room.
 * @return {Portal} portal
 */
const Portal = ({placement, colors, label}) => {
  const material = React.useRef();
  const [near, setNear] = React.useState(false);
  const geometry = React.useMemo(() => new THREE.ShapeGeometry(openingShape(), 32), []);
  const uniforms = React.useMemo(() => ({
    uTime: {value: 0},
    uColorA: {value: new THREE.Color(colors[0])},
    uColorB: {value: new THREE.Color(colors[1])},
  }), [colors]);

  useFrame(({clock}) => {
    material.current.uniforms.uTime.value = clock.elapsedTime;
    const distance = Math.hypot(runtime.player.position.x - placement.position[0], runtime.player.position.z - placement.position[2]);
    if ((distance < 7) !== near) setNear(distance < 7);
  });

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent toneMapped={false} />
      </mesh>
      {/* frame: two pillars and the arch */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ARCH_RADIUS + 0.09), PILLAR_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.18, PILLAR_HEIGHT, 0.3]} />
          <meshStandardMaterial color="#d8d2c8" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, PILLAR_HEIGHT, 0]}>
        <torusGeometry args={[ARCH_RADIUS + 0.09, 0.09, 12, 48, Math.PI]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, PILLAR_HEIGHT, 0]}>
        <torusGeometry args={[ARCH_RADIUS + 0.22, 0.015, 8, 48, Math.PI]} />
        <meshBasicMaterial color={colors[1]} toneMapped={false} />
      </mesh>
      {near && (
        <Html position={[0, PILLAR_HEIGHT + ARCH_RADIUS + 0.45, 0]} center zIndexRange={[20, 0]} style={{pointerEvents: "none"}}>
          <div className="gallery-portal-label">{label}</div>
        </Html>
      )}
    </group>
  );
};

Portal.propTypes = {
  placement: PropTypes.object.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.string.isRequired,
};

export default Portal;
