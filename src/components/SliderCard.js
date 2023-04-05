import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTheme} from "@mui/material";
import PropTypes from "prop-types";
const SliderCard = ({index}) => {
  const theme = useTheme();
  return (<Box sx={{height: "100%", width: "100%"}}>
    <img style={{position: "absolute"}} src="https://www.bcj.com/wp-content/uploads/2018/05/ANSYS_CC_4362_medium.jpg"/>
    <Box style={{position: "absolute", background: `linear-gradient(to right, ${theme.palette.background.default}, 80%, rgba(0,0,0,0))`}} sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "30%"}}>
      <Typography
        variant="h6"
        noWrap
        component="a"
        sx={{
          mr: 2,
          display: {xs: "none", md: "flex"},
          fontFamily: "monospace",
          fontWeight: 700,
          letterSpacing: ".3rem",
          color: theme.palette.text.primary,
          textDecoration: "none",
        }}
      >
        {"Slider " + index}
      </Typography>
    </Box>

  </Box>);
};

SliderCard.propTypes ={
  index: PropTypes.number,
};
SliderCard.defaultProps={
  index: 0,
};

export default SliderCard;
