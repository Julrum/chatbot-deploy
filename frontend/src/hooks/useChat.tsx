import { useContext } from "react";

import { ChatContext } from "../contexts/ChatContexts";

const useChat = () => {
  const context = useContext(ChatContext);

  if (!context)
    throw new Error("AuthContext must be placed within AuthProvider");

  return context;
};

export default useChat;
