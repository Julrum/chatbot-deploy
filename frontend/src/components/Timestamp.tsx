import styled from "styled-components";

import { dayFormatter } from "../utils/dayFormatter";

const Paragraph = styled.p<{ role: "assistant" | "user" }>`
  color: #808080;
  flex-grow: 1;
  font-size: 12px;
  margin: ${(props) =>
    props.role === "assistant" ? "auto 0 0 8px" : "auto 8px 0 0"};
  text-align: ${(props) => (props.role === "assistant" ? "start" : "end")};
  width: 64px;
`;

const Timestamp = ({
  role,
  time,
}: {
  role: "assistant" | "user";
  time: number;
}) => (
  <Paragraph role={role}>
    {dayFormatter(time, "LT", { locale: "ko", isZuluTime: true })}
  </Paragraph>
);

export default Timestamp;
