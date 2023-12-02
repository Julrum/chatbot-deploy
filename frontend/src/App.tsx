import { useEffect, useRef, useState } from "react";
import Carousel from "react-slick";
import styled from "styled-components";

import { getMessages, getReply, sendMessage } from "./api/message";
import { createSession, getSession } from "./api/session";
import { getWebsiteData } from "./api/website";
import ChatBubble from "./components/ChatBubble";
import Disclaimer from "./components/Disclaimer";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Timestamp from "./components/Timestamp";
import type { MessageProps } from "./types/message";
import type { WebsiteProps } from "./types/website";

import "./styles/slick.css";

const FooterSpacer = styled.div`
  height: 80px;
  width: 100%;
`;

const Body = styled.main`
  -ms-overflow-style: none;
  height: calc(var(--app-height) - 64px);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MessageContainer = styled.div`
  display: flex;
  margin-top: 8px;
  padding: 0 16px;
  /* 
  @keyframes slideUp {
    from {
      transform: translateY(100vh);
    }
    to {
      transform: translateY(0);
    }
  }

  animation: slideUp 0.5s ease-in-out; */
`;

const CarouselContainer = styled.div`
  margin-top: 8px;
  width: 100%;

  .slick-list {
    margin: 0 -8px;
  }
  .slick-slide > div {
    padding: 0 8px;
  }
`;

const App = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [sessionId, setSessionId] = useState(localStorage.getItem("cb_id"));
  const [websiteData, setWebsiteData] = useState<WebsiteProps>();
  const [websiteId] = useState(window.location.pathname.split("/")[1]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-height",
      `${window.innerHeight}px`
    );

    const theme = async (from: string) => {
      await ui("theme", from);
    };

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
        theme(
          newWebsiteData.primaryColor ?? newWebsiteData.imageUrl ?? "#3d7cc9"
        );
      } catch (error) {
        console.log(error);
        setErrorMessage("챗봇을 불러오는데 실패했습니다.");
        ui("#snackbar");
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
        if (!isSending && message) {
          setIsSending(true);
          const newMessage = await sendMessage(websiteId, sessionId, message);
          setMessages([...messages, newMessage]);
          setMessage("");
          const reply = await getReply(websiteId, sessionId, newMessage.id);
          setMessages([...messages, newMessage, reply]);
          setIsSending(false);
        }
      } else {
        throw new Error("메시지 전송에 실패했습니다. 새로고침 해주세요.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("메시지 전송에 실패했습니다.");
      ui("#snackbar");
    }
  };

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Header imageUrl={websiteData?.imageUrl} name={websiteData?.name} />
      <Body className="scroll" ref={scrollRef}>
        <Disclaimer>{websiteData?.disclaimer}</Disclaimer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((message) =>
            message.children.length === 1 ? (
              <MessageContainer key={message.id}>
                {message.children[0].role === "user" && (
                  <Timestamp
                    role="user"
                    time={message.createdAt._nanoseconds}
                  />
                )}
                <ChatBubble
                  content={message.children[0].content}
                  defaultImage={websiteData?.imageUrl ?? ""}
                  imageUrl={message.children[0].imageUrl}
                  key={message.id}
                  role={message.children[0].role}
                  title={message.children[0].title}
                  url={message.children[0].url}
                />
                {message.children[0].role === "assistant" && (
                  <Timestamp
                    role="assistant"
                    time={message.createdAt._nanoseconds}
                  />
                )}
              </MessageContainer>
            ) : (
              <CarouselContainer key={message.id}>
                <Carousel
                  arrows={false}
                  centerMode
                  className="center"
                  infinite={false}
                >
                  {message.children.map((childMessage, index) => (
                    <ChatBubble
                      content={childMessage.content}
                      defaultImage={websiteData?.imageUrl ?? ""}
                      imageUrl={childMessage.imageUrl}
                      key={`${message.id}_${index}`}
                      role={childMessage.role}
                      title={childMessage.title}
                      url={childMessage.url}
                    />
                  ))}
                </Carousel>
              </CarouselContainer>
            )
          )}
        </div>
        <FooterSpacer />
      </Body>
      <Footer
        handleSendMessage={handleSendMessage}
        message={message}
        setMessage={setMessage}
      />
      <div className="snackbar error" id="snackbar">
        <i>warning</i>
        <span>{errorMessage}</span>
      </div>
    </div>
  );
};

export default App;
