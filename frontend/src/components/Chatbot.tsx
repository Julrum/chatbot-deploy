import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Carousel from "react-slick";
import styled from "styled-components";
import {
  ChatClient,
  LikeClient,
  MessageRole,
  invalidMessageId,
} from "@orca.ai/pulse";
import type { LikeUnLike, Message, Website } from "@orca.ai/pulse";

import ChatBubble from "./ChatBubble";
import Disclaimer from "./Disclaimer";
import Footer from "./Footer";
import Header from "./Header";
import { Warning } from "./Icons";
import LikeDialog from "./LikeDialog";
import Timestamp from "./Timestamp";
import useChat from "../hooks/useChat";

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
  initialMessages: Message[];
  sessionId: string;
  setClose: () => void;
  websiteData: Website;
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [open, setOpen] = useState(false);
  const { websiteId } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  const chatClient = new ChatClient(
    `${process.env.REACT_APP_API_URL}/chat` ?? ""
  );
  const likeClient = new LikeClient(
    `${process.env.REACT_APP_API_URL}/like` ?? ""
  );

  useEffect(() => {
    if (scrollRef.current?.scrollHeight) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const snackbarTimer = setTimeout(() => {
      setErrorMessage("");
    }, 3000);
    return () => clearTimeout(snackbarTimer);
  }, [errorMessage]);

  const handleSendMessage = async () => {
    try {
      if (sessionId) {
        if (!isSending && message) {
          setIsSending(true);
          const messageToSend = {
            role: MessageRole.user,
            children: [
              { title: null, content: message, imageUrl: null, url: null },
            ],
            id: "temp",
            createdAt: new Date(),
            deletedAt: null,
          };
          setMessages([...messages, messageToSend]);
          setMessage("");
          const newMessage = await chatClient.addMessage(
            websiteId,
            sessionId,
            messageToSend
          );
          if (newMessage.id === null)
            throw new Error("메시지 전송에 실패했습니다. 새로고침 해주세요.");
          const reply = await chatClient.getRepliesOfMessage(
            websiteId,
            sessionId,
            newMessage.id
          );
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
    }
  };

  const handleLike = async (isLike: LikeUnLike, comment: string) => {
    if (sessionId) {
      try {
        await likeClient.sendLikeOrUnlike(
          websiteId,
          sessionId,
          messages[messages.length - 1]
            ? messages[messages.length - 1].id ?? invalidMessageId
            : invalidMessageId,
          isLike,
          comment
        );
      } catch (error) {
        console.error(error);
        setErrorMessage("의견을 보내는데 실패했습니다.");
      }
    }
  };

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Header
        imageUrl={websiteData?.imageUrl}
        name={websiteData?.name}
        onLikeButtonClick={async () => {
          setOpen(true);
        }}
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
                  createdAt={messages[messages.length - 1].createdAt}
                  role={messages[messages.length - 1].role}
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
                imageUrl={null}
                title={null}
                url={null}
                defaultImage=""
                role={MessageRole.assistant}
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
      <div
        className={`snackbar error ${errorMessage ? "active" : ""}`}
        id="snackbar"
      >
        <i>
          <Warning />
        </i>
        <span>{errorMessage}</span>
      </div>
      <LikeDialog
        id="likeDialog"
        handleLike={handleLike}
        open={open}
        setOpen={setOpen}
      />
    </div>
  );
};

export default Chatbot;
