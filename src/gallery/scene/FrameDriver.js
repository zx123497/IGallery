import * as React from "react";
import {useFrame, useThree} from "@react-three/fiber";
import {runtime} from "../runtime";
import {getGalleryState} from "../store";

// While nothing is happening the scene keeps idling (robot breathing, particles)
// at a low frame rate instead of rendering flat out.
const IDLE_FPS = 20;

// The canvas runs with frameloop="demand"; this decides when a frame is worth drawing.
const FrameDriver = () => {
  const invalidate = useThree((state) => state.invalidate);
  useFrame(() => {
    runtime.frames++;
  });

  React.useEffect(() => {
    let frame;
    let last = 0;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      const state = getGalleryState();
      // the detail view covers the scene completely, so stop rendering it
      if (document.hidden || state.detailId) return;
      const active = now < runtime.activeUntil ||
        runtime.keysDown.size > 0 ||
        runtime.dragging ||
        state.phase !== "explore" ||
        state.mode !== "explore" ||
        state.transition;
      if (active || now - last >= 1000 / IDLE_FPS) {
        last = now;
        runtime.frameRequests++;
        invalidate();
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);

  return null;
};

export default FrameDriver;
