import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import IgPhoto from "../components/IgPhoto";
import {Pagination} from "@mui/material";
import FreeSolo from "../components/Search";
import Slider from "../components/Slider";
import RankingList from "../components/RankingList";

const HomePage = () => {
  return (
    <Grid
      container
      columnSpacing={3}
      rowSpacing={2}
      direction="row"

      style={{minHeight: "100vh", padding: ""}}
    >

      <Grid item xs={2}>
        <Box sx={{height: "30vh", bgcolor: "#eed", marginTop: "10px"}}>Logo place</Box>
        <Box sx={{height: "50vh", bgcolor: "#eed", marginTop: "10px"}}><RankingList/></Box>
      </Grid>
      <Grid item xs={8}>
        <Grid
          container
          columnSpacing={3}
          rowSpacing={2}
          direction="row"
          alignItems="center"
          style={{minHeight: "100vh"}}
        >
          <Grid xs={12}><Box sx={{bgcolor: "#eee", height: "30vh"}}><Slider/></Box></Grid>
          <Grid container xs={12}><Grid xs={9}><h2>Instagram Artworks</h2></Grid><Grid container justifyContent='end' alignItems="center" xs><Box sx={{height: "5vh", width: "20em"}}><FreeSolo/></Box></Grid></Grid>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, index) => (
            <Grid item xs={3} key={index}>
              <IgPhoto/>
            </Grid>
          ))}
          <Grid container alignItems="center" justifyContent="center" rowSpacing={-5} xs={12}><Pagination count={10} variant="outlined" color="primary" />
          </Grid>
        </Grid>

      </Grid>
      <Grid item xs={2}>

        <Box sx={{height: "30vh", marginTop: "10px"}}/>
        <Box sx={{height: "50vh", bgcolor: "#eed", marginTop: "10px"}}>chatting room</Box>
      </Grid>


    </Grid>


  );
};

export default HomePage;

