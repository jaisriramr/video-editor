import { fabric } from "fabric";

// export const HandleDownload = (canvaData?: any, canvasRef?: any) => {
//   const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
//   const objs = document.querySelector(".lower-canvas") as HTMLCanvasElement;

//   const canvas = new fabric.Canvas(canvasElement, {
//     backgroundColor: canvasRef?.current?.backgroundColor,
//   });

//   canvas.setDimensions({
//     height: canvasRef?.current?.height,
//     width: canvasRef?.current?.width,
//   });

//   const cStream = canvasElement.captureStream(24);

//   const recorder = new MediaRecorder(cStream, {
//     mimeType: "video/webm",
//   });

//   let frames: any = [];

//   recorder.ondataavailable = saveChunks;
//   recorder.onstop = exportStream;

//   function saveChunks(e: any) {
//     frames.push(e.data);
//   }

//   function exportStream() {
//     // combine all our chunks in one blob
//     console.log(frames);
//     const blob = new Blob(frames, { type: "video/mp4" });

//     // do something with this blob
//     const vidURL = URL.createObjectURL(blob);
//     const vid = document.createElement("video");
//     vid.controls = true;
//     vid.src = vidURL;
//     vid.onended = function () {
//       URL.revokeObjectURL(vidURL);
//     };
//     document.querySelector(".aplus-content-nav")?.appendChild(vid);
//   }

//   let currentIndex = 0;

//   const interval = setInterval(() => {
//     console.log("5 Sec", currentIndex);
//     const json = canvaData[currentIndex]?.prop;
//     canvas.loadFromJSON(json, () => {
//       canvas.renderAll();
//       canvas.requestRenderAll();
//       handlePlay();
//       if (currentIndex == 0) {
//         recorder.start();
//       }
//       if (currentIndex + 1 == canvaData.length) {
//         clearInterval(interval);
//         console.log("Stopped");
//         recorder.stop();
//       }
//     });
//     currentIndex += 1;
//   }, 5500);

//   function handlePlay() {
//     function animate() {
//       canvasRef?.current?.renderAll();
//       canvasRef?.current?.requestRenderAll();
//       requestAnimationFrame(animate);
//     }
//     animate();
//     canvasRef?.current?.renderAll();
//     canvasRef?.current?.requestRenderAll();
//   }
// };

// const rect = new fabric.Rect({
//   left: 0,
//   top: 0,
//   width: width,
//   height: height,
//   fill: "blue",
// });

// canvas.add(rect);

// function dissolveEffect(target: any, duration: number) {
//   var interval = 100; // Interval for changing opacity
//   var steps = duration / interval;
//   var opacityStep = 1 / steps;
//   var currentOpacity = 1;

//   var dissolveInterval = setInterval(function () {
//     currentOpacity -= opacityStep;
//     target.set("opacity", currentOpacity);
//     canvas.renderAll();

//     if (currentOpacity <= 0) {
//       clearInterval(dissolveInterval);
//       canvas.remove(target); // Remove the object from canvas once dissolve is complete
//     }
//   }, interval);
// }

// dissolveEffect(rect, 2000);

