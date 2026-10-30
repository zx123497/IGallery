/* eslint-disable react/prop-types */
import * as React from "react";
import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";
import {ROOMS} from "../layout";
import * as mainHall from "../layout/mainHall";
import * as annex from "../layout/annex";
import {runtime} from "../runtime";
import {useGalleryStore} from "../store";
import {travelToArtwork} from "../actions";

// An ink-and-watercolor floor plan. Walls are drawn twice with a displacement
// filter so they read as hand-drawn; artworks are round thumbnails; your walk is
// a dotted trail of footsteps; you are a glowing comet.
const VIEW = {
  main: {x: -15.5, y: -15.5, width: 31, height: 27},
  annex: {x: -11.5, y: -11.5, width: 23, height: 23},
};
const ART_RADIUS = 0.95;

const toPath = (points) => points.map(([x, z], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${z.toFixed(2)}`).join(" ") + " Z";

const artMarkerPoint = (placement, inset) => [
  placement.position[0] + placement.normal[0] * inset,
  placement.position[2] + placement.normal[1] * inset,
];

const MainHallPlan = ({id}) => {
  const outline = toPath(mainHall.BOUNDARY);
  return (
    <g>
      <path d={outline} fill={`url(#${id}-wash)`} />
      <path d={outline} fill="none" stroke="var(--g-accent)" strokeWidth="0.16" strokeLinejoin="round" filter={`url(#${id}-ink)`} />
      <path d={outline} fill="none" stroke="#f2ede4" strokeOpacity="0.25" strokeWidth="0.06" transform="translate(0.18 0.12)" filter={`url(#${id}-ink)`} />
      {/* window and door openings in the south wall */}
      <line x1={mainHall.SOUTH_WALL.window.from} y1="10" x2={mainHall.SOUTH_WALL.window.to} y2="10" stroke="#9fd2ff" strokeWidth="0.32" strokeLinecap="round" strokeOpacity="0.8" />
      <line x1={mainHall.SOUTH_WALL.door.from} y1="10" x2={mainHall.SOUTH_WALL.door.to} y2="10" stroke="#15131a" strokeWidth="0.4" />
      <text x={(mainHall.SOUTH_WALL.door.from + mainHall.SOUTH_WALL.door.to) / 2} y="11.4" className="map-svg__note" textAnchor="middle">入口</text>
      {mainHall.PARTITIONS.map((partition, i) => (
        <line key={i} x1={partition.start[0]} y1={partition.start[1]} x2={partition.end[0]} y2={partition.end[1]}
          stroke="#f2ede4" strokeOpacity="0.75" strokeWidth="0.26" strokeLinecap="round" filter={`url(#${id}-ink)`} />
      ))}
      {mainHall.BENCHES.map((bench, i) => (
        <rect key={i} x={-1.1} y={-0.28} width="2.2" height="0.56" rx="0.2" fill="#f2ede4" fillOpacity="0.18"
          transform={`translate(${bench.position[0]} ${bench.position[1]}) rotate(${(-bench.rotationY * 180) / Math.PI})`} />
      ))}
      <circle cx={mainHall.PLATFORM.center[0]} cy={mainHall.PLATFORM.center[1]} r={mainHall.PLATFORM.radius} fill="none" stroke="var(--g-accent)" strokeOpacity="0.6" strokeWidth="0.08" strokeDasharray="0.3 0.25" />
      <text x={mainHall.PLATFORM.center[0]} y={mainHall.PLATFORM.center[1] + 0.25} className="map-svg__note" textAnchor="middle">懸浮展台</text>
      <g transform={`translate(${mainHall.PORTAL.position[0]} ${mainHall.PORTAL.position[2]})`}>
        <circle r="1.1" fill="#7fd8ff" fillOpacity="0.18" filter={`url(#${id}-glow)`} />
        <circle r="0.5" fill="none" stroke="#7fd8ff" strokeWidth="0.12" />
        <text y="1.9" className="map-svg__note" textAnchor="middle">傳送門</text>
      </g>
      <g transform={`translate(${mainHall.GRAFFITI.position[0]} ${mainHall.GRAFFITI.position[2]}) rotate(${(-mainHall.GRAFFITI.rotationY * 180) / Math.PI})`}>
        {["#ff5a5f", "#f2c94c", "#5aa9e6", "#7bc47f"].map((color, i) => (
          <line key={color} x1={-2.2 + i * 1.15} y1="0.15" x2={-1.4 + i * 1.15} y2="0.15" stroke={color} strokeWidth="0.22" strokeLinecap="round" />
        ))}
        <text y="1.3" className="map-svg__note" textAnchor="middle">塗鴉牆</text>
      </g>
    </g>
  );
};

const AnnexPlan = ({id}) => (
  <g>
    <circle r={annex.RADIUS} fill={`url(#${id}-wash)`} />
    <circle r={annex.RADIUS} fill="none" stroke="var(--g-accent)" strokeWidth="0.16" filter={`url(#${id}-ink)`} />
    <circle r={annex.RING_RADIUS} fill="none" stroke="#f2ede4" strokeOpacity="0.15" strokeWidth="0.05" strokeDasharray="0.2 0.3" />
    <circle r={annex.PROJECTION.radius} fill="#9fdcff" fillOpacity="0.08" stroke="#9fdcff" strokeOpacity="0.5" strokeWidth="0.06" />
    <text y="0.25" className="map-svg__note" textAnchor="middle">投影</text>
    <g transform={`translate(${annex.PORTAL.position[0]} ${annex.PORTAL.position[2]})`}>
      <circle r="1.1" fill="#ffd27f" fillOpacity="0.2" filter={`url(#${id}-glow)`} />
      <circle r="0.5" fill="none" stroke="#ffd27f" strokeWidth="0.12" />
      <text y="1.7" className="map-svg__note" textAnchor="middle">回主展廳</text>
    </g>
  </g>
);

export const MapSvg = ({roomId, interactive, showTitles}) => {
  const id = React.useId().replace(/:/g, "");
  const visited = useGalleryStore((state) => state.visited);
  const currentRoom = useGalleryStore((state) => state.room);
  const player = React.useRef();
  const trail = React.useRef();
  const view = VIEW[roomId];
  const room = ROOMS[roomId];
  const here = currentRoom === roomId;

  // move the player marker and redraw the trail outside React, a few times a second
  React.useEffect(() => {
    let frame;
    let last = 0;
    const update = (now) => {
      frame = requestAnimationFrame(update);
      if (now - last < 80) return;
      last = now;
      const {position, heading} = runtime.player;
      if (player.current) {
        player.current.setAttribute("transform", `translate(${position.x.toFixed(2)} ${position.z.toFixed(2)}) rotate(${((-heading * 180) / Math.PI).toFixed(1)})`);
      }
      if (trail.current) {
        trail.current.setAttribute("points", runtime.trail[roomId].map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join(" "));
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [roomId]);

  return (
    <svg className="map-svg" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}>
      <defs>
        <filter id={`${id}-ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="0.32" />
        </filter>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
        <filter id={`${id}-grey`}>
          <feColorMatrix type="saturate" values="0.15" />
        </filter>
        <radialGradient id={`${id}-wash`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="var(--g-accent)" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#7c6bd6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-comet`}>
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="40%" stopColor="var(--g-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--g-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--g-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--g-accent)" stopOpacity="0" />
        </linearGradient>
        {room.artworks.map(({artwork}) => (
          <pattern key={artwork.id} id={`${id}-art-${artwork.id}`} patternContentUnits="objectBoundingBox" width="1" height="1">
            <image href={artwork.previewUrl} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
          </pattern>
        ))}
      </defs>

      {roomId === "main" ? <MainHallPlan id={id} /> : <AnnexPlan id={id} />}

      {here && (
        <polyline ref={trail} fill="none" stroke="#f2ede4" strokeOpacity="0.55" strokeWidth="0.14" strokeLinecap="round" strokeDasharray="0.01 0.42" />
      )}

      {room.artworks.map(({artwork, placement}) => {
        const [x, z] = artMarkerPoint(placement, roomId === "main" ? 1.05 : 0);
        const seen = visited.includes(artwork.id);
        return (
          <g
            key={artwork.id}
            className={interactive ? "map-art" : undefined}
            transform={`translate(${x.toFixed(2)} ${z.toFixed(2)})`}
            onClick={interactive ? () => travelToArtwork(roomId, artwork.id) : undefined}
          >
            {seen && <circle r={ART_RADIUS + 0.4} fill="var(--g-accent)" fillOpacity="0.35" filter={`url(#${id}-glow)`} />}
            <circle r={ART_RADIUS} fill={`url(#${id}-art-${artwork.id})`} filter={seen ? undefined : `url(#${id}-grey)`} opacity={seen ? 1 : 0.75} />
            <circle className="map-art__ring" r={ART_RADIUS} fill="none" stroke={seen ? "var(--g-accent)" : "#f2ede4"} strokeOpacity={seen ? 1 : 0.45}
              strokeWidth="0.12" strokeDasharray={seen ? undefined : "0.25 0.18"} />
            {showTitles && (
              <text y={ART_RADIUS + 0.85} className="map-svg__title" textAnchor="middle">{artwork.title}</text>
            )}
            {interactive && <title>{`前往「${artwork.title}」`}</title>}
          </g>
        );
      })}

      {here && (
        <g ref={player}>
          <path d="M0 0 L-1.3 2.6 Q0 3.1 1.3 2.6 Z" fill={`url(#${id}-cone)`} />
          <circle r="0.9" fill={`url(#${id}-comet)`} />
          <circle r="0.28" fill="#fff" />
        </g>
      )}

      <g transform={`translate(${view.x + view.width - 1.6} ${view.y + 1.8})`} opacity="0.6">
        <line x1="0" y1="0.9" x2="0" y2="-0.6" stroke="#f2ede4" strokeWidth="0.06" />
        <path d="M0 -1 L-0.3 -0.4 L0.3 -0.4 Z" fill="#f2ede4" />
        <text y="-1.3" className="map-svg__note" textAnchor="middle">N</text>
      </g>
    </svg>
  );
};

MapSvg.propTypes = {
  roomId: PropTypes.oneOf(["main", "annex"]).isRequired,
  interactive: PropTypes.bool,
  showTitles: PropTypes.bool,
};

export const MiniMap = () => {
  const roomId = useGalleryStore((state) => state.room);
  const set = useGalleryStore((state) => state.set);
  return (
    <div className="minimap glass" onClick={() => set({mapOpen: true})} role="button" title="打開導覽地圖 (M)">
      <div className="minimap__caption">
        <span className="eyebrow">Map</span>
        <span className="kbd">M</span>
      </div>
      <MapSvg roomId={roomId} />
    </div>
  );
};

const GalleryMap = () => {
  const open = useGalleryStore((state) => state.mapOpen);
  const currentRoom = useGalleryStore((state) => state.room);
  const visited = useGalleryStore((state) => state.visited);
  const set = useGalleryStore((state) => state.set);
  const [roomId, setRoomId] = React.useState(currentRoom);

  React.useEffect(() => {
    if (open) setRoomId(currentRoom);
  }, [open, currentRoom]);

  if (!open) return null;
  const room = ROOMS[roomId];
  const total = ROOMS.main.artworks.length;
  const seen = ROOMS.main.artworks.filter(({artwork}) => visited.includes(artwork.id)).length;

  return (
    <div className="map-overlay" onClick={() => set({mapOpen: false})}>
      <div className="map-card" onClick={(event) => event.stopPropagation()}>
        <div className="map-card__canvas">
          <MapSvg roomId={roomId} interactive showTitles />
        </div>
        <aside className="map-card__side">
          <div>
            <div className="eyebrow">Gallery Guide</div>
            <div className="map-card__title">導覽地圖</div>
          </div>
          <div className="map-tabs">
            {Object.values(ROOMS).map((item) => (
              <button key={item.id} className={`map-tab${item.id === roomId ? " map-tab--active" : ""}`} onClick={() => setRoomId(item.id)}>
                {item.name}
              </button>
            ))}
          </div>
          <div>
            <div className="eyebrow" style={{marginBottom: 8}}>已參觀 {seen} / {total}</div>
            <div className="brand__bar"><span style={{width: `${(seen / total) * 100}%`}} /></div>
          </div>
          <div className="map-list">
            {room.artworks.map(({artwork}) => (
              <button key={artwork.id} className="map-list__item" onClick={() => travelToArtwork(roomId, artwork.id)}>
                <img className={`map-list__thumb${visited.includes(artwork.id) ? " map-list__thumb--visited" : ""}`} src={artwork.previewUrl} alt="" />
                <span>
                  <div className="map-list__name">{artwork.title}</div>
                  <div className="map-list__meta">{visited.includes(artwork.id) ? "已參觀 · 點擊前往" : "點擊前往"}</div>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <button className="icon-button map-close" onClick={() => set({mapOpen: false})} aria-label="關閉地圖">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default GalleryMap;
