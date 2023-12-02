import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import { getMessages, getReply, sendMessage } from "./api/message";
import { createSession, getSession } from "./api/session";
import { getWebsiteData } from "./api/website";
import ChatBubble from "./components/ChatBubble";
import { MessageProps } from "./types/message";
import { WebsiteProps } from "./types/website";

const AppContainer = styled.div`
  height: 100%;
  overflow: hidden;
`;

const Disclaimer = styled.p`
  color: #a0a0a0;
  margin: 23px 30px 29px;
`;

const FooterSpacer = styled.div`
  height: 80px;
  width: 100%;
`;

const WebsiteName = styled.p`
  font-size: 18px;
`;

const Body = styled.main`
  -ms-overflow-style: none;
  height: calc(100% - 64px);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const InputBlock = styled.div`
  display: flex;
  width: 100%;
`;

const InputComponent = styled.div<{ isActive: boolean }>`
  transition: width 150ms ease;
  width: 100%;

  ${({ isActive }) =>
    isActive &&
    css`
      width: calc(100% - 56px);
    `}
`;

const SendButton = styled.button<{ isActive: boolean }>`
  position: fixed;
  right: 16px;
  transform: translateX(200%);
  transition: background-color 150ms ease 0s, transform 150ms ease 0s;
  z-index: -1;

  ${({ isActive }) =>
    isActive &&
    css`
      transform: translateX(0%);
      cursor: pointer;
    `}
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
    <AppContainer>
      <header className="primary fixed">
        <nav>
          {websiteData?.imageUrl && (
            <img
              alt="logo"
              className="round medium"
              src={websiteData?.imageUrl}
            />
          )}
          <WebsiteName className="max">{websiteData?.name}</WebsiteName>
          <button aria-label="contact" className="circle transparent">
            <i>headset_mic</i>
          </button>
          <button
            aria-label="close"
            className="circle transparent"
            onClick={() => {
              window.parent.postMessage("close", "*");
            }}
          >
            <i>close</i>
          </button>
        </nav>
      </header>
      <Body className="scroll" ref={scrollRef}>
        <div className="no-line center-align">
          <Disclaimer className="medium-text">
            {websiteData?.disclaimer}
          </Disclaimer>
        </div>
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
            message.children.map((childMessage, index) => (
              <ChatBubble
                content={childMessage.content}
                createdAt={message.createdAt._nanoseconds}
                id={`${message.id}_${index}`}
                imageUrl={childMessage.imageUrl}
                key={`${message.id}_${index}`}
                role={childMessage.role}
                url={childMessage.url}
              />
            ))
          )
        )}
        <FooterSpacer />
      </Body>
      <footer className="fixed large-blur">
        <nav>
          <InputBlock>
            <InputComponent
              className="field border small round"
              isActive={!!message}
            >
              <input
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                type="text"
                value={message}
                placeholder="Message"
              />
            </InputComponent>
            <SendButton
              aria-label="send"
              className="circle no-padding"
              disabled={!message}
              isActive={!!message}
              onClick={handleSendMessage}
            >
              <i>arrow_upward_alt</i>
            </SendButton>
          </InputBlock>
        </nav>
      </footer>
      <div className="snackbar error" id="snackbar">
        <i>warning</i>
        <span>{errorMessage}</span>
      </div>
    </AppContainer>
  );
};

export default App;
