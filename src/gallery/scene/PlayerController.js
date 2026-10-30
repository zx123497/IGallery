import * as React from "react";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {useKeyboardControls} from "@react-three/drei";
import {runtime, markActive} from "../runtime";
import {getGalleryState} from "../store";
import {ROOMS} from "../layout";
import {GRAFFITI, WALL_HEIGHT} from "../layout/mainHall";
import {resolveCircle} from "../collision";
import {enterPortal, openDetail} from "../actions";
import audio from "../audio/AudioEngine";

const WALK_SPEED = 3.2;
const RUN_SPEED = 5.6;
const TURN_SPEED = 2;
const BODY_RADIUS = 0.38;
const FOCUS_RANGE = 2.3;
const STRIDE = 0.72;
const TRAIL_STEP = 0.6;
const TRAIL_LIMIT = 500;
const FOOTPRINT_LIMIT = 160;
const FOLLOW_DISTANCE = 4.8;
const EYE_HEIGHT = 1.55;
const FOCUS_DISTANCE = 3.9;
// Shift the focus shot right so the wall label beside the painting is in frame.
const FOCUS_SHIFT = 0.7;
const DWELL_TO_VISIT_MS = 1500;

const lerpAngle = (from, to, t) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);

// The entrance camera move: from outside the door, gliding in to the follow position.
const INTRO_PATH = [
  {t: 0, position: [3, 2.3, 21], look: [3, 1.9, 9]},
  {t: 3.2, position: [3, 2.4, 12.5], look: [3, 1.4, 4.2]},
];
const INTRO_BLEND_END = 5.8;

const forwardOf = (yaw) => [-Math.sin(yaw), -Math.cos(yaw)];

