/* eslint-disable react/no-unknown-property */
import * as React from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {useGLTF, useAnimations} from "@react-three/drei";
import {runtime, markActive} from "../runtime";
import {useGalleryStore, getGalleryState} from "../store";
import {BODY_COLORS, TRIM_COLORS} from "../outfits";
import {radialTexture} from "../textures";

const MODEL_URL = `${process.env.PUBLIC_URL}/models/RobotExpressive.glb`;
const ROBOT_HEIGHT = 1.7;
// The Sitting clip lowers the hips to the floor; lift the robot so it lands on the bench.
const SEAT_LIFT = 0.42;
const SPAWN_MS = 900;
const ONE_SHOT = new Set(["Wave", "ThumbsUp", "Yes", "Jump", "Sitting", "Standing"]);

const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// Accessories are modelled around the head's bounding box (in model space, bind pose)
// and then re-parented to the head so they follow every animation.
const buildAccessories = (head, scene) => {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(head);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const unit = size.x;

  const beret = new THREE.Group();
  const beretMaterial = new THREE.MeshStandardMaterial({color: "#b3263a", roughness: 0.85});
  const cap = new THREE.Mesh(new THREE.SphereGeometry(unit * 0.42, 24, 12), beretMaterial);
  cap.scale.set(1.05, 0.32, 1);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(unit * 0.03, unit * 0.04, unit * 0.1, 8), beretMaterial);
  stalk.position.y = unit * 0.17;
  beret.add(cap, stalk);
  beret.position.set(center.x - unit * 0.06, box.max.y - size.y * 0.02, center.z);
  beret.rotation.z = 0.22;

  const scarf = new THREE.Group();
  const scarfMaterial = new THREE.MeshStandardMaterial({color: "#f2c94c", roughness: 0.9});
  const loop = new THREE.Mesh(new THREE.TorusGeometry(unit * 0.26, unit * 0.07, 10, 28), scarfMaterial);
  loop.rotation.x = Math.PI / 2;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(unit * 0.12, unit * 0.36, unit * 0.05), scarfMaterial);
  tail.position.set(unit * 0.12, -unit * 0.2, unit * 0.24);
  tail.rotation.z = 0.15;
  scarf.add(loop, tail);
  scarf.position.set(center.x, box.min.y - size.y * 0.02, center.z);

  const headphones = new THREE.Group();
  const phoneMaterial = new THREE.MeshStandardMaterial({color: "#1f1f24", roughness: 0.4, metalness: 0.3});
  const band = new THREE.Mesh(new THREE.TorusGeometry(unit * 0.56, unit * 0.04, 8, 32, Math.PI), phoneMaterial);
  band.position.y = size.y * 0.05;
  const cupGeometry = new THREE.CylinderGeometry(unit * 0.17, unit * 0.17, unit * 0.12, 20);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Mesh(cupGeometry, phoneMaterial);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(side * unit * 0.56, size.y * 0.05, 0);
    headphones.add(cup);
  });
  headphones.add(band);
  headphones.position.set(center.x, center.y, center.z);

  const accessories = {beret, scarf, headphones};
  Object.values(accessories).forEach((accessory) => {
    scene.add(accessory);
    head.attach(accessory);
  });
  return accessories;
};

const prepareModel = (scene) => {
  if (scene.userData.gallery) return scene.userData.gallery;
  const box = new THREE.Box3().setFromObject(scene);
  const materials = {};
  // Only the head carries facial morph targets. It is one mesh per material, grouped
  // under a node the loader renames (e.g. "Head_1"), so find it by its morphs, not its name.
  const faces = [];
  scene.traverse((object) => {
    if (!object.isMesh) return;
    // skinned parts animate outside their bind-pose bounds
    object.frustumCulled = false;
    materials[object.material.name] = object.material;
    if (object.morphTargetDictionary) faces.push(object);
  });
  const head = faces[0]?.parent;
  const gallery = {
    scale: ROBOT_HEIGHT / (box.max.y - box.min.y),
    materials,
    faces,
    accessories: head ? buildAccessories(head, scene) : {},
  };
  scene.userData.gallery = gallery;
  return gallery;
};

