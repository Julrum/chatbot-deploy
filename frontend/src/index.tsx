import React from "react";
import ReactDOM from "react-dom/client";
import { StyleSheetManager } from "styled-components";

import { ChatProvider } from "./contexts/ChatContexts";
import { GlobalStyle } from "./styles/globalStyle";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

declare global {
  interface Window {
    materialDynamicColors: (from: string) => void;
    ui: any;
    orca: {
      setup: (id: string) => void;
      config?: {
        id: string;
      };
    };
  }
}

window.orca = window.orca || {};
window.orca.setup = (id: string) => {
  const container = document.createElement("div");
  container.classList.add("orca-chat");
  const domElement = document.getElementsByTagName("body")[0];
  domElement.appendChild(container);
  const shadowRoot = container.attachShadow({ mode: "open" });
  const styleSlot = document.createElement("section");
  shadowRoot.appendChild(styleSlot);

  const beercssCss = document.createElement("link");
  beercssCss.rel = "stylesheet";
  beercssCss.href =
    "https://cdn.jsdelivr.net/npm/beercss@3.4.10/dist/cdn/beer.min.css";
  styleSlot.appendChild(beercssCss);

  const beercssJs = document.createElement("script");
  beercssJs.type = "module";
  beercssJs.src =
    "https://cdn.jsdelivr.net/npm/beercss@3.4.10/dist/cdn/beer.min.js";
  styleSlot.appendChild(beercssJs);

  const slickCss = document.createElement("link");
  slickCss.rel = "stylesheet";
  slickCss.type = "text/css";
  slickCss.href =
    "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css";
  styleSlot.appendChild(slickCss);

  const slickThemeCss = document.createElement("link");
  slickThemeCss.rel = "stylesheet";
  slickThemeCss.type = "text/css";
  slickThemeCss.href =
    "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css";
  styleSlot.appendChild(slickThemeCss);

  const pretendardDyanmicSubset = document.createElement("link");
  pretendardDyanmicSubset.as = "style";
  pretendardDyanmicSubset.crossOrigin = "anonymous";
  pretendardDyanmicSubset.rel = "stylesheet";
  pretendardDyanmicSubset.href =
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css";
  styleSlot.appendChild(pretendardDyanmicSubset);

  const pretendardVariableDynamicSubset = document.createElement("link");
  pretendardVariableDynamicSubset.as = "style";
  pretendardVariableDynamicSubset.crossOrigin = "anonymous";
  pretendardVariableDynamicSubset.rel = "stylesheet";
  pretendardVariableDynamicSubset.href =
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";
  styleSlot.appendChild(pretendardVariableDynamicSubset);

  const roboto = document.createElement("link");
  roboto.rel = "stylesheet";
  roboto.href =
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap";

  const renderIn = document.createElement("div");
  styleSlot.appendChild(renderIn);

  const root = ReactDOM.createRoot(shadowRoot);

  root.render(
    <React.StrictMode>
      <StyleSheetManager target={styleSlot}>
        <GlobalStyle />
        <ChatProvider initialWebsiteId={id}>
          <App />
        </ChatProvider>
      </StyleSheetManager>
    </React.StrictMode>
  );
};

reportWebVitals();
