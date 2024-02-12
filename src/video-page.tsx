import { Fragment } from "react";
import CanvaEditor from "./Component/CanvasEditor/Canvas-editor";

const VideoPage = () => {
  return (
    <Fragment>
      <div>
        <CanvaEditor height={760} width={1080} />
      </div>
    </Fragment>
  );
};

export default VideoPage;
