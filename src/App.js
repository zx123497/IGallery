import * as React from "react";
import "./App.css";
import ResponsiveAppBar from "./layout/AppBar";
import HomePage from "./pages/HomePage";
import Footer from "./layout/Footer";
import {ThemeProvider, createTheme} from "@mui/material/styles";
import ColorModeContext from "./themes/ToggleContext";

// three.js and the whole 3D gallery are only downloaded when someone opens it
const GalleryPage = React.lazy(() => import("./pages/GalleryPage"));


const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light" ?
      {
        // palette values for light mode
        primary: {
          main: "#6750A4",
          light: "#EADDFF",
          dark: "#21005D",


        },
        secondary: {
          main: "#625B71",
          light: "#E8DEF8",
          dark: "#1D192B",

        },
        background: {
          paper: "#E7E0EC",
          default: "#FFFBFE",
        },

        divider: "#E7E0EC",
      } :
      {
        // palette values for dark mode
        primary: {
          main: "#6750A4",
          light: "#EADDFF",
          dark: "#21005D",


        },
        secondary: {
          main: "#625B71",
          light: "#E8DEF8",
          dark: "#1D192B",

        },
        background: {
          paper: "#49454F",
          default: "#1C1B1F",
        },

        divider: "#E7E0EC",
      }),
  },
});


/**
 * @return {App} App object
 */
const App=()=> {
  const [mode, setMode] = React.useState("light");
  const colorMode = React.useMemo(
      () => ({
        toggleColorMode: () => {
          setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
        },
      }),
      [],
  );

  const theme = React.useMemo(
      () =>
        createTheme(getDesignTokens(mode)),
      [mode],
  );

  // simple hash routing: "#gallery" shows the 3D gallery, anything else the home page
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const isGallery = hash === "#gallery";

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <div className="App">
          {/* the gallery is full screen with its own controls */}
          {isGallery ? (
            <React.Suspense fallback={<div style={{position: "fixed", inset: 0, background: "#050505"}} />}>
              <GalleryPage/>
            </React.Suspense>
          ) : <><ResponsiveAppBar /><HomePage/><Footer/></>}
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
