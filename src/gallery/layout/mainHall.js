import {segmentNormal, placeOn, lerpPoint, viewingSpot, capsule, boxCapsule, normalize} from "./geometry";

// Main hall floor plan (meters, +x east, +z south):
//
//            curved north wall (paintings n1 n2 n3)
//        D ⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒⌒ E
//   graffiti /    benches   \ portal
//          C       (●)        F       ● floating piece on a platform
//   e1     |   P2 ╲    ╱ P1   |   w1   P1 / P2 freestanding partitions
//          B ─ door ─ window ─ A       south wall, opens to the outdoors
export const WALL_HEIGHT = 5.4;
export const PARTITION_HEIGHT = 3.5;
export const PARTITION_THICKNESS = 0.24;

const A = [-14, 10];
const B = [14, 10];
const C = [14, -4];
const D = [9, -10];
const E = [-9, -10];
const F = [-14, -4];

// The north wall is an arc bulging away from the room.
export const ARC = {center: [0, -1.875], radius: 12.125, from: 0.8355, to: -0.8355, segments: 16};
const arcPoint = (angle, radius = ARC.radius) => [
  ARC.center[0] + Math.sin(angle) * radius,
  ARC.center[1] - Math.cos(angle) * radius,
];
const arcPoints = Array.from({length: ARC.segments + 1}, (_, i) =>
  arcPoint(ARC.from + ((ARC.to - ARC.from) * i) / ARC.segments));

// Floor outline, in order around the room.
export const BOUNDARY = [A, B, C, ...arcPoints, F];
const CENTER = [0, 0];

// Every wall except the south one, which has a window and a door cut into it.
export const PERIMETER_WALLS = [[B, C], [C, D], ...arcPoints.slice(1).map((point, i) => [arcPoints[i], point]), [E, F], [F, A]]
    .map(([a, b]) => ({start: a, end: b, normal: segmentNormal(a, b, CENTER)}));

export const SOUTH_WALL = {
  start: A,
  end: B,
  thickness: 0.3,
  window: {from: -10, to: -3, bottom: 0.9, top: 4.3},
  door: {from: 1.5, to: 4.5, top: 3.4},
};

export const PARTITIONS = [
  {start: [-9, 6.5], end: [-5.5, 3.5]},
  {start: [5.5, 3.5], end: [9, 6.5]},
];

const partitionFace = (partition, towards) => {
  const normal = segmentNormal(partition.start, partition.end, towards);
  const mid = lerpPoint(partition.start, partition.end, 0.5);
  return placeOn(mid, normal, PARTITION_THICKNESS / 2 + 0.05);
};

const onArc = (angle) => {
  const point = arcPoint(angle, ARC.radius - 0.1);
  // the wall curves toward the label beside the painting, so hold it further out
  return {...placeOn(point, normalize([-Math.sin(angle), Math.cos(angle)]), 0), labelDepth: 0.26};
};

export const ARTWORK_PLACEMENTS = {
  n1: onArc(-0.42),
  n2: onArc(0),
  n3: onArc(0.42),
  e1: placeOn([14, 2.5], [-1, 0], 0.06),
  w1: placeOn([-14, 2.5], [1, 0], 0.06),
  // partition faces that look back toward the entrance
  s2: partitionFace(PARTITIONS[0], [0, 10]),
  s1: partitionFace(PARTITIONS[1], [0, 10]),
};

const benchAt = (angle) => {
  const position = arcPoint(angle, 6.6);
  return {
    position,
    rotationY: -angle,
    // sitting faces the curved wall
    heading: Math.atan2(Math.sin(angle), -Math.cos(angle)),
  };
};
export const BENCHES = [benchAt(-0.32), benchAt(0.32)];
export const BENCH_SIZE = {length: 2.2, depth: 0.55, height: 0.46};

export const PLATFORM = {center: [0, -2.6], radius: 1.7, height: 0.22};

const chamferNormal = (a, b) => segmentNormal(a, b, CENTER);
export const PORTAL = {...placeOn(lerpPoint(E, F, 0.5), chamferNormal(E, F), 0.45, 0), target: "annex"};
export const GRAFFITI = {...placeOn(lerpPoint(C, D, 0.5), chamferNormal(C, D), 0.04, 1.95), width: 5, height: 2.6};

export const SPAWN = {position: [3, 4.2], heading: Math.PI};
export const BALL_START = [-1.6, 5.6];

export const COLLIDERS = {
  segments: [
    ...PERIMETER_WALLS.map((wall) => capsule(wall.start, wall.end, 0)),
    capsule(A, B, 0.15),
    ...PARTITIONS.map((partition) => capsule(partition.start, partition.end, PARTITION_THICKNESS / 2)),
    ...BENCHES.map((bench) => boxCapsule(bench.position, bench.rotationY, BENCH_SIZE.length, BENCH_SIZE.depth)),
  ],
  circles: [
    [PLATFORM.center[0], PLATFORM.center[1], PLATFORM.radius],
  ],
  rings: [],
};

// Things the visitor can press F on. `radius` is how close they need to be.
export const INTERACTABLES = [
  ...BENCHES.map((bench, i) => ({id: `bench${i}`, type: "bench", position: bench.position, radius: 1.5, label: "坐下", seat: bench})),
  {id: "portal", type: "portal", position: viewingSpot(PORTAL, 1.2), radius: 1.6, label: "進入懸浮展廳", target: "annex"},
  {id: "graffiti", type: "graffiti", position: viewingSpot(GRAFFITI, 2.2), radius: 2.2, label: "開始塗鴉"},
];

export const BOUNDS = {minX: -14, maxX: 14, minZ: -14, maxZ: 10};
