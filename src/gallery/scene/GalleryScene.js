/* eslint-disable react/no-unknown-property */
import * as React from "react";
import THEMES from "../themes";
import {useGalleryStore} from "../store";
import Lighting from "./Lighting";
import MainHall from "./MainHall";
import Robot from "./Robot";
import Footprints from "./Footprints";
import PlayerController from "./PlayerController";
import Effects from "./Effects";
import FrameDriver from "./FrameDriver";

// The annex is only downloaded when the visitor first walks through the portal.
const Annex = React.lazy(() => import("./Annex"));

const ANNEX_FOG = ["#07070c", 14, 30];

const GalleryScene = () => {
  const themeId = useGalleryStore((state) => state.theme);
  const roomId = useGalleryStore((state) => state.room);
  const theme = THEMES[themeId];
  const fog = roomId === "annex" ? ANNEX_FOG : theme.fog;

  return (
    <>
      <color attach="background" args={[roomId === "annex" ? ANNEX_FOG[0] : theme.background]} />
      <fog attach="fog" args={fog} />
      <Lighting />
      <React.Suspense fallback={null}>
        {roomId === "main" ? <MainHall /> : <Annex />}
      </React.Suspense>
      <React.Suspense fallback={null}>
        <Robot />
      </React.Suspense>
      <Footprints />
      <PlayerController />
      <Effects />
      <FrameDriver />
    </>
  );
};

export default GalleryScene;
