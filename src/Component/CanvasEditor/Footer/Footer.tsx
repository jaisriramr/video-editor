import { Fragment, useState } from "react";
import "./Footer.css";

const Footer = ({
  canvaData,
  handleSelectedCanva,
  addCanva,
  canvaRef,
}: {
  canvaData?: any;
  handleSelectedCanva?: any;
  addCanva?: any;
  canvaRef?: any;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="video-editor__footer">
      <div className="video-editor__timeline">
        <div className="video-editor__control">
          {!isPlaying ? (
            <svg
              width="25"
              height="25"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_57_2)">
                <path
                  d="M22.2852 10.4834L5.09766 0.322257C3.70117 -0.502938 1.5625 0.297843 1.5625 2.33886V22.6562C1.5625 24.4873 3.5498 25.5908 5.09766 24.6728L22.2852 14.5166C23.8184 13.6133 23.8232 11.3867 22.2852 10.4834Z"
                  fill="black"
                />
              </g>
              <defs>
                <clipPath id="clip0_57_2">
                  <rect width="25" height="25" fill="white" />
                </clipPath>
              </defs>
            </svg>
          ) : (
            <svg
              width="25"
              height="26"
              viewBox="0 0 25 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.59375 23.679H3.90625C2.6123 23.679 1.5625 22.6292 1.5625 21.3352V4.14774C1.5625 2.85379 2.6123 1.80399 3.90625 1.80399H8.59375C9.8877 1.80399 10.9375 2.85379 10.9375 4.14774V21.3352C10.9375 22.6292 9.8877 23.679 8.59375 23.679ZM23.4375 21.3352V4.14774C23.4375 2.85379 22.3877 1.80399 21.0938 1.80399H16.4062C15.1123 1.80399 14.0625 2.85379 14.0625 4.14774V21.3352C14.0625 22.6292 15.1123 23.679 16.4062 23.679H21.0938C22.3877 23.679 23.4375 22.6292 23.4375 21.3352Z"
                fill="black"
              />
            </svg>
          )}
        </div>

        <div className="video-editor__canva-holder">
          {canvaData?.map((canva: any, i: number) => (
            <div
              className="video-editor__canva-image-holder"
              onClick={() => handleSelectedCanva(i)}
            >
              <img
                src={canva.img}
                alt="image canva"
                className="video-editor__canva-img"
              />
            </div>
          ))}
        </div>
        <div className="video-editor__add" onClick={addCanva}>
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.3841 5.53068V19.5307"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5.38409 12.5307H19.3841"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Footer;
