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

export const HandleDownload = async (canvaData?: any, canvasRef?: any) => {
  // fabricjs Start
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

  const interval = setInterval(() => {
    const json = canvaData[currentIndex]?.prop;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      canvas.requestRenderAll();

      if (currentIndex == 0) {
        recorder.start();
      }
    });

    currentIndex += 1;
  }, 5500);

  setTimeout(() => {
    clearInterval(interval);
    recorder.stop();
  }, 17500);

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
