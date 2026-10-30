// Imperative actions shared by the keyboard handler, the overlay UI and the scene.
import {runtime, markActive} from "./runtime";
import {getGalleryState} from "./store";
import {ROOMS} from "./layout";
import audio from "./audio/AudioEngine";

const FADE_MS = 380;
const PORTAL_MS = 950;

export const requestInteract = () => {
  runtime.interactRequested = true;
  markActive();
};

export const playEmote = (name) => {
  const state = getGalleryState();
  if (state.phase !== "explore" || state.detailId) return;
  runtime.player.seat = null;
  runtime.emote = name;
  markActive();
};

export const openDetail = (id) => {
  const state = getGalleryState();
  state.set({detailId: id, hoveredId: null});
  state.markVisited(id);
  audio.click();
};

// Fade the screen out, run `midway` while it is hidden, then fade back in.
export const fadeTransition = (label, midway, kind = "fade") => {
  if (getGalleryState().transition) return;
  getGalleryState().set({transition: {kind, label}});
  markActive(3000);
  setTimeout(() => {
    midway();
    markActive(2000);
    setTimeout(() => getGalleryState().set({transition: null}), kind === "portal" ? 650 : 320);
  }, kind === "portal" ? PORTAL_MS : FADE_MS);
};

// Face the painting: the opposite of the direction it faces.
const headingToward = (normal) => Math.atan2(-normal[0], -normal[1]);

export const travelToArtwork = (roomId, artworkId) => {
  const entry = ROOMS[roomId].artworks.find((item) => item.artwork.id === artworkId);
  if (!entry) return;
  getGalleryState().set({mapOpen: false});
  fadeTransition(entry.artwork.title, () => {
    const state = getGalleryState();
    if (state.room !== roomId) state.set({room: roomId});
    runtime.player.seat = null;
    runtime.teleport = {position: entry.spot, heading: headingToward(entry.placement.normal)};
  });
};

export const enterPortal = (target) => {
  if (getGalleryState().transition) return;
  audio.whoosh();
  fadeTransition(ROOMS[target].name, () => {
    getGalleryState().set({room: target, focusedId: null, prompt: null, hoveredId: null});
    runtime.player.seat = null;
    runtime.teleport = {position: ROOMS[target].spawn.position, heading: ROOMS[target].spawn.heading};
    runtime.spawnedAt = performance.now();
  }, "portal");
};

export const startIntro = () => {
  audio.start();
  runtime.introStartedAt = performance.now();
  // the robot materialises at the entrance a little after the camera starts moving
  runtime.spawnedAt = performance.now() + 2600;
  getGalleryState().set({phase: "intro"});
  markActive(8000);
  // wave hello once the robot has appeared
  setTimeout(() => {
    runtime.emote = "Wave";
    markActive();
  }, 3600);
  setTimeout(() => {
    if (getGalleryState().phase === "intro") getGalleryState().set({phase: "explore"});
  }, 6200);
};

export const skipIntro = () => {
  runtime.spawnedAt = Math.min(runtime.spawnedAt, performance.now() - 2000);
  getGalleryState().set({phase: "explore"});
  markActive(2000);
};
