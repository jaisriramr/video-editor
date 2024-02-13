import { Fragment, useEffect, useRef, useState } from "react";
import "./Footer.css";

const Footer = ({
  canvaData,
  handleSelectedCanva,
  selectedCanva,
  addCanva,
  canvaRef,
}: {
  canvaData?: any;
  handleSelectedCanva?: any;
  addCanva?: any;
  canvaRef?: any;
  selectedCanva?: any;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // useEffect(() => {
  //   if (canvaData) {
  //     console.log("cammmomoerje");
  //     const rectangle = document.querySelector(
  //       ".video-editor__canva-trimmer-holder"
  //     ) as HTMLElement;
  //     let isResizing = false;
  //     let lastX: any;

  //     const canva = document.querySelector(
  //       ".video-editor__canva-image-holder"
  //     ) as HTMLElement;

  //     rectangle?.addEventListener("mousedown", function (e) {
  //       isResizing = true;
  //       lastX = e.clientX;
  //     });

  //     document?.addEventListener("mousemove", function (e) {
  //       if (!isResizing) return;

  //       const deltaX = e.clientX - lastX;
  //       // const step = 5;
  //       // const newWidth = canva.offsetWidth + Math.round(deltaX / step) * step;
  //       const newWidth = rectangle.offsetWidth + deltaX;

  //       canva.style.width = newWidth + "px";

  //       lastX = e.clientX;

  //       // Change cursor to indicate resizing near the edges
  //       // const rect = canva.getBoundingClientRect();
  //       // if (e.clientX < rect.left + 10 || e.clientX > rect.right - 10) {
  //       //   document.body.style.cursor = "ew-resize";
  //       // } else {
  //       //   document.body.style.cursor = "auto";
  //       // }
  //     });

  //     document.addEventListener("mouseup", function () {
  //       isResizing = false;
  //     });
  //   }
  // }, [canvaData]);

  const [increment, setIncrement] = useState<number>(1);
  const [totalWidth, setTotalWidth] = useState<number>(0);
  const intervalRef = useRef<any>(null);

  async function handlePlay() {
    const timelineCursor = document.querySelector(
      ".video-editor__timeline-cursor"
    ) as HTMLElement;
    const timelineCanvas = document.querySelectorAll(
      ".video-editor__canva-image-holder"
    );

    let totalWidth = 0;
    let interval: any;
    let increment = 1;

    interval = setInterval(() => {
      increment += 1;
      timelineCursor.style.transform = "translateX(" + increment + "px)";
      // console.log(increment);
    });

    timelineCanvas.forEach((canva, i) => {
      const style = canva.getBoundingClientRect();
      // console.log(style);
      totalWidth += style.width;
      interval;
      setTimeout(() => {
        increment += 10;
      }, style.width * 3.89);
    });

    let cli = setInterval(() => {
      if (
        Math.round(totalWidth + (timelineCanvas.length - 1) * 10) == increment
      ) {
        clearInterval(interval);
        clearInterval(cli);
        totalWidth = 0;
        increment = 1;
      }
    });

    // setTimeout(() => {
    //   clearInterval(interval);
    //   console.log(increment, totalWidth + timelineCanvas.length * 10);
    // }, totalWidth * 3.8);
  }

  async function handlePause() {}

  useEffect(() => {
    let totalWidth = 0;
    let interval: any;
    let increment = 1;
    let cli: any;
    const timelineCursor = document.querySelector(
      ".video-editor__timeline-cursor"
    ) as HTMLElement;
    const timelineCanvas = document.querySelectorAll(
      ".video-editor__canva-image-holder"
    );

    if (isPlaying) {
      interval = setInterval(() => {
        increment += 1;
        timelineCursor.style.transform = "translateX(" + increment + "px)";
        if (!isPlaying) clearInterval(interval);
      });

      timelineCanvas.forEach((canva, i) => {
        if (!isPlaying) return;
        const style = canva.getBoundingClientRect();
        totalWidth += style.width;

        setTimeout(() => {
          increment += 10;
        }, style.width * 3.89);
      });

      cli = setInterval(() => {
        if (
          Math.round(totalWidth + (timelineCanvas.length - 1) * 10) == increment
        ) {
          setIsPlaying(false);
          totalWidth = 0;
          clearInterval(interval);
          clearInterval(cli);
          increment = 1;
        }
      });
    }

    if (!isPlaying) {
      console.log("cleareeed");
      clearInterval(cli);
      clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="video-editor__footer">
      <div className="video-editor__timeline">
        <div className="video-editor__control">
          {!isPlaying ? (
            <svg
              onClick={() => setIsPlaying(true)}
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
              onClick={() => setIsPlaying(false)}
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
          <div className="video-editor__timeline-cursor">
            <svg
              className="video-editor__timeline-cursor-head"
              width="23"
              height="25"
              viewBox="0 0 23 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.2852 10.4834L4.09766 0.322257C2.70117 -0.502938 0.5625 0.297843 0.5625 2.33886V22.6562C0.5625 24.4873 2.5498 25.5908 4.09766 24.6728L21.2852 14.5166C22.8184 13.6133 22.8232 11.3867 21.2852 10.4834Z"
                fill="black"
              />
            </svg>
          </div>

          {canvaData?.map((canva: any, i: number) => (
            <div
              className={
                selectedCanva == i
                  ? "video-editor__canva-image-holder video-editor__canva-image-holder-active "
                  : "video-editor__canva-image-holder"
              }
              onClick={() => handleSelectedCanva(i)}
            >
              <img
                src={canva.img}
                alt="image canva"
                className="video-editor__canva-img"
              />
              {/* <div className="video-editor__canva-trimmer-holder"></div> */}
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
