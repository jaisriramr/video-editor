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

  const [increment, setIncrement] = useState<number>(1);

  useEffect(() => {
    // let totalWidth = 0;
    let interval: any;
    // let increment = 1;
    // let cli: any;
    const timelineCursor = document.querySelector(
      ".video-editor__timeline-cursor"
    ) as HTMLElement;
    const timelineCanvas = document.querySelectorAll(
      ".video-editor__canva-image-holder"
    );

    if (isPlaying) {
      interval = setInterval(() => {
        setIncrement(increment + 1);
        timelineCursor.style.transform = "translateX(" + increment + "px)";
      }, 10);

      let totalWidth = 0;

      let array_width: any = [];
      const timelineCanvas = document.querySelectorAll(
        ".video-editor__canva-image-holder"
      );

      let CW: number = 0;

      timelineCanvas.forEach((canva, i) => {
        CW += canva.getBoundingClientRect().width + 10;
        totalWidth += canva.getBoundingClientRect().width;
        array_width.push(CW);
      });

      array_width.forEach((width: number, i: number) => {
        if (width == increment) {
          handleSelectedCanva(i + 1);

          console.log("canvaData ", canvaData);

          canvaData?.forEach((canva: any, j: number) => {
            // console.log(canva)

            if (canva?.transition) {
              if (canva?.transition?.type == "disolve" && j == i) {
                const upperCanvas = document.querySelector(
                  ".aplus-content-canva-wrapper"
                );
                const div = document.createElement("div");
                div.classList.add("disolve");
                upperCanvas?.appendChild(div);
                setTimeout(() => {
                  div.classList.add("disolve-hidden");
                }, 1);
                setTimeout(() => {
                  upperCanvas?.removeChild(div);
                }, 2000);
              } else if (canva?.transition?.type == "linear" && j == i) {
                const upperCanvas = document.querySelector(
                  ".aplus-content-canva-wrapper"
                ) as HTMLElement;

                const div = document.createElement("div");
                div.classList.add("linear");
                div.style.backgroundImage = `url(${canva.img})`;
                upperCanvas.appendChild(div);

                let dec = 100;

                let interval = setInterval(() => {
                  dec -= 0.5;
                  div.style.mask = `linear-gradient(90deg, rgb(0, 0, 0) ${dec}%, rgba(0, 0, 0, 0) ${dec}%)`;
                  if (dec == 0) {
                    clearInterval(interval);
                  }
                });
              }
            }
          });

          // if (i + 1 == 1) {
          //   console.log(i, " INDX ");
          //   const upperCanvas = document.querySelector(
          //     ".aplus-content-canva-wrapper"
          //   ) as HTMLElement;
          //   const div = document.createElement("canvas");
          //   div.classList.add("disolve");
          //   upperCanvas.appendChild(div);
          //   setTimeout(() => {
          //     div.classList.add("disolve-hidden");
          //   }, 1);
          //   setTimeout(() => {
          //     upperCanvas.removeChild(div);
          //   }, 2000);
          // }
          // if (i + 1 == 2) {
          //   const upperCanvas = document.querySelector(
          //     ".aplus-content-canva-wrapper"
          //   ) as HTMLElement;

          //   const div = document.createElement("div");
          //   div.classList.add("linear");
          //   upperCanvas.appendChild(div);

          //   let dec = 100;

          //   let interval = setInterval(() => {
          //     dec -= 0.5;
          //     div.style.mask = `linear-gradient(90deg, rgb(0, 0, 0) ${dec}%, rgba(0, 0, 0, 0) ${dec}%)`;
          //     if (dec == 0) {
          //       clearInterval(interval);
          //     }
          //   });
          // }

          // console.log(i + 1, canvaData[i + 1]);
          // const json = canvaData[i + 1].prop;
          // console.log(json);
          // canvaRef.current?.loadFromJSON(json, () => {
          //   canvaRef?.current?.renderAll();
          //   canvaRef?.current?.requestRenderAll();
          // });
        }
      });
      let checker = setInterval(() => {
        if (totalWidth + (timelineCanvas.length - 1) * 10 == increment) {
          clearInterval(interval);
          clearInterval(checker);
          setIsPlaying(false);
          setIncrement(1);
          handleSelectedCanva(0);
          timelineCursor.style.transform = "translateX(" + 1 + "px)";
        }
      });
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, increment]);

  /**
   * This useEffect is for handling the events
   */
  useEffect(() => {
    const Cursor = document.querySelector(
      ".video-editor__timeline-cursor"
    ) as HTMLElement;

    let isDraggin = false;
    let prevX: any;

    Cursor.addEventListener("mousedown", (e) => {
      isDraggin = true;
      prevX = e.clientX;
      document.addEventListener(
        "mousemove",
        (e) => {
          e.preventDefault();
          let totalWidth = 0;
          const timelineCanvas = document.querySelectorAll(
            ".video-editor__canva-image-holder"
          );
          timelineCanvas.forEach((canva) => {
            totalWidth += canva.getBoundingClientRect().width;
          });
          if (isDraggin) {
            var newX = e.clientX;
            var deltaX = newX - prevX;

            let offLeft = e.clientX - 521 + 74;
            console.log(
              "DELTA X ",
              offLeft - 74,
              totalWidth + (timelineCanvas.length - 1) * 10
            );

            if (
              deltaX > 0 &&
              !(offLeft - 74 > totalWidth + (timelineCanvas.length - 1) * 10)
            ) {
              incr += 1;
              Cursor.style.left = offLeft + 1 + "px";
            } else if (deltaX < 0 && !(offLeft - 74 < 0)) {
              Cursor.style.left = offLeft - 1 + "px";
            }
          }
        },
        false
      );
    });

    let incr: number = 1;

    Cursor.addEventListener(
      "mouseup",
      () => {
        isDraggin = false;
      },
      false
    );

    document.addEventListener(
      "mouseup",
      () => {
        isDraggin = false;
        document.removeEventListener("mousemove", () =>
          console.log("removed mouve ove")
        );
      },
      false
    );
  }, []);

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

        <div className="video-editor__canva-holder">
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

              {/* {canvaData.length !== i + 1 && (
                <div className="add-transition">
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
              )} */}
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
