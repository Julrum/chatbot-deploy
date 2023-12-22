const Header = ({
  imageUrl,
  name,
  setClose,
}: {
  imageUrl?: string;
  name?: string;
  setClose: () => void;
}) => (
  <header className="surface fixed">
    <nav>
      {imageUrl && <img alt="logo" className="round medium" src={imageUrl} />}
      <p className="max" style={{ fontSize: "18px" }}>
        {name}
      </p>
      <button
        aria-label="close"
        className="circle transparent"
        onClick={setClose}
      >
        <i>close</i>
      </button>
    </nav>
  </header>
);

export default Header;
