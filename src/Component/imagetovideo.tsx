import React, { useRef } from "react";

interface ImageToVideoProps {
  imageUrls: string[]; // Array of image data URLs
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ imageUrls }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleConvertToVideo = () => {
    if (imageUrls.length < 5) {
      console.error("Please provide exactly 5 image URLs for testing.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const videoWidth = 640;
    const videoHeight = 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const videoStream = canvas.captureStream(30); // 30 frames per second
    const mediaRecorder = new MediaRecorder(videoStream, {
      mimeType: "video/webm; codecs=vp9",
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
      }
    };

    mediaRecorder.start();

    // Draw each image on canvas after it has loaded
    Promise.all(imageUrls.map(loadImage))
      .then((images) => {
        images.forEach((img, index) => {
          ctx?.drawImage(img, 0, 0, videoWidth, videoHeight);
          if (index === 4) {
            // Check if it's the last image
            mediaRecorder.stop();
          }
        });
      })
      .catch((error) => {
        console.error("Error loading images:", error);
      });
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
      img.src = url;
    });
  };

  return (
    <div>
      <button onClick={handleConvertToVideo}>Convert to Video</button>
      <video ref={videoRef} controls />
    </div>
  );
};

export default ImageToVideo;
