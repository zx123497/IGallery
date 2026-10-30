// Circle-vs-world collision on the ground plane. Colliders are
//   segments: [ax, az, bx, bz, pad]  capsules (walls, benches)
//   circles:  [x, z, r]              solid round obstacles
//   rings:    [x, z, R]              round rooms the circle must stay inside
//
// `point` is anything with x / z (a THREE.Vector3 works). It is pushed out of
// every collider it overlaps; the return value is the last contact normal, or null.
export const resolveCircle = (point, radius, colliders) => {
  let contact = null;
  const push = (nx, nz, depth) => {
    point.x += nx * depth;
    point.z += nz * depth;
    contact = [nx, nz];
  };

  for (let iteration = 0; iteration < 3; iteration++) {
    colliders.segments.forEach(([ax, az, bx, bz, pad = 0]) => {
      const dx = bx - ax;
      const dz = bz - az;
      const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.z - az) * dz) / (dx * dx + dz * dz)));
      const ox = point.x - (ax + dx * t);
      const oz = point.z - (az + dz * t);
      const distance = Math.hypot(ox, oz);
      const min = radius + pad;
      if (distance < min && distance > 1e-6) push(ox / distance, oz / distance, min - distance);
    });
    colliders.circles.forEach(([cx, cz, r]) => {
      const ox = point.x - cx;
      const oz = point.z - cz;
      const distance = Math.hypot(ox, oz);
      const min = radius + r;
      if (distance < min && distance > 1e-6) push(ox / distance, oz / distance, min - distance);
    });
    colliders.rings.forEach(([cx, cz, r]) => {
      const ox = point.x - cx;
      const oz = point.z - cz;
      const distance = Math.hypot(ox, oz);
      const max = r - radius;
      if (distance > max) push(-ox / distance, -oz / distance, distance - max);
    });
  }
  return contact;
};
