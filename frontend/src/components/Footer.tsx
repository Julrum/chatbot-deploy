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
  position: fixed;
  right: 16px;
  bottom: 20px;
  transform: translateX(200%);
  transition: background-color 150ms ease 0s, transform 150ms ease 0s;

  ${({ $isActive }) =>
    $isActive &&
    css`
      transform: translateX(0%);
      cursor: pointer;
    `}
`;

const Footer = ({
  handleSendMessage,
  message,
  setMessage,
}: {
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
        $isActive={!!message}
        onClick={handleSendMessage}
      >
        <i>arrow_upward_alt</i>
      </SendButton>
    </nav>
  </footer>
);

export default Footer;
