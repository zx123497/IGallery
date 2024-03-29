import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import IgPhoto from "../components/IgPhoto";
import {Pagination} from "@mui/material";
import FreeSolo from "../components/Search";
import Slider from "../components/Slider";
import RankingList from "../components/RankingList";
import ChatBox from "../components/chatbox/ChatBox";
import {useTheme} from "@mui/material/styles";
import DataService from "../services/GetDataService";
import TokenService from "../services/TokenService";
// import ChatBox from "../components/chatbox/ChatBox";

const HomePage = () => {
  const theme = useTheme();
  const [posts, setPosts] = React.useState([]);


  // do update posts, if token changed then do this effect
  React.useEffect(()=>{
    DataService.getDataAsync().then(
        (res)=>{
          const temp = [];
          res.data.forEach((post)=>{
            temp.push(post.media_url);
          });
          setPosts(temp);
        });
  }, []);

  // Get OAuth token and call get token
  React.useEffect(()=>{
    const rawCode = window.location.search;
    if (rawCode !== ( "" || null)) {
      const code = rawCode.replace("?code=", "").replace("#_", "");
      const data = {"code": code};
      TokenService.getTokenAsync(data).then((res)=>{
      });
    }
  }, []);


  return (
    // layout
    <Grid
      container
      columnSpacing={3}
      rowSpacing={2}
      direction="row"

      sx={{minHeight: "100vh", margin: 0, bgcolor: theme.palette.background.default}}
    >
      {/* layout: artist ranking start. invisible if lower than md */}
      <Grid sx={{[theme.breakpoints.down("md")]: {display: "none"}}} item xs={0} sm={0} md={2.5}>
        <Box sx={{height: "30vh", marginTop: "10px"}}/>
        <Box sx={{height: "50vh", marginTop: "10px"}}>
          <RankingList/>
        </Box>
      </Grid>
      {/* layout: main post display. */}
      <Grid item xs={12} sm={12} md={7}>
        <Grid
          container
          columnSpacing={3}
          rowSpacing={2}
          direction="row"
          alignItems="center"
          style={{minHeight: "100vh"}}
        >
          {/* top slider */}
          <Grid xs={12}>
            <Box sx={{height: "30vh"}}>
              <Slider/>
            </Box>
          </Grid>
          {/* artwork topic and search */}
          <Grid container xs={12}><Grid xs={9}><h2 style={{color: theme.palette.text.primary}}>Instagram Artworks</h2></Grid><Grid container justifyContent='end' alignItems="center" xs><Box sx={{height: "5vh", width: "20em"}}><FreeSolo/></Box></Grid></Grid>
          {/* artwork main area */}
          {posts.length !== 0 ? posts.map((media, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <IgPhoto media={media}/>
            </Grid>
          )): [1, 2, 3, 4, 5].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <IgPhoto />
            </Grid>
          ))
          }
          {/* pagination */}
          <Grid container alignItems="center" justifyContent="center" rowSpacing={-5} xs={12}>
            <Pagination count={10} variant="outlined" color="primary" />
          </Grid>
        </Grid>

      </Grid>
      {/* chatbox */}
      <Grid item xs={12} sm={12} md={2.5}>

        <Box sx={{height: "30vh", marginTop: "10px"}}/>
        <Box sx={{height: "max-content", bgcolor: theme.palette.background.paper, marginTop: "10px"}}><ChatBox/></Box>
      </Grid>


    </Grid>


  );
};

export default HomePage;

