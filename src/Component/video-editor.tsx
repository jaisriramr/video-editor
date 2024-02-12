import React, { useEffect, Fragment, useRef } from "react";
import "./video-editor.css";
import { fabric } from "fabric";
// import { FFmpeg } from "@ffmpeg/ffmpeg";

const VideoEditor = () => {
  const canvaRef = useRef<any>(null);

  useEffect(() => {
    const canva = new fabric.Canvas("canva-id", {
      backgroundColor: "white",
    });

    // canva.toCanvasElement()

    canva.selection = false;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "red",

      selectable: true, // Ensure the object is selectable and movable
    });

    canva.add(rect);
    canva.setActiveObject(rect);

    canvaRef.current = canva;

    return () => {
      canva.dispose();
    };
  }, []);

  function handlePlay() {
    // (fab_video.getElement() as HTMLVideoElement).play();
    // const frames: any = [];
    // console.log(objects[1].isVideo);

    const rect = canvaRef?.current?.getActiveObject();

    const animationSpeed = 1; // Change this to adjust speed
    const targetLeft = 300; // Target position

    // Animation function
    function animate() {
      // Move the rectangle horizontally
      rect.left += animationSpeed;

      canvaRef?.current?.renderAll();
      canvaRef?.current?.requestRenderAll();
      // Check if animation should stop
      if (rect.left < targetLeft) {
        // Request next frame
        requestAnimationFrame(animate);
      }
    }

    // Start the animation
    animate();

    canvaRef?.current?.renderAll();
    canvaRef?.current?.requestRenderAll();

    console.log(rect);
  }

  function handleDownload() {
    const frames: any[] = [];

    const obj = canvaRef?.current?.getActiveObject();
    console.log(obj.canvas.lowerCanvasEl.captureStream(24));

    const cStream = obj.canvas.lowerCanvasEl.captureStream(24);

    const recorder = new MediaRecorder(cStream, { mimeType: "video/webm" });
    recorder.start();
    recorder.ondataavailable = saveChunks;
    recorder.onstop = exportStream;

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
      document.querySelector(".footer")?.appendChild(vid);
    }

    function saveChunks(e: any) {
      console.log("MEDA ON AV ", e);
      frames.push(e.data);
    }

    // const interval = setInterval(() => {
    //   frames.push(canvaRef?.current?.toDataURL());
    // });

    handlePlay();
    setTimeout(() => {
      // clearInterval(interval);
      recorder.stop();
    }, 5000);
  }

  return (
    <Fragment>
      <canvas width={1080} height={600} id="canva-id"></canvas>
      <div className="footer">
        <button onClick={handlePlay}>Play</button>
        <button onClick={handleDownload}>Download Mp4</button>
      </div>
    </Fragment>
  );
};

export default VideoEditor;
