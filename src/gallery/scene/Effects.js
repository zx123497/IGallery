import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {EffectComposer, Bloom, DepthOfField, Vignette, SMAA} from "@react-three/postprocessing";
import {useGalleryStore, getGalleryState} from "../store";
import {ROOMS} from "../layout";
import {runtime} from "../runtime";

const FOCUS_RANGE = {explore: 1.6, photo: 1.2};

// Post-processing: bloom for the light strips and glows, vignette, and depth of
// field while looking at a painting or in photo mode. Skipped on low quality.
const Effects = () => {
  const quality = useGalleryStore((state) => state.resolvedQuality());
  const focusedId = useGalleryStore((state) => state.focusedId);
  const mode = useGalleryStore((state) => state.mode);
  const photoDepth = useGalleryStore((state) => state.photo.depthOfField);
  const depth = React.useRef();
  const subject = React.useMemo(() => new THREE.Vector3(), []);

  const depthOfField = (mode === "photo" && photoDepth) || (mode === "explore" && focusedId && quality === "high");

  // keep the subject exactly on the focal plane as the camera moves
  useFrame(({camera}) => {
    const effect = depth.current;
    if (!effect) return;
    const state = getGalleryState();
    const entry = state.focusedId && ROOMS[state.room].artworks.find((item) => item.artwork.id === state.focusedId);
    if (state.mode === "photo" || !entry) subject.set(runtime.player.position.x, 1.1, runtime.player.position.z);
    else subject.fromArray(entry.placement.position);
    effect.cocMaterial.worldFocusDistance = camera.position.distanceTo(subject);
    effect.cocMaterial.worldFocusRange = FOCUS_RANGE[state.mode] || FOCUS_RANGE.explore;
  });

  if (quality === "low") return null;

  return (
    // No MSAA: blitting a multisampled depth buffer for depth of field fails on some
    // GPUs (GL_INVALID_OPERATION every frame). SMAA handles anti-aliasing instead.
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
      {depthOfField && <DepthOfField ref={depth} worldFocusDistance={4} worldFocusRange={1.6} bokehScale={mode === "photo" ? 5 : 3} height={540} />}
      <Vignette offset={0.28} darkness={0.55} />
      {quality === "high" && <SMAA />}
    </EffectComposer>
  );
};

export default Effects;