export const HandleDownload = async (
  canvaData?: any,
  canvasRef?: any,
  progressPercentage?: any,
  handlePercentage?: any
) => {
  // fabricjs Start

  let NewCanvaData = [...canvaData];
  NewCanvaData.push({
    prop: {
      version: "5.3.0",
      objects: [],
      background: "#ffffff",
    },
    width: 30 * 5,
    img: "",
  });

  const canvasElement = document.createElement("canvas") as HTMLCanvasElement;

  const canvas = new fabric.Canvas(canvasElement, {
    backgroundColor: canvasRef?.current?.backgroundColor,
  });
  canvas.setDimensions({
    height: canvasRef?.current?.height,
    width: canvasRef?.current?.width,
  });
  // Fabricjs End

  //   Media Recorder
  const cStream = canvasElement.captureStream(24);
  const recorder = new MediaRecorder(cStream, {
    mimeType: "video/webm",
  });

  recorder.ondataavailable = saveChunks;
  recorder.onstop = exportStream;
  let frames: any = [];

  function saveChunks(e: any) {
    frames.push(e.data);
  }

  function exportStream() {
    // combine all our chunks in one blob
    console.log(frames);
    const blob = new Blob(frames, { type: "video/mp4" });

    // do something with this blob
    const vidURL = URL.createObjectURL(blob);
    const vid = document.createElement("video");
    vid.controls = true;
    vid.src = vidURL;
    vid.onended = function () {
      URL.revokeObjectURL(vidURL);
    };
    document.querySelector(".aplus-content-output-container")?.appendChild(vid);
  }

  let currentIndex = 0;
  let timeSpent = 0;
  let percentage = 0;

  const interval = setInterval(async () => {
    console.log("cuuuur  ", currentIndex);
    console.log("tiiimm ", timeSpent);

    const json = NewCanvaData[currentIndex]?.prop;
    let object = NewCanvaData[currentIndex];
    await new Promise(async (resolve, reject) => {
      await canvas.loadFromJSON(json, async () => {
        canvas.renderAll();
        canvas.requestRenderAll();
        console.log(currentIndex);
        percentage += Math.round(100 / canvaData?.length);
        handlePercentage(percentage);

        //   check for slides animation
        let nextObject = NewCanvaData[currentIndex + 1];

        if (nextObject) {
          if (
            nextObject?.transition &&
            nextObject?.transition?.type == "slide-down"
          ) {
            console.log(nextObject);

            setTimeout(() => {
              fabric.Image.fromURL(nextObject?.img, (img) => {
                img.set({
                  height: canvas?.height,
                  width: canvas?.width,
                  left: 0,
                  top: -Number(canvas?.height),
                });

                canvas.add(img);
                canvas.renderAll();
                canvas.requestRenderAll();

                function animateRect(target: any, duration: any) {
                  function animate() {
                    if (target.top == 0) {
                      return;
                    }

                    var newTop = target.top + 10;
                    target.set("top", newTop);
                    canvas.renderAll();
                    fabric.util.requestAnimFrame(animate);
                  }

                  fabric.util.requestAnimFrame(animate);
                }

                animateRect(img, 1000);
              });
            }, 4100);
          }
        }

        if (object?.transition) {
          if (object?.transition?.type == "disolve") {
            const rect = new fabric.Rect({
              left: 0,
              top: 0,
              height: canvas.height,
              width: canvas.width,
              fill: "white",
            });

            canvas.add(rect);
            canvas.renderAll();
            canvas.requestRenderAll();

            function dissolveEffect(target: any, duration: any) {
              var start: any = null;
              var interval = 1000 / 60; // Interval for updating animation (60fps)
              var steps = duration / interval;
              var opacityStep = 1 / steps;
              var currentOpacity = 1;

              function animate(timestamp: any) {
                if (!start) start = timestamp;
                var progress = timestamp - start;
                currentOpacity -= opacityStep;

                if (currentOpacity <= 0) {
                  target.set("opacity", 0);
                  canvas.renderAll();
                  canvas.remove(target); // Remove the object from canvas once dissolve is complete
                  return;
                }

                target.set("opacity", currentOpacity);
                canvas.renderAll();
                fabric.util.requestAnimFrame(animate);
              }

              fabric.util.requestAnimFrame(animate);
            }

            dissolveEffect(rect, 1000);
          }
          //  else if (object?.transition?.type == "linear") {
          //   const prevImg = fabric.Image.fromURL(
          //     canvaData[currentIndex - 1]?.img,
          //     (img) => {
          //       img.set({
          //         height: canvasRef?.current?.height,
          //         width: canvasRef?.current?.width,
          //       });
          //     }
          //   );

          //   // const currentImg = fabric.

          //   return;
          //   const rect = new fabric.Rect({
          //     left: 0,
          //     top: 0,
          //     height: canvas.height,
          //     width: canvas.width,
          //     fill: "white",
          //   });
          //   canvas.add(rect);
          //   canvas.renderAll();
          //   canvas.requestRenderAll();

          //   function reduceWidthAnimation(target: any, duration: any) {
          //     var start: any = null;
          //     var interval = 1000 / 30;
          //     var steps = duration / interval;
          //     var widthStep = target.width / steps;

          //     function animate(timestamp: any) {
          //       if (!start) start = timestamp;
          //       var progress = timestamp - start;

          //       if (progress >= duration) {
          //         target.set("width", 0);
          //         canvas.renderAll();
          //         return;
          //       }

          //       var newWidth = target.width - widthStep;
          //       target.set("width", newWidth);
          //       canvas.renderAll();
          //       fabric.util.requestAnimFrame(animate);
          //     }

          //     fabric.util.requestAnimFrame(animate);
          //   }

          //   reduceWidthAnimation(rect, 1000);
          // }
        }

        await handlePlay();

        canvas.on("after:render", () => {
          resolve("");
        });
      });
    });

    if (currentIndex == 0) {
      recorder.start();
    }

    if (currentIndex + 1 == NewCanvaData.length) {
      clearInterval(interval);
      console.log(currentIndex, " currentIndex");
      setTimeout(() => {
        console.log(currentIndex, " currentIndex", NewCanvaData[currentIndex]);
        recorder.stop();
      }, 5100);
    }

    currentIndex += 1;
    timeSpent += 5100;
  }, 5100);

  function handlePlay() {
    function animate() {
      canvasRef?.current?.renderAll();
      canvasRef?.current?.requestRenderAll();
      requestAnimationFrame(animate);
    }
    animate();
    canvasRef?.current?.renderAll();
    canvasRef?.current?.requestRenderAll();
  }
};
