import type { ReactNode } from "react";

const Disclaimer = ({ children }: { children: ReactNode }) => (
  <div className="no-line center-align">
    <p
      className="medium-text"
      style={{ color: "#a0a0a0", margin: "23px 30px 29px" }}
    >
      {children}
    </p>
  </div>
);

export default Disclaimer;
