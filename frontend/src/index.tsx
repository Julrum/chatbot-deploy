import React from "react";
import ReactDOM from "react-dom/client";

import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { getDesignTokens } from "./styles/theme";

const theme = createTheme({
  ...getDesignTokens("light"),
});

const globalStyle = (
  <GlobalStyles
    styles={(theme) => ({
      "html, body, #root": {
        height: "100%",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        fontFamily: theme.typography.fontFamily,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        fontSize: theme.typography.fontSize,
        lineHeight: "1.8rem",
        wordBreak: "keep-all",
        WebkitTextSizeAdjust: "none",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      },
      "#__next": {
        height: "100%",
      },
      a: {
        color: "inherit",
        textDecoration: "none",
      },
      "*": {
        boxSizing: "border-box",
      },
    })}
  />
);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {globalStyle}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
