import * as React from "react";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";

const IgPhoto = ({media})=>{
  return (
    <Box sx={{height: "auto", aspectRatio: "1/1"}} ><img width="100%" height='100%' src={media} loading='lazy'/></Box>
  );
};

IgPhoto.propTypes = {
  media: PropTypes.string,
};
IgPhoto.defaultProps = {
  media: "",
};

export default IgPhoto;
