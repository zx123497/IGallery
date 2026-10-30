/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {runtime, markActive} from "../runtime";
import {COLLIDERS, BALL_START} from "../layout/mainHall";
import {resolveCircle} from "../collision";
import audio from "../audio/AudioEngine";

const RADIUS = 0.32;
const PLAYER_RADIUS = 0.38;
const FRICTION = 0.9;
const RESTITUTION = 0.62;
const KICK = 1.45;

const stripeTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const colors = ["#f2c94c", "#ef6f6c", "#f4f1ea", "#5aa9e6", "#7bc47f", "#f4f1ea"];
  colors.forEach((color, i) => {
    context.fillStyle = color;
    context.fillRect((i * 512) / colors.length, 0, 512 / colors.length + 1, 256);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// A beach ball the robot can kick around. Simple 2D physics on the floor plane:
// friction, bounces off walls and benches, and a push from the robot.
const Ball = () => {
  const mesh = React.useRef();
  const texture = React.useMemo(stripeTexture, []);
  const state = React.useMemo(() => ({
    position: new THREE.Vector3(BALL_START[0], 0, BALL_START[1]),
    velocity: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    spin: new THREE.Quaternion(),
  }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const {position, velocity} = state;
    const player = runtime.player.position;

    const dx = position.x - player.x;
    const dz = position.z - player.z;
    const distance = Math.hypot(dx, dz);
    const minimum = RADIUS + PLAYER_RADIUS;
    if (distance < minimum && distance > 1e-5) {
      const nx = dx / distance;
      const nz = dz / distance;
      position.x += nx * (minimum - distance);
      position.z += nz * (minimum - distance);
      const push = Math.max(0, runtime.player.velocity.x * nx + runtime.player.velocity.z * nz);
      velocity.x += nx * (push * KICK + 0.4);
      velocity.z += nz * (push * KICK + 0.4);
    }

    position.addScaledVector(velocity, dt);
    velocity.multiplyScalar(Math.exp(-FRICTION * dt));
    const contact = resolveCircle(position, RADIUS, COLLIDERS);
    if (contact) {
      const into = velocity.x * contact[0] + velocity.z * contact[1];
      if (into < 0) {
        velocity.x -= (1 + RESTITUTION) * into * contact[0];
        velocity.z -= (1 + RESTITUTION) * into * contact[1];
        if (-into > 0.5) audio.bounce(-into);
      }
    }

    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed < 0.02) {
      velocity.set(0, 0, 0);
    } else {
      // roll: rotate around the axis perpendicular to the motion
      state.axis.set(velocity.z, 0, -velocity.x).normalize();
      state.spin.setFromAxisAngle(state.axis, (speed * dt) / RADIUS);
      mesh.current.quaternion.premultiply(state.spin);
      markActive(200);
    }
    mesh.current.position.set(position.x, RADIUS, position.z);
  });

  return (
    <mesh ref={mesh} position={[BALL_START[0], RADIUS, BALL_START[1]]}>
      <sphereGeometry args={[RADIUS, 32, 16]} />
      <meshStandardMaterial map={texture} roughness={0.35} />
    </mesh>
  );
};

export default Ball;
