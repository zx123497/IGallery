import * as React from "react";
import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CenterFocusWeakIcon from "@mui/icons-material/CenterFocusWeak";
import {ARTWORKS_BY_ID} from "../artworks";
import {ROOMS} from "../layout";
import {useGalleryStore} from "../store";

const TABS = [
  {id: "original", name: "原始作品"},
  {id: "zoom", name: "細節放大"},
  {id: "about", name: "創作說明"},
];
const MAX_SCALE = 6;
const HOTSPOT_SCALE = 2.8;
const EMPTY = "--";

// Pan-and-zoom image viewer with author-defined hotspots.
const ZoomViewer = ({artwork, activeHotspot, onHotspot}) => {
  const container = React.useRef();
  const drag = React.useRef(null);
  const [fit, setFit] = React.useState(null);
  const [view, setView] = React.useState({scale: 1, x: 0, y: 0, animated: false});

  // fit the image inside the stage, recomputed on resize
  React.useEffect(() => {
    const image = new Image();
    let observer;
    image.onload = () => {
      // the viewer may have unmounted (tab switched) before the image arrived
      if (!container.current) return;
      const measure = () => {
        if (!container.current) return;
        const {clientWidth: cw, clientHeight: ch} = container.current;
        const scale = Math.min((cw - 48) / image.width, (ch - 48) / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        setFit({width, height, left: (cw - width) / 2, top: (ch - height) / 2, cw, ch});
      };
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(container.current);
    };
    image.src = artwork.url;
    setView({scale: 1, x: 0, y: 0, animated: false});
    return () => observer?.disconnect();
  }, [artwork]);

  const zoomTo = React.useCallback((scale, focusX, focusY, animated) => {
    setView((current) => {
      const next = Math.max(1, Math.min(MAX_SCALE, scale));
      return {
        scale: next,
        x: focusX - (focusX - current.x) * (next / current.scale),
        y: focusY - (focusY - current.y) * (next / current.scale),
        animated,
      };
    });
  }, []);

  React.useEffect(() => {
    if (!fit || activeHotspot === null) return;
    const spot = artwork.hotspots[activeHotspot];
    // put the hotspot in the middle of the stage
    setView({
      scale: HOTSPOT_SCALE,
      x: fit.cw / 2 - fit.left - spot.x * fit.width * HOTSPOT_SCALE,
      y: fit.ch / 2 - fit.top - spot.y * fit.height * HOTSPOT_SCALE,
      animated: true,
    });
  }, [activeHotspot, fit, artwork]);

  const handleWheel = (event) => {
    if (!fit) return;
    const rect = container.current.getBoundingClientRect();
    zoomTo(view.scale * Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left - fit.left, event.clientY - rect.top - fit.top, false);
  };
  const handleDown = (event) => {
    drag.current = {x: event.clientX, y: event.clientY, view};
    container.current.setPointerCapture(event.pointerId);
  };
  const handleMove = (event) => {
    if (!drag.current) return;
    const start = drag.current;
    setView({...start.view, x: start.view.x + event.clientX - start.x, y: start.view.y + event.clientY - start.y, animated: false});
  };
  const handleUp = () => {
    drag.current = null;
  };
  const center = (factor) => fit && zoomTo(view.scale * factor, fit.cw / 2 - fit.left, fit.ch / 2 - fit.top, true);

  return (
    <div ref={container} className="zoom" onWheel={handleWheel} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp}>
      {fit && (
        <div
          className={`zoom__layer${view.animated ? " zoom__layer--animated" : ""}`}
          style={{width: fit.width, height: fit.height, left: fit.left, top: fit.top, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}
        >
          <img src={artwork.url} alt={artwork.title} />
          {artwork.hotspots.map((spot, index) => (
            <div key={index} className="zoom__spot" style={{left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, transform: `scale(${1 / view.scale})`}}>
              <button
                className="zoom__dot"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onHotspot(activeHotspot === index ? null : index)}
              >
                {index + 1}
              </button>
              {activeHotspot === index && (
                <div className="zoom__note">
                  <strong>{spot.label}</strong>
                  {spot.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="zoom__hint glass">滾輪縮放 · 拖曳移動 · 點數字看細節</div>
      <div className="zoom__controls glass" onPointerDown={(event) => event.stopPropagation()}>
        <button className="icon-button" onClick={() => center(1.5)} aria-label="放大"><AddIcon /></button>
        <button className="icon-button" onClick={() => center(1 / 1.5)} aria-label="縮小"><RemoveIcon /></button>
        <button className="icon-button" onClick={() => {
          onHotspot(null);
          setView({scale: 1, x: 0, y: 0, animated: true});
        }} aria-label="重設"><CenterFocusWeakIcon /></button>
      </div>
    </div>
  );
};

ZoomViewer.propTypes = {
  artwork: PropTypes.object.isRequired,
  activeHotspot: PropTypes.number,
  onHotspot: PropTypes.func.isRequired,
};

const Meta = ({artwork}) => (
  <dl className="detail__meta">
    <dt>作者</dt>
    <dd>{artwork.author || EMPTY}</dd>
    <dt>角色</dt>
    <dd>{artwork.character || EMPTY}</dd>
  </dl>
);

Meta.propTypes = {artwork: PropTypes.object.isRequired};

const HotspotList = ({artwork, active, onSelect}) => (
  <div className="hotspot-list">
    {artwork.hotspots.map((spot, index) => (
      <button key={index} className={`hotspot-item${active === index ? " hotspot-item--active" : ""}`} onClick={() => onSelect(index)}>
        <span className="hotspot-item__index">{index + 1}</span>
        <span>
          <div className="hotspot-item__label">{spot.label}</div>
          <div className="hotspot-item__note">{spot.note}</div>
        </span>
      </button>
    ))}
  </div>
);

HotspotList.propTypes = {
  artwork: PropTypes.object.isRequired,
  active: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
};

const ArtworkDetail = () => {
  const detailId = useGalleryStore((state) => state.detailId);
  const roomId = useGalleryStore((state) => state.room);
  const set = useGalleryStore((state) => state.set);
  const markVisited = useGalleryStore((state) => state.markVisited);
  const [tab, setTab] = React.useState("original");
  const [hotspot, setHotspot] = React.useState(null);

  const ids = ROOMS[roomId].artworks.map(({artwork}) => artwork.id);
  const artwork = detailId && ARTWORKS_BY_ID[detailId];

  const go = React.useCallback((step) => {
    const list = ROOMS[roomId].artworks.map((entry) => entry.artwork.id);
    const index = list.indexOf(detailId);
    const next = list[(index + step + list.length) % list.length];
    set({detailId: next});
    markVisited(next);
    setHotspot(null);
  }, [detailId, roomId, set, markVisited]);

  React.useEffect(() => {
    if (!detailId) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailId, go]);

  React.useEffect(() => {
    setHotspot(null);
  }, [detailId]);

  if (!artwork) return null;
  const position = ids.indexOf(artwork.id);

  const selectHotspot = (index) => {
    setTab("zoom");
    setHotspot(index);
  };

  return (
    <div className="detail">
      <header className="detail__bar">
        <div className="detail__crumbs">
          <span className="eyebrow">{ROOMS[roomId].subtitle}</span>
          <span>{position >= 0 ? `${position + 1} / ${ids.length}` : "精選作品"}</span>
        </div>
        <div className="segmented">
          {TABS.map((item) => (
            <button key={item.id} className={`segmented__item${tab === item.id ? " segmented__item--active" : ""}`} onClick={() => setTab(item.id)}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="detail__actions">
          <button className="icon-button" onClick={() => go(-1)} aria-label="上一件"><ChevronLeftIcon /></button>
          <button className="icon-button" onClick={() => go(1)} aria-label="下一件"><ChevronRightIcon /></button>
          <button className="icon-button" onClick={() => set({detailId: null})} aria-label="關閉"><CloseIcon /></button>
        </div>
      </header>
      <div className="detail__body">
        <div className="detail__stage">
          {tab === "zoom" ? (
            <ZoomViewer artwork={artwork} activeHotspot={hotspot} onHotspot={setHotspot} />
          ) : (
            <div className="detail__original">
              <img src={artwork.url} alt={artwork.title} />
            </div>
          )}
        </div>
        <aside className="detail__side">
          <div className="eyebrow">{tab === "about" ? "About the work" : tab === "zoom" ? "Details" : "Artwork"}</div>
          <h1 className="detail__title">{artwork.title}</h1>
          <Meta artwork={artwork} />
          {tab === "original" && (
            <>
              <h2 className="detail__heading">描述</h2>
              <p className="detail__text">{artwork.description || EMPTY}</p>
              <h2 className="detail__heading">細節熱點</h2>
              <HotspotList artwork={artwork} active={null} onSelect={selectHotspot} />
            </>
          )}
          {tab === "zoom" && (
            <>
              <h2 className="detail__heading">細節熱點</h2>
              <HotspotList artwork={artwork} active={hotspot} onSelect={setHotspot} />
            </>
          )}
          {tab === "about" && (
            <>
              <h2 className="detail__heading">創作說明</h2>
              <p className="detail__text">{artwork.description || EMPTY}</p>
              <h2 className="detail__heading">作品背後的故事</h2>
              {artwork.story ? (
                artwork.story.split("\n").map((paragraph, i) => <p key={i} className="detail__text">{paragraph}</p>)
              ) : (
                <p className="detail__placeholder">作者尚未提供作品故事。</p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ArtworkDetail;
