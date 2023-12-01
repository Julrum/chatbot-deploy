import { useEffect, useRef, useState } from "react";

import { getMessages, getReply, sendMessage } from "./api/message";
import { createSession, getSession } from "./api/session";
import { getWebsiteData } from "./api/website";
import ChatBubble from "./components/ChatBubble";
import { WebsiteProps } from "./types/website";
import { MessageProps } from "./types/message";

const App = () => {
  const [errorMessage, setErrorMessage] = useState("");
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

    theme("#3d7cc9");

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
        const newMessage = await sendMessage(websiteId, sessionId, message);
        setMessages([...messages, newMessage]);
        setMessage("");
        const reply = await getReply(websiteId, sessionId, newMessage.id);
        setMessages([...messages, newMessage, reply]);
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("메시지 전송에 실패했습니다.");
      ui("#snackbar");
    }
  };

  return (
    <div className="App" style={{ height: "100%", overflowY: "hidden" }}>
      <header className="primary-container fixed">
        <nav>
          {websiteData?.imageUrl && (
            <img
              alt="logo"
              className="round medium"
              src={websiteData?.imageUrl}
            />
          )}
          <h5 className="max">{websiteData?.name}</h5>
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
      <main
        className="scroll"
        ref={scrollRef}
        style={{ height: "calc(100% - 144px)" }}
      >
        <div className="no-line center-align">
          <p
            className="medium-text"
            style={{
              margin: "23px 30px 29px",
              color: "#A0A0A0",
            }}
          >
            {websiteData?.disclaimer}
          </p>
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
      </main>
      <footer className="fixed fill">
        <nav className="no-space">
          <div className="max field label  border small left-round">
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
            />
            <label>메시지를 입력하세요</label>
          </div>
          <button
            aria-label="send"
            className="right-round"
            disabled={!message}
            onClick={handleSendMessage}
          >
            <i>send</i>
          </button>
        </nav>
      </footer>
      <div className="snackbar error" id="snackbar">
        <i>warning</i>
        <span>{errorMessage}</span>
      </div>
    </div>
  );
};

export default App;
