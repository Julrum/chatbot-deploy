import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

import { getMessages } from "./api/message";
import { createSession, getSession } from "./api/session";
import { getWebsiteData } from "./api/website";
import Chatbot from "./components/Chatbot";
import type { MessageProps } from "./types/message";
import type { WebsiteProps } from "./types/website";

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
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("cb_id") || ""
  );
  const [websiteData, setWebsiteData] = useState<WebsiteProps>();
  const [websiteId] = useState(window.location.pathname.split("/")[1]);

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
        console.log("챗봇을 불러오는데 실패했습니다.");
      }
    };
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      {websiteData ? (
        <>
          <Fab
            $open={open}
            className="square round extra primary-container"
            onClick={() => setOpen(!open)}
          >
            <i className="extra">psychology</i>
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