const PlayerController = () => {
  const [, getKeys] = useKeyboardControls();
  const {camera} = useThree();
  const raycaster = React.useMemo(() => new THREE.Raycaster(), []);
  const local = React.useRef({
    lookAt: new THREE.Vector3(),
    lastPosition: new THREE.Vector3(),
    snap: true,
    stride: 0,
    trailStep: 0,
    footSide: 1,
    focusId: null,
    focusSince: 0,
    promptKey: null,
    room: null,
  });
  const scratch = React.useMemo(() => ({
    position: new THREE.Vector3(),
    look: new THREE.Vector3(),
    head: new THREE.Vector3(),
    direction: new THREE.Vector3(),
  }), []);

  const placeAt = (position, heading) => {
    runtime.player.position.set(position[0], 0, position[1]);
    runtime.player.heading = heading;
    runtime.player.seat = null;
    runtime.camera.yaw = heading + Math.PI;
    runtime.camera.pitch = -0.12;
    local.current.snap = true;
    local.current.lastPosition.copy(runtime.player.position);
  };

  React.useEffect(() => {
    const room = ROOMS[getGalleryState().room];
    placeAt(room.spawn.position, room.spawn.heading);
  }, []);

  const followPose = (target, look) => {
    const player = runtime.player;
    const {yaw, pitch} = runtime.camera;
    const elevation = THREE.MathUtils.clamp(0.36 - pitch, 0.1, 1.05);
    target.set(
        player.position.x + Math.sin(yaw) * Math.cos(elevation) * FOLLOW_DISTANCE,
        Math.min(1.25 + Math.sin(elevation) * FOLLOW_DISTANCE, WALL_HEIGHT - 0.45),
        player.position.z + Math.cos(yaw) * Math.cos(elevation) * FOLLOW_DISTANCE,
    );
    look.set(player.position.x, 1.25, player.position.z);
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const now = performance.now();
    const state = getGalleryState();
    const room = ROOMS[state.room];
    const player = runtime.player;
    const l = local.current;

    if (l.room !== state.room) {
      l.room = state.room;
      l.focusId = null;
    }

    if (runtime.teleport) {
      placeAt(runtime.teleport.position, runtime.teleport.heading);
      runtime.teleport = null;
    }

    // --- movement -------------------------------------------------------
    const canMove = state.phase === "explore" && state.mode === "explore" && !state.detailId && !state.transition && !state.mapOpen;
    const keys = getKeys();
    let moveX = 0;
    let moveZ = 0;
    if (canMove) {
      runtime.camera.yaw += (Number(keys.turnLeft) - Number(keys.turnRight)) * TURN_SPEED * dt;
      const yaw = runtime.camera.yaw;
      const forward = Number(keys.forward) - Number(keys.backward);
      const right = Number(keys.right) - Number(keys.left);
      // movement follows the camera heading, so "up" always walks away from the camera
      moveX = -Math.sin(yaw) * forward + Math.cos(yaw) * right;
      moveZ = -Math.cos(yaw) * forward - Math.sin(yaw) * right;
    }
    const length = Math.hypot(moveX, moveZ);
    player.moving = length > 0;
    player.running = player.moving && keys.run;
    if (player.moving && player.seat) player.seat = null;

    l.lastPosition.copy(player.position);
    if (player.moving) {
      const speed = player.running ? RUN_SPEED : WALK_SPEED;
      player.position.x += (moveX / length) * speed * dt;
      player.position.z += (moveZ / length) * speed * dt;
      player.heading = lerpAngle(player.heading, Math.atan2(moveX, moveZ), 1 - Math.exp(-dt * 12));
      markActive(400);
    }
    if (!player.seat) resolveCircle(player.position, BODY_RADIUS, room.colliders);
    const moved = player.position.distanceTo(l.lastPosition);
    player.velocity.subVectors(player.position, l.lastPosition).divideScalar(dt || 1 / 60);

    // --- footsteps, footprints and the map trail -------------------------
    if (moved > 0) {
      l.stride += moved;
      l.trailStep += moved;
      if (l.stride > (player.running ? 0.95 : STRIDE)) {
        l.stride = 0;
        l.footSide *= -1;
        const side = l.footSide * 0.13;
        runtime.footprints.push({
          room: state.room,
          x: player.position.x + Math.cos(player.heading) * side,
          z: player.position.z - Math.sin(player.heading) * side,
          heading: player.heading,
          time: now,
        });
        if (runtime.footprints.length > FOOTPRINT_LIMIT) runtime.footprints.shift();
        audio.footstep();
      }
      if (l.trailStep > TRAIL_STEP) {
        l.trailStep = 0;
        const trail = runtime.trail[state.room];
        trail.push([player.position.x, player.position.z]);
        if (trail.length > TRAIL_LIMIT) trail.shift();
      }
    }

    // --- what is the visitor looking at? --------------------------------
    let focus = null;
    if (state.phase === "explore" && state.mode === "explore" && !state.transition) {
      const facing = forwardOf(runtime.camera.yaw);
      let best = FOCUS_RANGE;
      room.artworks.forEach((entry) => {
        const distance = Math.hypot(entry.spot[0] - player.position.x, entry.spot[1] - player.position.z);
        if (distance >= best) return;
        // in first person you also have to be looking roughly at the painting
        if (state.cameraMode === "first") {
          const toArt = [entry.placement.position[0] - player.position.x, entry.placement.position[2] - player.position.z];
          const toLength = Math.hypot(...toArt) || 1;
          if ((facing[0] * toArt[0] + facing[1] * toArt[1]) / toLength < 0.55) return;
        }
        best = distance;
        focus = entry;
      });
    }
    const focusId = focus ? focus.artwork.id : null;
    if (focusId !== l.focusId) {
      l.focusId = focusId;
      l.focusSince = now;
      state.set({focusedId: focusId});
      if (focusId) audio.chime();
      markActive(2500);
    }
    if (focusId && now - l.focusSince > DWELL_TO_VISIT_MS && !state.visited.includes(focusId)) state.markVisited(focusId);

    // --- interactions -----------------------------------------------------
    let interactable = null;
    if (canMove || player.seat) {
      let best = Infinity;
      room.interactables.forEach((item) => {
        const distance = Math.hypot(item.position[0] - player.position.x, item.position[1] - player.position.z);
        if (distance < item.radius && distance < best) {
          best = distance;
          interactable = item;
        }
      });
    }
    let prompt = null;
    if (player.seat) prompt = {key: "WASD", label: "起身"};
    else if (interactable) prompt = {key: "F", label: interactable.label};
    else if (focus) prompt = {key: "Enter", label: "查看作品細節"};
    const promptKey = prompt ? `${prompt.key}:${prompt.label}` : null;
    if (promptKey !== l.promptKey) {
      l.promptKey = promptKey;
      state.set({prompt});
    }

    if (runtime.interactRequested) {
      runtime.interactRequested = false;
      if (interactable && !player.seat && canMove) {
        if (interactable.type === "bench") {
          const seat = interactable.seat;
          player.seat = seat;
          player.position.set(seat.position[0], 0, seat.position[1]);
          player.heading = seat.heading;
          runtime.camera.yaw = seat.heading + Math.PI;
        } else if (interactable.type === "portal") {
          enterPortal(interactable.target);
        } else if (interactable.type === "graffiti") {
          state.set({mode: "graffiti", focusedId: null, prompt: null});
          l.focusId = null;
          l.promptKey = null;
        }
      } else if (focus && canMove) {
        openDetail(focus.artwork.id);
      }
    }

    // --- camera ------------------------------------------------------------
    const target = scratch.position;
    const look = scratch.look;
    let follow = 1 - Math.exp(-dt * 4);
    if (state.phase !== "explore") {
      const t = state.phase === "gate" ? 0 : (now - runtime.introStartedAt) / 1000;
      const [from, to] = INTRO_PATH;
      if (t <= to.t) {
        const u = smoothstep(Math.min(1, t / to.t));
        target.fromArray(from.position).lerp(scratch.head.fromArray(to.position), u);
        look.fromArray(from.look).lerp(scratch.head.fromArray(to.look), u);
      } else {
        const u = smoothstep(Math.min(1, (t - to.t) / (INTRO_BLEND_END - to.t)));
        followPose(target, look);
        target.lerp(scratch.head.fromArray(to.position), 1 - u);
        look.lerp(scratch.head.fromArray(to.look), 1 - u);
      }
      follow = 1;
    } else if (state.mode === "photo") {
      const {yaw, pitch, photoDistance} = runtime.camera;
      const elevation = THREE.MathUtils.clamp(0.3 - pitch, -0.1, 1.3);
      target.set(
          player.position.x + Math.sin(yaw) * Math.cos(elevation) * photoDistance,
          Math.max(0.3, 1.1 + Math.sin(elevation) * photoDistance),
          player.position.z + Math.cos(yaw) * Math.cos(elevation) * photoDistance,
      );
      look.set(player.position.x, 1.1, player.position.z);
      follow = 1 - Math.exp(-dt * 10);
    } else if (state.mode === "graffiti") {
      target.set(GRAFFITI.position[0] + GRAFFITI.normal[0] * 4.6, 2.1, GRAFFITI.position[2] + GRAFFITI.normal[1] * 4.6);
      look.set(GRAFFITI.position[0], GRAFFITI.position[1], GRAFFITI.position[2]);
    } else if (state.cameraMode === "first") {
      const {yaw, pitch} = runtime.camera;
      target.set(player.position.x, EYE_HEIGHT, player.position.z);
      look.set(
          target.x - Math.sin(yaw) * Math.cos(pitch),
          target.y + Math.sin(pitch),
          target.z - Math.cos(yaw) * Math.cos(pitch),
      );
      follow = 1 - Math.exp(-dt * 18);
    } else if (focus) {
      const {position, normal} = focus.placement;
      const right = [-normal[1], normal[0]];
      // drift slowly closer the longer the visitor looks
      const distance = FOCUS_DISTANCE - Math.min(0.45, ((now - l.focusSince) / 1000) * 0.05);
      look.set(position[0] - right[0] * FOCUS_SHIFT, position[1], position[2] - right[1] * FOCUS_SHIFT);
      target.set(look.x + normal[0] * distance, position[1] + 0.55, look.z + normal[1] * distance);
      if (now - l.focusSince < 9000) markActive(200);
    } else {
      followPose(target, look);
    }

    const before = scratch.head.copy(camera.position);
    if (l.snap) {
      camera.position.copy(target);
      l.lookAt.copy(look);
      l.snap = false;
    } else {
      camera.position.lerp(target, follow);
      l.lookAt.lerp(look, follow);
    }
    camera.lookAt(l.lookAt);
    if (before.distanceToSquared(camera.position) > 1e-6) markActive(250);

    const fov = state.transition?.kind === "portal" ? 78 : 50;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-dt * 3));
      camera.updateProjectionMatrix();
      markActive(200);
    }

    // --- fade walls that hide the robot -----------------------------------
    const thirdPerson = state.cameraMode !== "first" || state.mode === "photo";
    const hits = new Set();
    if (thirdPerson && runtime.occluders.size) {
      const head = scratch.head.set(player.position.x, 1.2, player.position.z);
      const direction = scratch.direction.subVectors(head, camera.position);
      const distance = direction.length();
      raycaster.set(camera.position, direction.normalize());
      raycaster.far = distance;
      raycaster.intersectObjects([...runtime.occluders], false).forEach((hit) => hits.add(hit.object));
    }
    // in photo mode a blocking wall vanishes completely so it can't ghost over the shot
    const hiddenOpacity = state.mode === "photo" ? 0 : 0.12;
    runtime.occluders.forEach((mesh) => {
      const material = mesh.material;
      const goal = hits.has(mesh) ? hiddenOpacity : 1;
      if (Math.abs(material.opacity - goal) < 0.005) return;
      material.opacity = THREE.MathUtils.lerp(material.opacity, goal, 1 - Math.exp(-dt * 10));
      material.transparent = material.opacity < 0.99;
      material.depthWrite = !material.transparent;
      mesh.visible = material.opacity > 0.01;
      markActive(200);
    });
  });

  return null;
};

export default PlayerController;
