import styled from "styled-components";

import type { ChildMessageProps } from "../types/message";

const Bubble = styled.article<{ $isCard: boolean }>`
  box-shadow: none;
  cursor: ${({ $isCard }) => ($isCard ? "pointer" : "default")};
  width: ${({ $isCard }) => ($isCard ? "100%" : "fit-content")};
  word-break: break-word;
  max-width: 400px;
`;

const Image = styled.img`
  border-radius: 2rem 2rem 0 0;
  height: 100%;
  object-fit: cover;
  width: 100%;
`;

const TextBlock = styled.div<{ $isCard: boolean }>`
  padding: ${({ $isCard }) => ($isCard ? "14px 16px" : "10px 16px")};
`;

const Title = styled.h6`
  font-size: 14px;
`;

const Content = styled.p<{ $isCard: boolean }>`
  font-size: ${({ $isCard }) => ($isCard ? "12px" : "16px")};
`;

const ChatBubble = ({
  content,
  defaultImage,
  imageUrl,
  role,
  title,
  url,
}: ChildMessageProps & { defaultImage: string }) => {
  const isCard = !!(url || imageUrl || title);

  return (
    <Bubble
      className={`no-padding no-margin round ${
        role === "user" ? "primary-container" : "fill"
      }`}
      onClick={url ? () => window.open(url, "_blank") : undefined}
      $isCard={isCard}
    >
      {isCard && (
        <Image
          alt="url preview"
          className="responsive medium"
          onError={(e) => (e.currentTarget.src = defaultImage)}
          src={imageUrl ?? defaultImage}
        />
      )}
      <TextBlock $isCard={isCard}>
        {title && <Title>{title}</Title>}
        <Content className="no-line no-margin" $isCard={isCard}>
          {content}
        </Content>
      </TextBlock>
    </Bubble>
  );
};

export default ChatBubble;
