import { createContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

const ChatContext = createContext<{
  websiteId: string;
  setWebsiteId: Dispatch<SetStateAction<string>>;
} | null>(null);

const ChatProvider = ({
  children,
  initialWebsiteId,
}: {
  children: ReactNode;
  initialWebsiteId: string;
}) => {
  const [websiteId, setWebsiteId] = useState(initialWebsiteId);

  return (
    <ChatContext.Provider
      value={{
        websiteId,
        setWebsiteId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatProvider };
