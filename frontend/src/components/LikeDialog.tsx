import { useState } from "react";
import { LikeUnLike } from "@orca.ai/pulse";

import { ThumbDown, ThumbUp } from "./Icons";

const LikeDialog = ({
  handleLike,
  id,
  open,
  setOpen,
}: {
  handleLike: (isLike: LikeUnLike, comment: string) => Promise<void>;
  id?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [isLike, setIsLike] = useState<LikeUnLike>(LikeUnLike.like);
  const [comment, setComment] = useState("");

  return (
    <>
      <div
        className={`overlay ${open ? "active" : ""}`}
        onClick={() => setOpen(false)}
      />
      <dialog
        className={`${open ? "active" : ""}`}
        id={id}
        open={open}
        style={{ width: "98%" }}
      >
        <header>
          <nav className="no-space">
            <h6 className="max">의견을 남겨주세요.</h6>
            <button
              className="transparent circle large"
              onClick={() => {
                setIsLike(LikeUnLike.like);
              }}
            >
              <i>
                <ThumbUp fill={isLike === LikeUnLike.like} />
              </i>
            </button>
            <button
              className="transparent circle large"
              onClick={() => {
                setIsLike(LikeUnLike.unlike);
              }}
            >
              <i>
                <ThumbDown fill={isLike === LikeUnLike.unlike} />
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
          <button className="border" onClick={() => setOpen(false)}>
            취소
          </button>
          <button
            disabled={!comment}
            onClick={async () => {
              await handleLike(isLike, comment);
              setOpen(false);
              setIsLike(LikeUnLike.like);
              setComment("");
            }}
          >
            보내기
          </button>
        </nav>
      </dialog>
    </>
  );
};

export default LikeDialog;
