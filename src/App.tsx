import VideoEditor from "./Component/video-editor";
import "./App.css";
import ImageToVideoConverter from "./Component/imagetovideo";
import { Switch } from "antd";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Fragment } from "react";
import CanvaEditor from "./Component/CanvasEditor/Canvas-editor";
import VideoPage from "./video-page";

function App() {
  return (
    <Fragment>
      <Router>
        <Routes>
          <Route path="/" Component={VideoEditor} />
          <Route path="/test" Component={VideoPage}></Route>
        </Routes>
      </Router>
    </Fragment>
  );
}

export default App;
