import * as React from "react";
import "./App.css";
import ResponsiveAppBar from "./layout/AppBar";
import HomePage from "./pages/HomePage";
import Footer from "./layout/Footer";
import {ThemeProvider, createTheme} from "@mui/material/styles";
import ColorModeContext from "./themes/ToggleContext";


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

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <div className="App">
          <ResponsiveAppBar />
          <HomePage/>
          <Footer/>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
