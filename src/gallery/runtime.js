import * as THREE from "three";

// Per-frame state shared between the 3D scene and the overlay UI. It lives
// outside React so updating it every frame never triggers a re-render.
export const runtime = {
  player: {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    heading: Math.PI,
    moving: false,
    running: false,
    // null, or the bench interactable the robot is sitting on
    seat: null,
  },
  camera: {
    yaw: 0,
    pitch: -0.12,
    photoDistance: 4.5,
  },
  // emote requested by the UI or keyboard, consumed by the robot
  emote: null,
  // {position: [x, z], heading} requested by the map or a portal, applied by the player controller
  teleport: null,
  // ms timestamp (performance.now) when the robot last appeared, drives the spawn effect
  spawnedAt: 0,
  introStartedAt: 0,
  // wall meshes that fade out when they block the third person camera
  occluders: new Set(),
  // recent walking path per room for the map, as [x, z] pairs
  trail: {main: [], annex: []},
  // footprints left on the floor: {room, x, z, heading, side, time}
  footprints: [],
  interactRequested: false,
  // until when (performance.now) the scene renders at full frame rate
  activeUntil: 0,
  keysDown: new Set(),
  dragging: false,
  // set by the canvas so photo mode can grab a frame
  gl: null,
  // frames drawn and frames asked for, for checking the idle frame rate
  frames: 0,
  frameRequests: 0,
};

// Keep rendering at full rate for a little while, e.g. after input or while something animates.
export const markActive = (ms = 1200) => {
  runtime.activeUntil = Math.max(runtime.activeUntil, performance.now() + ms);
};
