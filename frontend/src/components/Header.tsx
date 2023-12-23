const Header = ({
  imageUrl,
  name,
  onLikeButtonClick,
}: {
  imageUrl?: string;
  name?: string;
  onLikeButtonClick?: () => void;
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
        <i>thumb_up</i>
      </button>
      <button
        aria-label="close"
        className="circle transparent"
        onClick={() => {
          window.parent.postMessage("close", "*");
        }}
      >
        <i>close</i>
      </button>
    </nav>
  </header>
);

export default Header;
