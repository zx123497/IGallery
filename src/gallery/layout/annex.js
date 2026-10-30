import ARTWORKS from "../artworks";
import {placeOn, viewingSpot, normalize} from "./geometry";

// The annex: a round, dark hall where every artwork floats in a ring around a
// projection disc. Reached through the portal in the main hall.
export const RADIUS = 10;
export const RING_RADIUS = 6.8;
export const PROJECTION = {center: [0, 0], radius: 2.6};

const ringPoint = (angle, radius) => [Math.sin(angle) * radius, -Math.cos(angle) * radius];

// Spread the artworks over the north side, leaving the south free for the portal.
const angles = ARTWORKS.map((_, i) => -2.3 + (4.6 * i) / (ARTWORKS.length - 1));

export const ARTWORK_PLACEMENTS = Object.fromEntries(ARTWORKS.map((artwork, i) => {
  const angle = angles[i];
  return [artwork.id, placeOn(ringPoint(angle, RING_RADIUS), normalize([-Math.sin(angle), Math.cos(angle)]), 0, 2.25)];
}));

export const PORTAL = {...placeOn([0, 8.7], [0, -1], 0, 0), target: "main"};
export const SPAWN = {position: [0, 6.6], heading: Math.PI};

export const COLLIDERS = {
  segments: [],
  // a small pedestal under each floating piece
  circles: Object.values(ARTWORK_PLACEMENTS).map((placement) => [placement.position[0], placement.position[2], 0.55]),
  rings: [[0, 0, RADIUS - 0.4]],
};

export const INTERACTABLES = [
  {id: "portal", type: "portal", position: viewingSpot(PORTAL, 1.2), radius: 1.6, label: "回到主展廳", target: "main"},
];

export const BOUNDS = {minX: -RADIUS, maxX: RADIUS, minZ: -RADIUS, maxZ: RADIUS};
