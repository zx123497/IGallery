import * as React from "react";
import {Box} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import AdbIcon from "@mui/icons-material/Adb";
import Typography from "@mui/material/Typography";
const Footer = ()=>{
  const theme = useTheme();
  return (
    <Box sx={{width: "100%", bgcolor: theme.palette.background.paper, height: "20vh", color: theme.palette.common.white}}>
      <AdbIcon sx={{display: {xs: "none", md: "flex"}, mr: 1}} />
      <Typography
        variant="h6"
        noWrap
        component="a"
        href="/"
        sx={{
          mr: 2,
          display: {xs: "none", md: "flex"},
          fontFamily: "monospace",
          fontWeight: 700,
          letterSpacing: ".3rem",
          color: "inherit",
          textDecoration: "none",
        }}
      >
            IGallery
      </Typography>
    </Box>
  );
};

export default Footer;
