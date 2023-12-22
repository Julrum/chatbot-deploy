import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Carousel from "react-slick";
import styled from "styled-components";

import { getReply, sendMessage } from "../api/message";
import type { MessageProps } from "../types/message";
import type { WebsiteProps } from "../types/website";

import ChatBubble from "./ChatBubble";
import Disclaimer from "./Disclaimer";
import Footer from "./Footer";
import Header from "./Header";
import Timestamp from "./Timestamp";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-loading-skeleton/dist/skeleton.css";

const FooterSpacer = styled.div`
  height: 80px;
  width: 100%;
`;

const Body = styled.main`
  -ms-overflow-style: none;
  height: calc(100% - 64px);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    height: calc(var(--app-height) - 64px);
  }
`;

const MessageContainer = styled.div`
  display: flex;
  margin-top: 8px;
  padding: 0 16px;
  width: 100%;
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

const Chatbot = ({
  initialMessages,
  sessionId,
  setClose,
  websiteData,
}: {
  initialMessages: MessageProps[];
  sessionId: string;
  setClose: () => void;
  websiteData: WebsiteProps;
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>(initialMessages);
  const [websiteId] = useState(window.location.pathname.split("/")[1]);

  const scrollRef = useRef<HTMLDivElement>(null);

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
          setMessages([
            ...messages,
            {
              role: "user",
              children: [{ content: message }],
              id: "temp",
              createdAt: new Date().toISOString(),
            },
          ]);
          setMessage("");
          const newMessage = await sendMessage(websiteId, sessionId, message);
          const reply = await getReply(websiteId, sessionId, newMessage.id);
          setMessages([...messages, newMessage, ...reply]);
          setIsSending(false);
        }
      } else {
        throw new Error("메시지 전송에 실패했습니다. 새로고침 해주세요.");
      }
    } catch (error) {
      console.log(error);
      setIsSending(false);
      setErrorMessage("메시지 전송에 실패했습니다.");
      ui("#snackbar");
    }
  };

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Header
        imageUrl={websiteData?.imageUrl}
        name={websiteData?.name}
        setClose={setClose}
      />
      <Body className="scroll surface" ref={scrollRef}>
        <Disclaimer>{websiteData?.disclaimer}</Disclaimer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((message) =>
            message.children.length === 0 ? null : message.children.length ===
              1 ? (
              <MessageContainer key={message.id}>
                {message.role === "user" && (
                  <div style={{ flexGrow: 1, width: "64px" }} />
                )}
                <ChatBubble
                  content={message.children[0].content}
                  defaultImage={websiteData?.imageUrl ?? ""}
                  imageUrl={message.children[0].imageUrl}
                  key={message.id}
                  role={message.role}
                  title={message.children[0].title}
                  url={message.children[0].url}
                />
                {message.role === "assistant" && (
                  <div style={{ flexGrow: 1, width: "64px" }} />
                )}
              </MessageContainer>
            ) : (
              <CarouselContainer key={message.id}>
                <Carousel
                  arrows={false}
                  centerMode
                  className="center"
                  infinite={false}
                  slidesToScroll={5}
                  slidesToShow={5}
                  responsive={[
                    {
                      breakpoint: 1024,
                      settings: {
                        arrows: false,
                        centerMode: false,
                        dots: true,
                        infinite: true,
                        slidesToScroll: 3,
                        slidesToShow: 3,
                      },
                    },
                    {
                      breakpoint: 600,
                      settings: {
                        arrows: false,
                        centerMode: false,
                        initialSlide: 2,
                        slidesToScroll: 2,
                        slidesToShow: 2,
                      },
                    },
                    {
                      breakpoint: 480,
                      settings: {
                        arrows: false,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                      },
                    },
                  ]}
                >
                  {message.children.map((childMessage, index) => (
                    <ChatBubble
                      content={childMessage.content}
                      defaultImage={websiteData?.imageUrl ?? ""}
                      imageUrl={childMessage.imageUrl}
                      key={`${message.id}_${index}`}
                      role={message.role}
                      title={childMessage.title}
                      url={childMessage.url}
                    />
                  ))}
                </Carousel>
              </CarouselContainer>
            )
          )}
          {messages[messages.length - 1]?.role &&
            messages[messages.length - 1].createdAt && (
              <div style={{ padding: "8px 16px" }}>
                <Timestamp
                  role={messages[messages.length - 1].role}
                  time={messages[messages.length - 1].createdAt}
                />
              </div>
            )}
          {isSending && (
            <MessageContainer>
              <ChatBubble
                content={
                  <div style={{ width: "250px" }}>
                    <Skeleton />
                  </div>
                }
                role="assistant"
                defaultImage=""
              />
            </MessageContainer>
          )}
        </div>
        <FooterSpacer />
      </Body>
      <Footer
        isSending={isSending}
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

export default Chatbot;
