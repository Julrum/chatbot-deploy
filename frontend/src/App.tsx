import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { ChatClient } from "@orca.ai/pulse";
import type { Message, Website } from "@orca.ai/pulse";

import Chatbot from "./components/Chatbot";
import { QuickReply } from "./components/Icons";
import useChat from "./hooks/useChat";
import { setTheme } from "./utils/setTheme";

const Fab = styled.button<{ $open: boolean }>`
  border-radius: 10px;
  border: none;
  bottom: 3%;
  box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.151);
  cursor: pointer;
  height: 80px !important;
  position: fixed;
  right: 3%;
  width: 80px !important;
  z-index: 10;
  @media (max-width: 768px) {
    height: 60px;
    width: 60px;
  }
  ${({ $open }) =>
    $open === true
      ? css`
          opacity: 0;
          pointer-events: none;
          transform: translateY(100%);
          transition: transform 300ms cubic-bezier(0.85, 0, 0.6, 1) 0s,
            opacity 150ms linear 0s;
        `
      : css`
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0%);
          transition: transform 300ms cubic-bezier(0, 0.95, 0.1, 1) 0s,
            opacity 150ms linear 0s;
        `}
  i {
    ---size: 3rem;
  }
`;

const ChatbotWrapper = styled.div<{ $isActive: boolean }>`
  border-radius: 10px;
  bottom: 3%;
  box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.151);
  height: 700px;
  position: fixed;
  right: 3%;
  width: 380px;
  z-index: 11;
  @media (max-width: 768px) {
    border-radius: 0;
    bottom: 0;
    box-shadow: none;
    height: 100vh;
    right: 0;
    width: 100vw;
  }
  ${({ $isActive }) =>
    $isActive === true
      ? css`
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0%);
          transition: transform 300ms cubic-bezier(0, 0.95, 0.1, 1) 0s,
            opacity 150ms linear 0s;
        `
      : css`
          opacity: 0;
          pointer-events: none;
          transform: translateY(100%);
          transition: transform 300ms cubic-bezier(0.85, 0, 0.6, 1) 0s,
            opacity 150ms linear 0s;
        `}
`;

const App = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("cb_id") || ""
  );
  const [websiteData, setWebsiteData] = useState<Website>();
  const { websiteId } = useChat();

  const ref = useRef<HTMLDivElement>(null);

  const chatClient = new ChatClient(
    `${process.env.REACT_APP_API_URL}/chat` ?? ""
  );

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-height",
      `${window.innerHeight}px`
    );

    const setSession = async () => {
      const newSessionID = await chatClient.addSession(websiteId, {
        id: null,
        createdAt: null,
        deletedAt: null,
      });
      if (newSessionID.id === null)
        throw new Error("세션 생성에 실패했습니다.");
      localStorage.setItem("cb_id", newSessionID.id);
      setSessionId(newSessionID.id);
      const newMessages = await chatClient.listMessages(
        websiteId,
        newSessionID.id
      );
      setMessages(newMessages);
    };

    const initializeSession = async () => {
      try {
        if (!sessionId) {
          setSession();
        } else {
          try {
            await chatClient.getSession(websiteId, sessionId);
            const newMessages = await chatClient.listMessages(
              websiteId,
              sessionId
            );
            setMessages(newMessages);
          } catch {
            setSession();
          }
        }
        const newWebsiteData = await chatClient.getWebsite(websiteId);
        setWebsiteData(newWebsiteData);
        setTheme(
          newWebsiteData.primaryColor ?? newWebsiteData.imageUrl ?? "#3d7cc9",
          ref,
          "light"
        );
      } catch (error) {
        console.log(error);
        console.log("챗봇을 불러오는데 실패했습니다.");
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      style={{
        height: "100vh",
        overflow: "hidden",
        pointerEvents: "none",
        position: "fixed",
        right: 0,
        top: 0,
        width: "100vw",
      }}
    >
      {websiteData ? (
        <>
          <Fab
            $open={open}
            className="square round extra primary-container"
            onClick={() => setOpen(!open)}
          >
            <i className="extra">
              <QuickReply />
            </i>
          </Fab>
          <ChatbotWrapper $isActive={open}>
            <Chatbot
              initialMessages={messages}
              sessionId={sessionId}
              setClose={() => setOpen(false)}
              websiteData={websiteData}
            />
          </ChatbotWrapper>
        </>
      ) : null}
    </div>
  );
};

export default App;
