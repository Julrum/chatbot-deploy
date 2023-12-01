import { dayFormatter } from "../utils/dayFormatter";
import { ChildMessageProps } from "../types/message";

const ChatBubble = ({
  content,
  createdAt,
  id,
  imageUrl,
  role,
  title,
  url,
}: ChildMessageProps & {
  createdAt: number;
  id: string;
}) => (
  <div
    style={{
      display: "flex",
      padding: "10px 20px",
    }}
  >
    {role === "user" && (
      <p
        style={{
          color: "#808080",
          flexGrow: 1,
          margin: "auto 14px 0 0",
          textAlign: "end",
        }}
      >
        {dayFormatter(createdAt, "LT", { locale: "ko", isZuluTime: true })}
      </p>
    )}
    <article
      className={
        role === "user" ? "fill no-padding" : "primary-container no-padding"
      }
      onClick={url ? () => window.open(url, "_blank") : undefined}
      style={{
        boxShadow: "none",
        borderRadius:
          role === "user" ? "12px 12px 0px 12px" : "12px 12px 12px 0px",
        cursor: url ? "pointer" : "default",
        maxWidth: "70%",
        width: "fit-content",
        wordBreak: "break-word",
      }}
    >
      {imageUrl && (
        <img alt="url preview" className="responsive medium" src={imageUrl} />
      )}
      <div style={{ padding: "10px 14px" }}>
        {title && <h5>{title}</h5>}
        <p className="no-line no-margin">{content}</p>
      </div>
    </article>
    {role === "assistant" && (
      <p
        style={{
          color: "#808080",
          flexGrow: 1,
          margin: "auto 0 0 14px",
          textAlign: "start",
        }}
      >
        {dayFormatter(createdAt, "LT", { locale: "ko", isZuluTime: true })}
      </p>
    )}
  </div>
);

export default ChatBubble;
