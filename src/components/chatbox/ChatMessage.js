import React from "react";
import PropTypes from "prop-types";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {spacing} from "@mui/system";
import {Box} from "@mui/system";
import {useTheme} from "@mui/material/styles";


const ChatMessages = ({avatar, messages, side}) => {
  const msgFirstStyle = (side)=>{
    return side==="right"?{borderTopRightRadius: spacing(2.5)}:{borderTopLeftRadius: spacing(2.5)};
  };
  const theme = useTheme();
  return (
    <Grid
      container
      spacing={2}
      justifyContent={side === "right" ? "flex-end" : "flex-start"}
    >
      {side === "left" && (
        <Grid item>
          <Avatar src={avatar} sx={{width: spacing(3), height: spacing(3)}}/>
        </Grid>
      )}
      <Grid item xs={8}>
        {messages.map((msg, i) => (
          <Box sx={[side=="right"?{textAlign: "right"}:{textAlign: "left"}]} key={i}>
            <Typography
              align={"left"}
              sx={[{
                boxSizing: "content-box",
                padding: "10px",
                borderRadius: 4,
                marginBottom: .5,
                display: "inline-block",
                wordBreak: "break-all",
                fontFamily:
        // eslint-disable-next-line max-len
        "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"",

              }, side=="right"?{
                borderTopLeftRadius: spacing(2.5),
                borderBottomLeftRadius: spacing(2.5),
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
              }:{
                borderTopRightRadius: spacing(2.5),
                borderBottomRightRadius: spacing(2.5),
                backgroundColor: theme.palette.grey[100],
              }, i===0?msgFirstStyle(side):{},
            i===messages.length-1?side==="right"?{borderBottomRightRadius: spacing(2.5), marginBottom: 2}:{borderBottomLeftRadius: spacing(2.5), marginBottom: 2}:{}]}
            >
              {msg}
            </Typography>
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};

ChatMessages.propTypes = {
  avatar: PropTypes.string,
  messages: PropTypes.arrayOf(PropTypes.string),
  side: PropTypes.oneOf(["left", "right"]),
};
ChatMessages.defaultProps = {
  avatar: "",
  messages: [],
  side: "left",
};

export default ChatMessages;
