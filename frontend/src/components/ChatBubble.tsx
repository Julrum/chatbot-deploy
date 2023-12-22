import type { ReactNode } from "react";
import styled, { css } from "styled-components";
import type { ChildMessage, Message } from "@orca.ai/pulse";

const Bubble = styled.article<{ $isCard: boolean }>`
  box-shadow: none;
  cursor: ${({ $isCard }) => ($isCard ? "pointer" : "default")};
  max-height: ${({ $isCard }) => ($isCard ? "350px" : "none")};
  max-width: 400px;
  width: ${({ $isCard }) => ($isCard ? "100%" : "fit-content")};
  word-break: break-word;
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

const Title = styled.h6<{ $isCard: boolean }>`
  border-radius: 0;
  font-size: 14px;

  ${({ $isCard }) =>
    $isCard &&
    css`
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      word-break: break-all;
    `};
`;

const Content = styled.p<{ $isCard: boolean }>`
  border-radius: 0;
  font-size: 16px;

  ${({ $isCard }) =>
    $isCard &&
    css`
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      word-break: keep-all;
    `};
`;

const ChatBubble = ({
  content,
  defaultImage,
  imageUrl,
  role,
  title,
  url,
}: Omit<ChildMessage, "content"> &
  Pick<Message, "role"> & {
    content: ReactNode;
    defaultImage: string;
  }) => {
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
        {title && <Title $isCard={isCard}>{title}</Title>}
        <Content className="no-line no-margin" $isCard={isCard}>
          {content}
        </Content>
      </TextBlock>
    </Bubble>
  );
};

export default ChatBubble;
