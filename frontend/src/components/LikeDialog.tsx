import { useState } from "react";

const LikeDialog = ({
  id,
  setErrorMessage,
}: {
  id?: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isLike, setIsLike] = useState(true);
  const [message, setMessage] = useState("");

  return (
    <dialog className="top" id={id}>
      <header>
        <nav className="no-space">
          <h6 className="max">의견을 남겨주세요.</h6>
          <button
            className="transparent circle large"
            onClick={() => {
              setIsLike(true);
            }}
          >
            <i className={isLike ? "fill" : ""}>thumb_up</i>
          </button>
          <button
            className="transparent circle large"
            onClick={() => {
              setIsLike(false);
            }}
          >
            <i className={isLike ? "" : "fill"}>thumb_down</i>
          </button>
        </nav>
      </header>
      <div>
        <div className="field textarea border">
          <textarea
            onChange={(event) => {
              setMessage(event.target.value);
            }}
            placeholder="의견을 자유롭게 적어주세요."
            value={message}
          />
        </div>
      </div>
      <nav className="right-align">
        <button className="border" onClick={() => ui("#likeDialog")}>
          취소
        </button>
        <button
          onClick={() => {
            try {
            } catch (error) {
              console.error(error);
              setErrorMessage("의견을 보내는데 실패했습니다.");
              ui("#snackbar");
            }

            ui("#likeDialog");
            setIsLike(true);
            setMessage("");
          }}
        >
          보내기
        </button>
      </nav>
    </dialog>
  );
};

export default LikeDialog;
