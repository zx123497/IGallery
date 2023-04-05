import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTheme} from "@mui/material";
import PropTypes from "prop-types";
const SliderCard = ({index}) => {
  const theme = useTheme();
  return (<Box sx={{bgcolor: theme.palette.background.paper, height: "100%", width: "100%", borderRadius: theme.spacing(2.5)}}>
    <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "30%", bgcolor: theme.palette.secondary.main, borderRadius: theme.spacing(2.5, 0, 0, 2.5)}}>
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
