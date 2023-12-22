import styled, { css } from "styled-components";

const InputComponent = styled.div<{ $isActive: boolean }>`
  transition: width 150ms ease;
  width: 100%;

  ${({ $isActive }) =>
    $isActive &&
    css`
      width: calc(100% - 56px);
    `}

  input {
    box-shadow: none !important;
  }
`;

const SendButton = styled.button<{ $isActive: boolean }>`
  bottom: 20px;
  opacity: 0 !important;
  position: fixed;
  right: 16px;
  transition: opacity 150ms ease 0s;

  ${({ $isActive }) =>
    $isActive &&
    css`
      cursor: pointer;
      opacity: 1 !important;
      transform: translateX(0%);
    `}
`;

const Footer = ({
  isSending,
  handleSendMessage,
  message,
  setMessage,
}: {
  isSending: boolean;
  handleSendMessage: () => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <footer className="fixed surface">
    <nav>
      <InputComponent className="field small round fill" $isActive={!!message}>
        <input
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.nativeEvent.isComposing) return;
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
        disabled={!message || isSending}
        $isActive={!!message}
        onClick={handleSendMessage}
      >
        <i>arrow_upward_alt</i>
      </SendButton>
    </nav>
  </footer>
);

export default Footer;
