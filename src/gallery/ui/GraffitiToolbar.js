import * as React from "react";
import {useGalleryStore} from "../store";

const PAINTS = ["#ff5a5f", "#f2994a", "#f2c94c", "#7bc47f", "#2fb5a6", "#5aa9e6", "#8e6bd6", "#1d1d1f", "#ffffff"];

const GraffitiToolbar = () => {
  const mode = useGalleryStore((state) => state.mode);
  const graffiti = useGalleryStore((state) => state.graffiti);
  const setGraffiti = useGalleryStore((state) => state.setGraffiti);
  const set = useGalleryStore((state) => state.set);
  if (mode !== "graffiti") return null;

  return (
    <>
      <div className="graffiti-hint glass">在牆上拖曳就能畫，作品會自動保存在這台電腦 · Esc 完成</div>
      <div className="graffiti-bar glass">
        <div style={{display: "flex", gap: 8}}>
          {PAINTS.map((color) => (
            <button
              key={color}
              className={`paint${!graffiti.eraser && graffiti.color === color ? " paint--active" : ""}`}
              style={{background: color}}
              onClick={() => setGraffiti({color, eraser: false})}
              aria-label={color}
            />
          ))}
        </div>
        <label style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12}}>
          粗細
          <input className="range" style={{width: 110}} type="range" min="6" max="48" value={graffiti.size} onChange={(event) => setGraffiti({size: Number(event.target.value)})} />
        </label>
        <button className={`chip${graffiti.eraser ? " chip--active" : ""}`} onClick={() => setGraffiti({eraser: !graffiti.eraser})}>橡皮擦</button>
        <button className="chip" onClick={() => {
          if (window.confirm("要清除整面塗鴉牆嗎？")) set({graffitiClearToken: Date.now()});
        }}>清除</button>
        <button className="chip chip--active" onClick={() => set({mode: "explore"})}>完成</button>
      </div>
    </>
  );
};

export default GraffitiToolbar;
