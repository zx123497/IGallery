import * as React from "react";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";

const IgPhoto = ({media})=>{
  return (
    <Box sx={{height: "auto", aspectRatio: "1/1"}} ><img width="100%" src={media} loading='lazy'/></Box>
  );
};

IgPhoto.propTypes = {
  media: PropTypes.string,
};
IgPhoto.defaultProps = {
  media: "https://play-lh.googleusercontent.com/IeNJWoKYx1waOhfWF6TiuSiWBLfqLb18lmZYXSgsH1fvb8v1IYiZr5aYWe0Gxu-pVZX3",
};

export default IgPhoto;
