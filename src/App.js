import * as React from "react";
import "./App.css";
import ResponsiveAppBar from "./layout/AppBar";
import HomePage from "./pages/HomePage";
import Footer from "./layout/Footer";
/**
 * @return {App} App object
 */
function App() {
  return (
    <div className="App">
      <ResponsiveAppBar/>
      <HomePage/>
      <Footer/>
    </div>
  );
}

export default App;
