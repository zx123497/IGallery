import * as React from "react";
import {Canvas} from "@react-three/fiber";
import {KeyboardControls} from "@react-three/drei";
import GalleryScene from "../gallery/scene/GalleryScene";
import Hud from "../gallery/ui/Hud";
import GalleryMap from "../gallery/ui/GalleryMap";
import ArtworkDetail from "../gallery/ui/ArtworkDetail";
import PhotoMode, {PHOTO_FILTERS} from "../gallery/ui/PhotoMode";
import GraffitiToolbar from "../gallery/ui/GraffitiToolbar";
import IntroScreen, {TransitionOverlay} from "../gallery/ui/IntroScreen";
import THEMES from "../gallery/themes";
import {useGalleryStore, getGalleryState} from "../gallery/store";
import {runtime, markActive} from "../gallery/runtime";
import {requestInteract, openDetail, playEmote, skipIntro, startIntro} from "../gallery/actions";
import audio from "../gallery/audio/AudioEngine";
import "../gallery/ui/gallery.css";

const KEY_MAP = [
  {name: "forward", keys: ["ArrowUp", "KeyW"]},
  {name: "backward", keys: ["ArrowDown", "KeyS"]},
  {name: "left", keys: ["ArrowLeft", "KeyA"]},
  {name: "right", keys: ["ArrowRight", "KeyD"]},
  {name: "turnLeft", keys: ["KeyQ"]},
  {name: "turnRight", keys: ["KeyE"]},
  {name: "run", keys: ["ShiftLeft", "ShiftRight"]},
];

const EMOTE_KEYS = {Digit1: "Wave", Digit2: "ThumbsUp", Digit3: "Dance", Digit4: "Yes", Space: "Jump"};
const DPR = {high: [1, 2], balanced: [1, 1.5], low: 1};
const DRAG_YAW = 0.005;
const DRAG_PITCH = 0.004;

// Keyboard shortcuts that aren't movement (movement is read by KeyboardControls).
const handleShortcut = (event) => {
  const state = getGalleryState();
  if (state.phase === "gate") {
    if (event.code === "Enter") startIntro();
    return;
  }
  if (state.phase === "intro") {
    if (["Escape", "Enter", "Space"].includes(event.code)) skipIntro();
    return;
  }
  if (state.detailId) {
    if (event.code === "Escape") state.set({detailId: null});
    return;
  }
  if (event.code === "Escape") {
    if (state.mapOpen || state.panel) state.set({mapOpen: false, panel: null});
    else if (state.mode !== "explore") state.set({mode: "explore"});
    return;
  }
  if (state.mode === "graffiti") {
    if (event.code === "KeyF") state.set({mode: "explore"});
    return;
  }
  if (EMOTE_KEYS[event.code] && (state.mode === "explore" || state.mode === "photo")) {
    event.preventDefault();
    playEmote(EMOTE_KEYS[event.code]);
    return;
  }
  switch (event.code) {
    case "KeyF":
      requestInteract();
      break;
    case "Enter":
      if (state.focusedId) openDetail(state.focusedId);
      break;
    case "KeyM":
      state.set({mapOpen: !state.mapOpen, panel: null});
      break;
    case "KeyV":
      state.set({cameraMode: state.cameraMode === "first" ? "third" : "first"});
      break;
    case "KeyP":
      state.set({mode: state.mode === "photo" ? "explore" : "photo", panel: null, mapOpen: false});
      break;
    case "KeyC":
      state.togglePanel("outfit");
      break;
    case "KeyT":
      state.togglePanel("theme");
      break;
    case "Slash":
      state.togglePanel("help");
      break;
    default:
  }
};

const themeVariables = (theme) => ({
  "--g-accent": theme.accent,
  "--g-on-accent": theme.dark ? "#16130f" : "#ffffff",
  "--g-bg": theme.background,
  "--g-bg-deep": theme.dark ? "#0d0c0b" : "#efede9",
  "--g-stage": theme.dark ? "#171513" : "#e3e0da",
});

const GalleryPage = () => {
  const themeId = useGalleryStore((state) => state.theme);
  const mode = useGalleryStore((state) => state.mode);
  const photoFilter = useGalleryStore((state) => state.photo.filter);
  const quality = useGalleryStore((state) => state.resolvedQuality());
  const theme = THEMES[themeId];
  const drag = React.useRef(null);

  // development-only handle for poking at the scene from the console or browser tests
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return undefined;
    window.__igallery = {runtime, getGalleryState, audio};
    return () => {
      delete window.__igallery;
    };
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event) => {
      runtime.keysDown.add(event.code);
      markActive();
      if (!event.repeat) handleShortcut(event);
    };
    const onKeyUp = (event) => {
      runtime.keysDown.delete(event.code);
      markActive();
    };
    const onBlur = () => runtime.keysDown.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // keep the synthesized audio in step with the settings
  React.useEffect(() => {
    const sync = (state) => {
      audio.setMusicOn(state.musicOn);
      audio.setVolume(state.volume);
      audio.setRain(state.weather === "rain" && state.room === "main");
    };
    sync(getGalleryState());
    return useGalleryStore.subscribe(sync);
  }, []);

  // camera drag. Listening on window (instead of capturing the pointer) keeps the
  // canvas's own click events working for paintings and the graffiti wall.
  const handlePointerDown = (event) => {
    if (event.button !== 0 || getGalleryState().mode === "graffiti") return;
    drag.current = {x: event.clientX, y: event.clientY, moved: false};
    const onMove = (moveEvent) => {
      const start = drag.current;
      if (!start) return;
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 3) return;
      start.moved = true;
      runtime.dragging = true;
      runtime.camera.yaw -= dx * DRAG_YAW;
      runtime.camera.pitch = Math.max(-0.9, Math.min(0.7, runtime.camera.pitch - dy * DRAG_PITCH));
      start.x = moveEvent.clientX;
      start.y = moveEvent.clientY;
      markActive();
    };
    const onUp = () => {
      drag.current = null;
      runtime.dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleWheel = (event) => {
    if (getGalleryState().mode !== "photo") return;
    runtime.camera.photoDistance = Math.max(1.6, Math.min(9, runtime.camera.photoDistance * Math.exp(event.deltaY * 0.001)));
    markActive();
  };

  return (
    <div className="gallery" data-ui={theme.dark ? "dark" : "light"} style={themeVariables(theme)}>
      <KeyboardControls map={KEY_MAP}>
        <div
          className={`gallery__canvas${mode === "graffiti" ? " gallery__canvas--draw" : ""}`}
          style={{filter: mode === "photo" ? PHOTO_FILTERS[photoFilter].css : "none"}}
          onPointerDown={handlePointerDown}
          onWheel={handleWheel}
        >
          <Canvas
            frameloop="demand"
            shadows="percentage"
            dpr={DPR[quality]}
            gl={{preserveDrawingBuffer: true, antialias: quality === "low", powerPreference: "high-performance"}}
            camera={{fov: 50, near: 0.1, far: 220, position: [3, 2.3, 21]}}
            onCreated={({gl}) => {
              runtime.gl = gl;
            }}
          >
            <GalleryScene />
          </Canvas>
        </div>
      </KeyboardControls>
      <Hud />
      <PhotoMode />
      <GraffitiToolbar />
      <GalleryMap />
      <ArtworkDetail />
      <IntroScreen />
      <TransitionOverlay />
    </div>
  );
};

export default GalleryPage;
