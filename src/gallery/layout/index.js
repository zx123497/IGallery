import ARTWORKS from "../artworks";
import {viewingSpot} from "./geometry";
import * as mainHall from "./mainHall";
import * as annex from "./annex";

const withSpots = (placements) => ARTWORKS
    .filter((artwork) => placements[artwork.id])
    .map((artwork) => ({artwork, placement: placements[artwork.id], spot: viewingSpot(placements[artwork.id])}));

// Everything the player controller, camera and map need to know about a room.
export const ROOMS = {
  main: {
    id: "main",
    name: "主展廳",
    subtitle: "Main Hall",
    spawn: mainHall.SPAWN,
    colliders: mainHall.COLLIDERS,
    interactables: mainHall.INTERACTABLES,
    artworks: withSpots(mainHall.ARTWORK_PLACEMENTS),
    bounds: mainHall.BOUNDS,
    layout: mainHall,
  },
  annex: {
    id: "annex",
    name: "懸浮展廳",
    subtitle: "Floating Room",
    spawn: annex.SPAWN,
    colliders: annex.COLLIDERS,
    interactables: annex.INTERACTABLES,
    artworks: withSpots(annex.ARTWORK_PLACEMENTS),
    bounds: annex.BOUNDS,
    layout: annex,
  },
};
