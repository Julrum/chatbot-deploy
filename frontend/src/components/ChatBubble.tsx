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
      padding: "4px 20px",
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
      className={`no-padding round ${
        role === "user" ? "fill" : "primary-container"
      }`}
      onClick={url ? () => window.open(url, "_blank") : undefined}
      style={{
        boxShadow: "none",
        cursor: url ? "pointer" : "default",
        maxWidth: "70%",
        width: "fit-content",
        wordBreak: "break-word",
      }}
    >
      {imageUrl && (
        <img
          alt="url preview"
          className="responsive medium"
          onError={(e) => (e.currentTarget.style.display = "none")}
          src={imageUrl}
          style={{ borderRadius: "2rem 2rem 0 0" }}
        />
      )}
      <div style={{ padding: "14px 16px" }}>
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
