import { useState } from "react";
import { LikeUnLike } from "@orca.ai/pulse";

const LikeDialog = ({
  handleLike,
  id,
}: {
  handleLike: (isLike: LikeUnLike, comment: string) => Promise<void>;
  id?: string;
}) => {
  const [isLike, setIsLike] = useState<LikeUnLike>(LikeUnLike.like);
  const [comment, setComment] = useState("");

  return (
    <dialog className="top" id={id}>
      <header>
        <nav className="no-space">
          <h6 className="max">의견을 남겨주세요.</h6>
          <button
            className="transparent circle large"
            onClick={() => {
              setIsLike(LikeUnLike.like);
            }}
          >
            <i className={isLike === LikeUnLike.like ? "fill" : ""}>thumb_up</i>
          </button>
          <button
            className="transparent circle large"
            onClick={() => {
              setIsLike(LikeUnLike.unlike);
            }}
          >
            <i className={isLike === LikeUnLike.unlike ? "fill" : ""}>
              thumb_down
            </i>
          </button>
        </nav>
      </header>
      <div>
        <div className="field textarea border">
          <textarea
            onChange={(event) => {
              setComment(event.target.value);
            }}
            placeholder="의견을 자유롭게 적어주세요."
            value={comment}
          />
        </div>
      </div>
      <nav className="right-align">
        <button className="border" onClick={() => ui("#likeDialog")}>
          취소
        </button>
        <button
          onClick={async () => {
            await handleLike(isLike, comment);
            ui("#likeDialog");
            setIsLike(LikeUnLike.like);
            setComment("");
          }}
        >
          보내기
        </button>
      </nav>
    </dialog>
  );
};

export default LikeDialog;
