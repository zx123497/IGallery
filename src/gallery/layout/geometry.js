// Floor-plan helpers. Everything here works on the ground plane as [x, z] pairs.

export const HANG_HEIGHT = 2.15;
// How far in front of a painting the visitor stands to look at it.
export const VIEW_DISTANCE = 1.9;

export const normalize = ([x, z]) => {
  const length = Math.hypot(x, z) || 1;
  return [x / length, z / length];
};

// The normal of segment a→b that points toward `inside`.
export const segmentNormal = (a, b, inside) => {
  const [dx, dz] = normalize([b[0] - a[0], b[1] - a[1]]);
  const normal = [dz, -dx];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const toInside = [inside[0] - mid[0], inside[1] - mid[1]];
  return normal[0] * toInside[0] + normal[1] * toInside[1] >= 0 ? normal : [-normal[0], -normal[1]];
};

// Rotation around Y that turns a +z-facing plane to face `normal`.
export const rotationFromNormal = ([x, z]) => Math.atan2(x, z);

// A wall-mounted item: center on the wall plus an offset along its normal.
export const placeOn = (point, normal, offset, height = HANG_HEIGHT) => ({
  position: [point[0] + normal[0] * offset, height, point[1] + normal[1] * offset],
  normal,
  rotationY: rotationFromNormal(normal),
});

export const lerpPoint = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Where the visitor stands to view something placed with placeOn.
export const viewingSpot = (placement, distance = VIEW_DISTANCE) => [
  placement.position[0] + placement.normal[0] * distance,
  placement.position[2] + placement.normal[1] * distance,
];

// Splits the segment a→b into a capsule collider of the given half thickness.
export const capsule = (a, b, pad) => [a[0], a[1], b[0], b[1], pad];

// A rotated rectangle as a capsule along its long side.
export const boxCapsule = ([x, z], rotationY, length, depth) => {
  const tangent = [Math.cos(rotationY), -Math.sin(rotationY)];
  const half = length / 2 - depth / 2;
  return capsule(
      [x - tangent[0] * half, z - tangent[1] * half],
      [x + tangent[0] * half, z + tangent[1] * half],
      depth / 2,
  );
};
