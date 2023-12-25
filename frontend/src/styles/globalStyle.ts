import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
 html,
body {
  height: 100%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background-color: transparent;
  font-family: "Pretendard Variable", Pretendard, -apple-system,
    BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI",
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  word-break: keep-all;
  -webkit-text-size-adjust: none;
  -ms-text-size-adjust: none;
  -moz-text-size-adjust: none;
  -o-text-size-adjust: none;
  scrollbar-width: none;
}
#root {
  height: 100%;
	--app-height: 100%;
}
a {
  color: inherit;
  text-decoration: none;
}
* {
  box-sizing: border-box;
}

@keyframes react-loading-skeleton {
  100% {
    transform: translateX(100%);
  }
}

.react-loading-skeleton {
  --base-color: #ebebeb;
  --highlight-color: #f5f5f5;
  --animation-duration: 1.5s;
  --animation-direction: normal;
  --pseudo-element-display: block; /* Enable animation */

  background-color: var(--base-color);

  width: 100%;
  border-radius: 0.25rem;
  display: inline-flex;
  line-height: 1;

  position: relative;
  user-select: none;
  overflow: hidden;
  z-index: 1; /* Necessary for overflow: hidden to work correctly in Safari */
}

.react-loading-skeleton::after {
  content: ' ';
  display: var(--pseudo-element-display);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background-repeat: no-repeat;
  background-image: linear-gradient(
    90deg,
    var(--base-color),
    var(--highlight-color),
    var(--base-color)
  );
  transform: translateX(-100%);

  animation-name: react-loading-skeleton;
  animation-direction: var(--animation-direction);
  animation-duration: var(--animation-duration);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@media (prefers-reduced-motion) {
  .react-loading-skeleton {
    --pseudo-element-display: none; /* Disable animation */
  }
}

`;
