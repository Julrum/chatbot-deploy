import { Box, Typography } from "@mui/material";

import { dayFormatter } from "../utils/dayFormatter";
import { ChildMessageProps } from "../types/message";

const ChatBubble = ({
  content,
  createdAt,
  id,
  imageUrl,
  role,
  title,
  url,
}: ChildMessageProps & {
  createdAt: number;
  id: string;
}) => (
  <Box
    sx={{
      display: "flex",
      px: "30px",
      py: "16px",
    }}
  >
    {role === "user" && (
      <Box
        sx={{
          color: "#808080",
          flexGrow: 1,
          mr: "14px",
          mt: "auto",
          textAlign: "end",
        }}
      >
        {dayFormatter(createdAt, "LT", { locale: "ko", isZuluTime: true })}
      </Box>
    )}
    <Box
      onClick={url ? () => window.open(url, "_blank") : undefined}
      sx={{
        backgroundColor: role === "user" ? "#FFFFFF" : "primary.main",
        border: role === "user" ? "1px solid #808080" : "none",
        borderRadius:
          role === "user" ? "12px 12px 0px 12px" : "12px 12px 12px 0px",
        maxWidth: "248px",
        px: "20px",
        py: "10px",
        width: "fit-content",
        wordBreak: "break-word",
      }}
    >
      {imageUrl && (
        <Box
          sx={{
            width: "208px",
            img: {
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              height: "208px",
              objectFit: "cover",
              width: "100%",
            },
          }}
        >
          <img src={imageUrl} alt="url preview" />
        </Box>
      )}
      {title && (
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {title}
        </Typography>
      )}
      <Typography sx={{ fontSize: "16px" }}>{content}</Typography>
    </Box>
    {role === "assistant" && (
      <Box
        sx={{
          color: "#808080",
          flexGrow: 1,
          ml: "14px",
          mt: "auto",
          textAlign: "start",
        }}
      >
        {dayFormatter(createdAt, "LT")}
      </Box>
    )}
  </Box>
);

export default ChatBubble;
