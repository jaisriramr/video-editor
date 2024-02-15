import { Fragment, useState } from "react";
import CanvaEditor from "./Component/CanvasEditor/Canvas-editor";

const VideoPage = () => {
  const [media, setMedia] = useState([]);

  function handleMediaUpdate(d: any) {
    const ll: any = [...media];
    ll.push(d);
    setMedia(ll);
  }

  return (
    <Fragment>
      <div>
        <CanvaEditor
          height={760}
          width={1080}
          media={media}
          onMediaUpdate={handleMediaUpdate}
        />
      </div>
    </Fragment>
  );
};

export default VideoPage;
