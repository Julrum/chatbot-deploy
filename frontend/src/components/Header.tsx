import { Close, ThumbUp } from "./Icons";

const Header = ({
  imageUrl,
  name,
  onLikeButtonClick,
  setClose,
}: {
  imageUrl?: string;
  name?: string;
  onLikeButtonClick?: () => void;
  setClose: () => void;
}) => (
  <header className="surface fixed">
    <nav>
      {imageUrl && <img alt="logo" className="round medium" src={imageUrl} />}
      <p className="max" style={{ fontSize: "18px" }}>
        {name}
      </p>
      <button
        aria-label="like"
        className="circle transparent"
        onClick={onLikeButtonClick}
      >
        <i>
          <ThumbUp />
        </i>
      </button>
      <button
        aria-label="close"
        className="circle transparent"
        onClick={setClose}
      >
        <i>
          <Close />
        </i>
      </button>
    </nav>
  </header>
);

export default Header;