const Robot = () => {
  const root = React.useRef();
  const body = React.useRef();
  const shadow = React.useRef();
  const {scene, animations} = useGLTF(MODEL_URL);
  const {actions, mixer} = useAnimations(animations, body);
  const model = React.useMemo(() => prepareModel(scene), [scene]);
  const outfit = useGalleryStore((state) => state.outfit);
  const anim = React.useRef({current: null, state: "idle", finished: false, lift: 0, surprise: 0});

  React.useEffect(() => {
    model.materials.Main?.color.set(BODY_COLORS[outfit.body]?.color || BODY_COLORS.orange.color);
    model.materials.Grey?.color.set(TRIM_COLORS[outfit.trim]?.color || TRIM_COLORS.silver.color);
    Object.entries(model.accessories).forEach(([name, accessory]) => {
      accessory.visible = outfit.accessory === name;
    });
    markActive();
  }, [model, outfit]);

  React.useEffect(() => {
    const onFinished = () => {
      anim.current.finished = true;
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [mixer]);

  const play = (name, fade = 0.25) => {
    const a = anim.current;
    const next = actions[name];
    if (!next || a.current === name) return;
    const oneShot = ONE_SHOT.has(name);
    next.reset();
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = oneShot;
    next.fadeIn(fade).play();
    if (a.current && actions[a.current]) actions[a.current].fadeOut(fade);
    a.current = name;
    a.finished = false;
  };

  useFrame((_, delta) => {
    const a = anim.current;
    const player = runtime.player;
    const dt = Math.min(delta, 0.1);

    if (player.seat) {
      if (a.state !== "sitting") {
        play("Sitting", 0.35);
        a.state = "sitting";
      }
    } else if (a.state === "sitting") {
      play("Standing", 0.2);
      a.state = "standing";
    } else if (player.moving) {
      play(player.running ? "Running" : "Walking", 0.2);
      if (actions[a.current]) actions[a.current].timeScale = player.running ? 1 : 1.15;
      a.state = "moving";
      runtime.emote = null;
    } else if (runtime.emote) {
      play(runtime.emote, 0.2);
      if (a.current === runtime.emote) a.state = "emote";
      runtime.emote = null;
    } else if (a.state === "moving" || (a.finished && (a.state === "emote" || a.state === "standing"))) {
      play("Idle", 0.3);
      a.state = "idle";
    } else if (!a.current) {
      play("Idle", 0);
    }
    if (a.state !== "idle") markActive(300);

    a.lift = THREE.MathUtils.lerp(a.lift, player.seat ? SEAT_LIFT : 0, 1 - Math.exp(-dt * 6));
    root.current.position.set(player.position.x, a.lift, player.position.z);
    root.current.rotation.y = player.heading;

    const spawn = Math.min(1, (performance.now() - runtime.spawnedAt) / SPAWN_MS);
    const scale = model.scale * (spawn < 1 ? Math.max(0.001, easeOutBack(spawn)) : 1);
    body.current.scale.setScalar(scale);
    shadow.current.material.opacity = 0.5 * spawn;
    if (spawn < 1) markActive(200);

    // a little surprised face while looking at a painting
    const surprise = getGalleryState().focusedId ? 0.55 : 0;
    a.surprise = THREE.MathUtils.lerp(a.surprise, surprise, 1 - Math.exp(-dt * 4));
    model.faces.forEach((face) => {
      face.morphTargetInfluences[face.morphTargetDictionary.Surprised] = a.surprise;
    });

    // out of the way in first person and while painting the graffiti wall
    const {cameraMode, mode} = getGalleryState();
    root.current.visible = mode === "photo" || (cameraMode !== "first" && mode !== "graffiti");
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <primitive object={scene} />
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={1}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={radialTexture()} color="#000000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
};

useGLTF.preload(MODEL_URL);

export default Robot;
