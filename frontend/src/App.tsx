import { useEffect, useRef, useState } from "react";

import {
  AppBar,
  Box,
  IconButton,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  HeadsetMic as HeadsetMicIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { getMessages, getReply, sendMessage } from "./api/message";
import { createSession, getSession } from "./api/session";
import { getWebsiteData } from "./api/website";
import ChatBubble from "./components/ChatBubble";
import { WebsiteProps } from "./types/website";
import { MessageProps } from "./types/message";

const App = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [sessionId, setSessionId] = useState(localStorage.getItem("cb_id"));
  const [websiteData, setWebsiteData] = useState<WebsiteProps>();
  const [websiteId] = useState(window.location.pathname.split("/")[1]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setSession = async () => {
      const newSessionID = await createSession(websiteId);
      localStorage.setItem("cb_id", newSessionID.id);
      setSessionId(newSessionID.id);
      const newMessages = await getMessages(websiteId, newSessionID.id);
      setMessages(newMessages);
    };

    const initializeSession = async () => {
      try {
        if (!sessionId) {
          setSession();
        } else {
          try {
            await getSession(websiteId, sessionId);
            const newMessages = await getMessages(websiteId, sessionId);
            setMessages(newMessages);
          } catch {
            setSession();
          }
        }
        const newWebsiteData = await getWebsiteData(websiteId);
        setWebsiteData(newWebsiteData);
      } catch (error) {
        console.log(error);
      }
    };
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current?.scrollHeight) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    try {
      if (sessionId) {
        const newMessage = await sendMessage(websiteId, sessionId, message);
        setMessages([...messages, newMessage]);
        setMessage("");
        const reply = await getReply(websiteId, sessionId, newMessage.id);
        setMessages([...messages, newMessage, reply]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box className="App" sx={{ height: "100%", overflowY: "hidden" }}>
      <AppBar position="static" sx={{ height: "96px" }}>
        <Toolbar variant="dense" sx={{ py: "18px", px: "36px" }}>
          {websiteData?.imageUrl && (
            <img
              src={websiteData?.imageUrl}
              alt="logo"
              width="60px"
              height="60px"
            />
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: "24px",
              fontWeight: "bold",
              ml: "12px",
            }}
          >
            {websiteData?.name}
          </Typography>
          <IconButton color="inherit" aria-label="menu">
            <HeadsetMicIcon />
          </IconButton>
          <IconButton color="inherit" aria-label="menu">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        ref={scrollRef}
        sx={{ overflowY: "auto", height: "calc(100% - 176px)" }}
      >
        <Typography
          component="div"
          mb="29px"
          mt="23px"
          mx="30px"
          textAlign="center"
          fontSize="12px"
          color="#A0A0A0"
        >
          {websiteData?.disclaimer}
        </Typography>
        {messages.map((message) =>
          message.children.length === 1 ? (
            <ChatBubble
              content={message.children[0].content}
              createdAt={message.createdAt._nanoseconds}
              id={message.id}
              imageUrl={message.children[0].imageUrl}
              key={message.id}
              role={message.children[0].role}
              url={message.children[0].url}
            />
          ) : (
            message.children.map((childMessage) => (
              <ChatBubble
                content={childMessage.content}
                createdAt={message.createdAt._nanoseconds}
                id={message.id}
                imageUrl={childMessage.imageUrl}
                key={message.id}
                role={childMessage.role}
                url={childMessage.url}
              />
            ))
          )
        )}
      </Box>
      <Box
        sx={{
          height: "80px",
          backgroundColor: "transparent",
          px: "30px",
          py: "16px",
          display: "flex",
          borderTop: "1px solid #A0A0A0",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            placeholder="메시지를 입력하세요"
            size="small"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
        </Box>
        <Box>
          <IconButton
            color="inherit"
            aria-label="menu"
            disabled={!message}
            onClick={handleSendMessage}
          >
            <SendIcon fontSize="large" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default App;
