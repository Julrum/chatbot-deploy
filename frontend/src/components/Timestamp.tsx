import styled from "styled-components";
import { Message } from "@orca.ai/pulse";

import { dayFormatter } from "../utils/dayFormatter";

const Paragraph = styled.p<Pick<Message, "role">>`
  color: #808080;
  flex-grow: 1;
  font-size: 12px;
  margin: ${(props) =>
    props.role === "assistant" ? "auto 0 0 8px" : "auto 8px 0 0"};
  min-width: 64px;
  text-align: ${(props) => (props.role === "assistant" ? "start" : "end")};
  width: 100%;
`;

const Timestamp = ({
  role,
  createdAt,
}: Pick<Message, "role" | "createdAt">) => (
  <Paragraph role={role}>
    {dayFormatter(createdAt, "LT", { locale: "ko", isZuluTime: true })}
  </Paragraph>
);

export default Timestamp;
