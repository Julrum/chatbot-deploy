const Header = ({ imageUrl, name }: { imageUrl?: string; name?: string }) => (
  <header className="surface fixed">
    <nav>
      {imageUrl && <img alt="logo" className="round medium" src={imageUrl} />}
      <p className="max" style={{ fontSize: "18px" }}>
        {name}
      </p>
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
