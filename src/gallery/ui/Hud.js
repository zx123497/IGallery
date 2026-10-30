/* eslint-disable react/prop-types */
import * as React from "react";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import MusicOffOutlinedIcon from "@mui/icons-material/MusicOffOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {ROOMS} from "../layout";
import {EMOTES} from "../outfits";
import {useGalleryStore} from "../store";
import {playEmote} from "../actions";
import Panels from "./Panels";
import {MiniMap} from "./GalleryMap";

const ToolButton = ({tip, active, onClick, children}) => (
  <button className={`icon-button${active ? " icon-button--active" : ""}`} data-tip={tip} onClick={onClick} aria-label={tip}>
    {children}
  </button>
);

const Hud = () => {
  const phase = useGalleryStore((state) => state.phase);
  const mode = useGalleryStore((state) => state.mode);
  const roomId = useGalleryStore((state) => state.room);
  const visited = useGalleryStore((state) => state.visited);
  const panel = useGalleryStore((state) => state.panel);
  const mapOpen = useGalleryStore((state) => state.mapOpen);
  const musicOn = useGalleryStore((state) => state.musicOn);
  const cameraMode = useGalleryStore((state) => state.cameraMode);
  const prompt = useGalleryStore((state) => state.prompt);
  const detailId = useGalleryStore((state) => state.detailId);
  const set = useGalleryStore((state) => state.set);
  const togglePanel = useGalleryStore((state) => state.togglePanel);

  const room = ROOMS[roomId];
  const total = ROOMS.main.artworks.length;
  const seen = ROOMS.main.artworks.filter(({artwork}) => visited.includes(artwork.id)).length;
  const hidden = phase !== "explore" || mode !== "explore" || detailId;

  return (
    <div className={`hud${hidden ? " hud--hidden" : ""}`}>
      <div className="brand glass">
        <div className="eyebrow">{room.subtitle}</div>
        <div className="brand__name">IGallery</div>
        <div className="brand__room">{room.name}</div>
        <div className="brand__progress">
          <span>已參觀 {seen}/{total}</span>
          <span className="brand__bar"><span style={{width: `${(seen / total) * 100}%`}} /></span>
        </div>
      </div>

      <div className="toolbar glass">
        <ToolButton tip="導覽地圖 M" active={mapOpen} onClick={() => set({mapOpen: !mapOpen, panel: null})}><MapOutlinedIcon /></ToolButton>
        <ToolButton tip={cameraMode === "first" ? "切到第三人稱 V" : "切到第一人稱 V"} active={cameraMode === "first"}
          onClick={() => set({cameraMode: cameraMode === "first" ? "third" : "first"})}>
          {cameraMode === "first" ? <VisibilityOutlinedIcon /> : <PersonOutlineIcon />}
        </ToolButton>
        <ToolButton tip="攝影模式 P" onClick={() => set({mode: "photo", panel: null})}><PhotoCameraOutlinedIcon /></ToolButton>
        <span className="toolbar__divider" />
        <ToolButton tip="角色服裝 C" active={panel === "outfit"} onClick={() => togglePanel("outfit")}><CheckroomOutlinedIcon /></ToolButton>
        <ToolButton tip="主題與天氣 T" active={panel === "theme"} onClick={() => togglePanel("theme")}><PaletteOutlinedIcon /></ToolButton>
        <ToolButton tip={musicOn ? "關閉音樂" : "開啟音樂"} onClick={() => set({musicOn: !musicOn})}>
          {musicOn ? <MusicNoteOutlinedIcon /> : <MusicOffOutlinedIcon />}
        </ToolButton>
        <ToolButton tip="設定" active={panel === "settings"} onClick={() => togglePanel("settings")}><TuneOutlinedIcon /></ToolButton>
        <ToolButton tip="操作說明 ?" active={panel === "help"} onClick={() => togglePanel("help")}><HelpOutlineIcon /></ToolButton>
        <span className="toolbar__divider" />
        <ToolButton tip="離開畫廊" onClick={() => {
          window.location.hash = "";
        }}><LogoutOutlinedIcon /></ToolButton>
      </div>

      <Panels />
      <MiniMap />

      <div className="dock">
        {prompt && (
          <div className="prompt glass" key={`${prompt.key}${prompt.label}`}>
            <span className="kbd">{prompt.key}</span>
            {prompt.label}
          </div>
        )}
        <div className="emotes glass">
          {EMOTES.map((emote) => (
            <button key={emote.id} className="emote" onClick={() => playEmote(emote.id)}>
              <span className="kbd">{emote.key === "Space" ? "␣" : emote.key}</span>
              <span>{emote.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hud;
