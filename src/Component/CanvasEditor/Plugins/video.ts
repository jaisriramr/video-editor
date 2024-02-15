// function getVideoElement(url: any) {
//   var videoE = document.createElement("video");
//   videoE.muted = true;
//   videoE.crossOrigin = "anonymous";
//   var source = document.createElement("source");
//   source.src = url;
//   source.type = "video/mp4";
//   videoE.appendChild(source);

//   videoE.height = 720;
//   videoE.width = 1080;

//   return videoE;
// }

// var url_mp4 =
//   "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

// var videoE = getVideoElement(url_mp4);
// var fab_video = new fabric.Image(videoE, { left: 0, top: 0 });
// fab_video.set("video_src", url_mp4);
// canvas.add(fab_video);
// (fab_video.getElement() as HTMLVideoElement).play();
// fabric.util.requestAnimFrame(function render() {
//   canvas.renderAll();
//   fabric.util.requestAnimFrame(render);
// });
