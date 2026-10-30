import * as React from "react";
import THEMES, {SEASONS, WEATHERS} from "../themes";
import {BODY_COLORS, TRIM_COLORS, ACCESSORIES, EMOTES} from "../outfits";
import {useGalleryStore} from "../store";
import {playEmote} from "../actions";

const QUALITIES = {auto: "自動", high: "高畫質", balanced: "均衡", low: "省電"};

const OutfitPanel = () => {
  const outfit = useGalleryStore((state) => state.outfit);
  const setOutfit = useGalleryStore((state) => state.setOutfit);
  return (
    <>
      <div className="eyebrow">Wardrobe</div>
      <div className="panel__title">角色服裝</div>
      <div className="panel__section">
        <div className="panel__label">機身顏色</div>
        <div className="swatches">
          {Object.entries(BODY_COLORS).map(([id, option]) => (
            <button key={id} className={`swatch${outfit.body === id ? " swatch--active" : ""}`} onClick={() => setOutfit({body: id})}>
              <span className="swatch__dot" style={{background: option.color}} />
              {option.name}
            </button>
          ))}
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">關節與配色</div>
        <div className="swatches">
          {Object.entries(TRIM_COLORS).map(([id, option]) => (
            <button key={id} className={`swatch${outfit.trim === id ? " swatch--active" : ""}`} onClick={() => setOutfit({trim: id})}>
              <span className="swatch__dot" style={{background: option.color}} />
              {option.name}
            </button>
          ))}
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">配件</div>
        <div className="chips">
          {Object.entries(ACCESSORIES).map(([id, option]) => (
            <button key={id} className={`chip${outfit.accessory === id ? " chip--active" : ""}`} onClick={() => setOutfit({accessory: id})}>
              {option.name}
            </button>
          ))}
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">試試動作</div>
        <div className="chips">
          {EMOTES.map((emote) => (
            <button key={emote.id} className="chip" onClick={() => playEmote(emote.id)}>{emote.name}</button>
          ))}
        </div>
      </div>
    </>
  );
};

const ThemePanel = () => {
  const theme = useGalleryStore((state) => state.theme);
  const season = useGalleryStore((state) => state.season);
  const weather = useGalleryStore((state) => state.weather);
  const set = useGalleryStore((state) => state.set);
  return (
    <>
      <div className="eyebrow">Atmosphere</div>
      <div className="panel__title">畫廊主題</div>
      {Object.entries(THEMES).map(([id, option]) => (
        <button key={id} className={`theme-card${theme === id ? " theme-card--active" : ""}`} onClick={() => set({theme: id})}>
          <span className="theme-card__preview" style={{background: `linear-gradient(135deg, ${option.swatch[0]} 55%, ${option.swatch[1]} 55%)`}} />
          <span>
            <div className="theme-card__name">{option.name}</div>
            <div className="theme-card__caption">{option.caption}</div>
          </span>
        </button>
      ))}
      <div className="panel__section">
        <div className="panel__label">窗外的季節</div>
        <div className="chips">
          {Object.entries(SEASONS).map(([id, option]) => (
            <button key={id} className={`chip${season === id ? " chip--active" : ""}`} onClick={() => set({season: id})}>{option.name}</button>
          ))}
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">天氣</div>
        <div className="chips">
          {Object.entries(WEATHERS).map(([id, option]) => (
            <button key={id} className={`chip${weather === id ? " chip--active" : ""}`} onClick={() => set({weather: id})}>{option.name}</button>
          ))}
        </div>
      </div>
    </>
  );
};

const SettingsPanel = () => {
  const quality = useGalleryStore((state) => state.quality);
  const musicOn = useGalleryStore((state) => state.musicOn);
  const volume = useGalleryStore((state) => state.volume);
  const cameraMode = useGalleryStore((state) => state.cameraMode);
  const set = useGalleryStore((state) => state.set);
  return (
    <>
      <div className="eyebrow">Settings</div>
      <div className="panel__title">設定</div>
      <div className="panel__section">
        <div className="panel__label">視角</div>
        <div className="chips">
          <button className={`chip${cameraMode === "third" ? " chip--active" : ""}`} onClick={() => set({cameraMode: "third"})}>第三人稱</button>
          <button className={`chip${cameraMode === "first" ? " chip--active" : ""}`} onClick={() => set({cameraMode: "first"})}>第一人稱</button>
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">畫質</div>
        <div className="chips">
          {Object.entries(QUALITIES).map(([id, name]) => (
            <button key={id} className={`chip${quality === id ? " chip--active" : ""}`} onClick={() => set({quality: id})}>{name}</button>
          ))}
        </div>
      </div>
      <div className="panel__section">
        <div className="panel__label">背景音樂</div>
        <div className="chips" style={{marginBottom: 12}}>
          <button className={`chip${musicOn ? " chip--active" : ""}`} onClick={() => set({musicOn: true})}>開</button>
          <button className={`chip${!musicOn ? " chip--active" : ""}`} onClick={() => set({musicOn: false})}>關</button>
        </div>
        <div className="panel__label">音量 {Math.round(volume * 100)}%</div>
        <input className="range" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => set({volume: Number(event.target.value)})} />
      </div>
    </>
  );
};

const KEYS = [
  [["W", "A", "S", "D"], "走路（方向鍵也可以）"],
  [["Shift"], "按住跑步"],
  [["Q", "E"], "轉動視角（或拖曳滑鼠）"],
  [["F"], "互動：坐下、傳送門、塗鴉"],
  [["Enter"], "查看正在欣賞的作品"],
  [["1", "2", "3", "4"], "揮手、按讚、跳舞、點頭"],
  [["Space"], "跳躍"],
  [["V"], "切換第一／第三人稱"],
  [["M"], "導覽地圖"],
  [["P"], "攝影模式"],
  [["C"], "角色服裝"],
  [["T"], "主題與天氣"],
  [["Esc"], "關閉面板、離開模式"],
];

const HelpPanel = () => (
  <>
    <div className="eyebrow">Controls</div>
    <div className="panel__title">操作說明</div>
    <div className="keys">
      {KEYS.map(([combo, label]) => (
        <React.Fragment key={label}>
          <span className="keys__combo">{combo.map((key) => <span key={key} className="kbd">{key}</span>)}</span>
          <span>{label}</span>
        </React.Fragment>
      ))}
    </div>
  </>
);

const PANELS = {outfit: OutfitPanel, theme: ThemePanel, settings: SettingsPanel, help: HelpPanel};

const Panels = () => {
  const panel = useGalleryStore((state) => state.panel);
  const Panel = PANELS[panel];
  if (!Panel) return null;
  return (
    <div className="panel glass" key={panel}>
      <Panel />
    </div>
  );
};

export default Panels;
