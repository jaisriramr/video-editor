import {
  ChangeEvent,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./canvas-editor.css";
import {
  Button,
  Input,
  Modal,
  Select,
  Slider,
  UploadProps,
  Upload,
  Tooltip,
  Dropdown,
  MenuProps,
  AutoComplete,
} from "antd";
import { fabric } from "fabric";
import { AlignGuidelines } from "fabric-guideline-plugin";

import Cropper, { Area, Point } from "react-easy-crop";
import Sortable from "sortablejs";
import { SvgIcons } from "./svg/svg";
import axios from "axios";
import { InboxOutlined } from "@ant-design/icons";
import Toolbar from "./Toolbar/toolbar";

// images
import MultiColor from "../../assets/react.svg";
import StrokeColor from "../../assets/react.svg";

import { SearchOptions } from "./svg/searchOptions";
import Footer from "./Footer/Footer";

// import ReactCrop from 'react-image-crop';

// import "react-image-crop/src/ReactCrop.scss";

const { Dragger } = Upload;

const CanvaEditor = ({
  id,
  width,
  height,
  image,
  media,
  onSave,
  onMediaUpdate,
}: {
  id?: any;
  width?: any;
  height?: any;
  image?: any;
  onSave?: any;
  media?: any;
  onMediaUpdate?: any;
}) => {
  /**
   * States and variables
   */
  const [rendered, setRendered] = useState(false);
  const [objectEvent, setObjectEvent] = useState(false);
  const canvasRef = useRef<any | null>(null);

  const BorderWidthRef = useRef<any | null>(null);
  const BorderRadiusRef = useRef<any | null>(null);
  const TransparencyRef = useRef<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isUndo, setIsUndo] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [currentMenu, setCurrentMenu] = useState<string | null>("text");
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [mediaList, setMediaList] = useState<any>(media);

  const [selectedElement, setSelectedElement] = useState<any | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<any | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 1, y: 1 });
  const [zoom, setZoom] = useState<any>(1);

  const [mediaSearchText, setMediaSearchText] = useState<any>();

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>();
  const [cropAspect, setCropAspect] = useState<any>(null);
  const [outputImage, setOutputImage] = useState<any | null>(null);

  // unsplash
  const [isUnsplashModal, setIsUnsplashModal] = useState<boolean>(false);
  const [unsplashSearch, setUnsplashSearch] = useState<any>(null);
  const unsplashRef = useRef<any>(null);
  const [unsplashResults, setUnsplashResult] = useState<any>(null);

  // popupSearch
  const [popupSearch, setPopupSearch] = useState<any>(null);
  const popupSearchRef = useRef<any>(null);
  const [isPopupSearch, setIsPopupSearch] = useState<boolean>(false);

  const [searchOptions, setSearchOptions] = useState<any>([]);
  const [CloneSearchOptions, setCloneSearchOptions] =
    useState<any>(SearchOptions);

  const [canvaDetails, setCanvaDetails] = useState<any>([]);
  const [currentSelectedCanva, setCurrentSelectedCanva] = useState<any>();

  function handleSelectedCanva(num: number) {
    setCurrentSelectedCanva(num);
  }

  function handleAddCanva() {
    // add canva

    let emptyCanva = {
      version: "5.3.0",
      objects: [],
      background: "#ffffff",
    };

    const cD = [...canvaDetails];
    console.log("okoko ", canvaDetails);

    cD.push({
      prop: emptyCanva,
      img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABDgAAAL4CAYAAACeKEcBAAAAAXNSR0IArs4c6QAAIABJREFUeF7t2MENACAQAkHtv2hM7GKTsQIZ7sXdtuMRIECAAAECBAgQIECAAAECBMIC18ARbs/XCRAgQIAAAQIECBAgQIAAgS9g4HAIBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAENfFeHAAAep0lEQVQCBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAAEDhxsgQIAAAQIECBAgQIAAAQIE8gIGjnyFAhAgQIAAAQIECBAgQIAAAQIGDjdAgAABAgQIECBAgAABAgQI5AUMHPkKBSBAgAABAgQIECBAgAABAgQMHG6AAAECBAgQIECAAAECBAgQyAsYOPIVCkCAAAECBAgQIECAAAECBAgYONwAAQIECBAgQIAAAQIECBAgkBcwcOQrFIAAAQIECBAgQIAAAQIECBAwcLgBAgQIECBAgAABAgQIECBAIC9g4MhXKAABAgQIECBAgAABAgQIECBg4HADBAgQIECAAAECBAgQIECAQF7AwJGvUAACBAgQIECAAAECBAgQIEDAwOEGCBAgQIAAAQIECBAgQIAAgbyAgSNfoQAECBAgQIAAAQIECBAgQICAgcMNECBAgAABAgQIECBAgAABAnkBA0e+QgEIECBAgAABAgQIECBAgAABA4cbIECAAAECBAgQIECAAAECBPICBo58hQIQIECAAAECBAgQIECAAAECBg43QIAAAQIECBAgQIAAAQIECOQFDBz5CgUgQIAAAQIECBAgQIAAAQIEDBxugAABAgQIECBAgAABAgQIEMgLGDjyFQpAgAABAgQIECBAgAABAgQIGDjcAAECBAgQIECAAAECBAgQIJAXMHDkKxSAAAECBAgQIECAAAECBAgQMHC4AQIECBAgQIAAAQIECBAgQCAvYODIVygAAQIECBAgQIAAAQIECBAgYOBwAwQIECBAgAABAgQIECBAgEBewMCRr1AAAgQIECBAgAABAgQIECBAwMDhBggQIECAAAECBAgQIECAAIG8gIEjX6EABAgQIECAAAECBAgQIECAgIHDDRAgQIAAAQIECBAgQIAAAQJ5AQNHvkIBCBAgQIAAAQIECBAgQIAAAQOHGyBAgAABAgQIECBAgAABAgTyAgaOfIUCECBAgAABAgQIECBAgAABAgYON0CAAAECBAgQIECAAAECBAjkBQwc+QoFIECAAAECBAgQIECAAAECBAwcboAAAQIECBAgQIAAAQIECBDICxg48hUKQIAAAQIECBAgQIAAAQIECBg43AABAgQIECBAgAABAgQIECCQFzBw5CsUgAABAgQIECBAgAABAgQIEDBwuAECBAgQIECAAAECBAgQIEAgL2DgyFcoAAECBAgQIECAAAECBAgQIGDgcAMECBAgQIAAAQIECBAgQIBAXsDAka9QAAIECBAgQIAAAQIECBAgQMDA4QYIECBAgAABAgQIECBAgACBvICBI1+hAAQIECBAgAABAgQIECBAgICBww0QIECAAAECBAgQIECAAAECeQEDR75CAQgQIECAAAECBAgQIECAAIEH7E/XvhVINHoAAAAASUVORK5CYII=",
    });
    setCanvaDetails(cD);
    localStorage.setItem("video-editor", JSON.stringify(cD));

    setCurrentSelectedCanva(cD.length - 1);
  }

  // auto complete
  const autocompleteOptions = [
    { label: "Square", value: "1" },
    { label: "Square Rounded", value: "2" },
    { label: "Rectange", value: "3" },
    { label: "Circle", value: "4" },
    { label: "Triangle", value: "5" },
    { label: "Reverse Triangle", value: "6" },
    { label: "Ellipse", value: "7" },
    { label: "Star", value: "8" },
    { label: "Star 4 Sides", value: "9" },

    { label: "Arrow Right", value: "10" },
    { label: "Arrow Up", value: "11" },
    { label: "Arrow Left", value: "12" },
    { label: "Arrow Down", value: "13" },
    { label: "Arrow Right", value: "14" },
    { label: "Message", value: "15" },
    { label: "Pentagon", value: "16" },
    { label: "Diamond", value: "17" },
    { label: "Hexagon", value: "18" },
    { label: "Hexagram", value: "19" },
    { label: "Octagram", value: "20" },
    { label: "Dodecagram", value: "21" },
    { label: "Star 6 Sides", value: "22" },
    { label: "Star 8 Sides", value: "23" },
    { label: "Star 12 Sides", value: "24" },
    { label: "Icon Activity", value: "25" },
    { label: "Icon Battery charging", value: "26" },
  ];

  useEffect(() => {
    if (popupSearch) {
      const Container = document.querySelector(
        ".quick-search-results"
      ) as HTMLElement;
      if (popupSearch.length == 0) {
        Container.innerHTML = "";
      }
      const result = CloneSearchOptions.filter(
        (opt: any) =>
          opt.name.toLowerCase()?.includes(popupSearch?.toLowerCase()) && opt
      );
      setSearchOptions(null);
      setSearchOptions(result);
    }
  }, [popupSearch]);

  useEffect(() => {
    const Container = document?.querySelector(
      ".quick-search-results"
    ) as HTMLElement;
    if (Container) {
      Container.innerHTML = "";
    }
    searchOptions?.forEach((opt: any) => {
      const div = document.createElement("div");
      div.classList.add("popup-search-filter-box");

      div.onclick = () => handleSearchCreateElement(opt);

      const preview = document.createElement("div");
      preview.classList.add("popup-search-filter-preview-box");
      const text = document.createElement("div");
      text.classList.add("popup-search-filter-box-text");

      if (opt.type !== "image") {
        preview.innerHTML = opt.svg;
      } else {
        const img = document.createElement("img") as HTMLImageElement;
        img.src = opt.url;
        img.alt = opt.name;
        preview.appendChild(img);
      }

      text.innerHTML = opt.name + " " + opt.type;
      div.appendChild(preview);
      div.appendChild(text);
      Container.appendChild(div);
    });
  }, [searchOptions]);

  function handleSearchCreateElement(opt: any) {
    canvasRef?.current?.discardActiveObject();
    if (opt?.type !== "image") {
      fabric.loadSVGFromString(opt?.svg, (objects, options) => {
        var svgObject = fabric.util.groupSVGElements(objects, options);
        svgObject.set({
          left: 10,
          top: 10,
        });

        canvasRef?.current?.add(svgObject);
        canvasRef.current.bringToFront(svgObject);
        canvasRef?.current?.setActiveObject(svgObject);

        canvasRef.current?.renderAll();
        canvasRef.current?.requestRenderAll();
      });
    } else {
      fabric.Image.fromURL(opt.url, (img: any) => {
        img.set({
          scaleX: 0.8,
          scaleY: 0.8,
          top: 10,
          left: 10,
        });

        canvasRef?.current.add(img);
        canvasRef?.current.bringToFront(img);
        canvasRef?.current?.setActiveObject(img);
      });
    }

    setIsPopupSearch(false);
    setSearchOptions([]);
    setPopupSearch(null);
  }

  const [options, setOptions] = useState<any>(autocompleteOptions);
  // const getPanelValue = (text: any) => {
  //   let result = autocompleteOptions?.filter((opt: any) => opt.label.toLowerCase().includes(text));
  //   setOptions([...options, result]);
  // };

  const [selectedOption, setSelectedOption] = useState("");
  const [inputValue, setInputValue] = useState("");

  const onSelect = (data: any, option: any) => {
    setSelectedOption(option);
    setInputValue(option.label);
  };

  function handleSearchEvent(e: any) {
    e.preventDefault();
    if (inputValue.length > 2) {
      if (inputValue.toLowerCase() == "square") {
        handleCreateElement("obj", "square");
      } else if (inputValue.toLowerCase() == "square rounded") {
        handleCreateElement("obj", "square-rounded");
      } else if (inputValue.toLowerCase() == "rectange") {
        handleCreateElement("obj", "rect");
      } else if (inputValue.toLowerCase() == "circle") {
        handleCreateElement("obj", "circle");
      } else if (inputValue.toLowerCase() == "triangle") {
        handleCreateElement("obj", "triangle");
      } else if (inputValue.toLowerCase() == "reverse triangle") {
        handleCreateElement("obj", "reverse triangle");
      } else if (inputValue.toLowerCase() == "ellipse") {
        handleCreateElement("obj", "ellipse");
      } else if (inputValue.toLowerCase() == "star") {
        handleCreateElement("obj", "star");
      } else if (inputValue.toLowerCase() == "star 4") {
        handleCreateElement("obj", "star-4");
      } else if (inputValue.toLowerCase() == "star 4 sides") {
        handleCreateElement("obj", "star-4");
      } else if (inputValue.toLowerCase() == "arrow right") {
        handleCreateElement("obj", "right-arrow");
      } else if (inputValue.toLowerCase() == "arrow up") {
        handleCreateElement("obj", "right-up");
      } else if (inputValue.toLowerCase() == "arrow down") {
        handleCreateElement("obj", "right-down");
      } else if (inputValue.toLowerCase() == "arrow left") {
        handleCreateElement("obj", "right-left");
      } else if (inputValue.toLowerCase() == "message") {
        handleCreateElement("obj", "message");
      } else if (inputValue.toLowerCase() == "pentagon") {
      } else if (inputValue.toLowerCase() == "diamond") {
        handleCreateElement("obj", "polygon-4");
      } else if (inputValue.toLowerCase() == "hexagon") {
        handleCreateElement("obj", "polygon-6");
      } else if (inputValue.toLowerCase() == "octagram") {
        handleCreateElement("obj", "star-6");
      } else if (inputValue.toLowerCase() == "hexagram") {
        handleCreateElement("obj", "star-8");
      } else if (inputValue.toLowerCase() == "dodecagram") {
        handleCreateElement("obj", "star-12");
      } else if (inputValue.toLowerCase() == "star 6 sides") {
        handleCreateElement("obj", "star-6");
      } else if (inputValue.toLowerCase() == "star 8 sides") {
        handleCreateElement("obj", "star-8");
      } else if (inputValue.toLowerCase() == "star 12 sides") {
        handleCreateElement("obj", "star-12");
      }
      setInputValue("");
      setIsPopupSearch(false);
    }
  }

  const onChange = (data: any, option: any) => {
    setInputValue(data);
    setSelectedOption(option);
  };

  // custom dropdown
  const [isStrokeStyle, setIsStrokeStyle] = useState(false);
  const [isBgStyle, setIsBgStyle] = useState(false);

  /**
   * this function handles the unsplash search submit event
   */
  async function handleUnsplashSearchSubmit() {
    setUnsplashResult([]);
    const data = await fetch(
      `https://api.unsplash.com/search/photos?page=1&query=${unsplashSearch}&client_id=${
        import.meta.env.VITE_UNSPLASH_ID
      }`
    );
    const dataJ = await data.json();
    // console.log(dataJ.results);
    setUnsplashResult(dataJ?.results);
  }

  function handleMediaSearch(e: any) {
    setMediaSearchText(e.target.value);
  }

  useEffect(() => {
    if (mediaSearchText?.length) {
      //
      if (mediaSearchText?.length == 1 || 0) {
        let newQuery = [...media];
        setMediaList(newQuery);
      } else {
        const newQueryResult = media.filter(
          (data: any) => data.name.includes(mediaSearchText) && data
        );
        setMediaList(newQueryResult);
      }
    }
  }, [mediaSearchText]);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        const img = document.querySelector(
          ".reactEasyCrop_Image"
        ) as HTMLImageElement;

        setCropAspect({ width: img.clientWidth, height: img.clientHeight });

        // const cropper = document.querySelector('.reactEasyCrop_CropAreaGrid') as HTMLElement;
        //   console.log(img?.clientHeight, img?.width, cropper);

        //   cropper.style.width = img?.clientWidth.toString() + 'px';
        //   cropper.style.height = img?.clientHeight.toString() + 'px';
      }, 100);
    }
  }, [isModalOpen]);

  /**
   * Event listeners
   */
  useEffect(() => {
    setTimeout(() => {
      // document
      //   .querySelector('.aplus-content-canva-holder')
      //   ?.addEventListener('keydown', (e: any) => {
      //     console.log('CAMER ', e.key);
      //     const selectedElement = canvasRef?.current?.getActiveObject();
      //     if (e.ctrlKey && e.key == 'ArrowRight') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           left: selectedElement?.left + 10,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.ctrlKey && e.key == 'ArrowLeft') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           left: selectedElement?.left - 10,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.ctrlKey && e.key == 'ArrowUp') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           top: selectedElement?.top - 10,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.ctrlKey && e.key == 'ArrowDown') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           top: selectedElement?.top + 10,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.key == 'ArrowRight') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           left: selectedElement?.left + 1,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.key == 'ArrowLeft') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           left: selectedElement?.left - 1,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.key == 'ArrowUp') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           top: selectedElement?.top - 1,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     } else if (e.key == 'ArrowDown') {
      //       e.preventDefault();
      //       if (selectedElement) {
      //         selectedElement?.set({
      //           top: selectedElement?.top + 1,
      //         });
      //       }
      //       canvasRef?.current?.renderAll();
      //       canvasRef?.current?.requestRenderAll();
      //     }
      //   });
    }, 300);
  }, [canvasRef?.current?.getActiveObject()]);

  useEffect(() => {
    document.addEventListener("keydown", (e: any) => {
      if (e.key == "/") {
        e.preventDefault();
        setIsPopupSearch(true);
        setTimeout(() => {
          const { input } = popupSearchRef?.current;
          input.focus();
        }, 500);

        // console.log('SEarch');
      }

      if (e.ctrlKey && e.key == "u") {
        e.preventDefault();
        setIsUnsplashModal(true);
        setTimeout(() => {
          const { input } = unsplashRef?.current;
          input.focus();
        }, 500);
      }
      if (e.ctrlKey && e.key == "d") {
        e.preventDefault();
        handleToolbarDuplicate();
      }
      if (e.ctrlKey && e.key == "i") {
        e.preventDefault();
        setCurrentMenu("text");
      }

      if (e.ctrlKey && e.key == "m") {
        e.preventDefault();
        setCurrentMenu("media");
      }

      if (e.ctrlKey && e.key == "l") {
        e.preventDefault();
        setCurrentMenu("layers");
      }

      if (e.ctrlKey && e.key == "o") {
        e.preventDefault();
        setCurrentMenu("objects");
      }

      if (e.ctrlKey && e.key == 1) {
        e.preventDefault();
        handleCreateElement("h1");
      }
      if (e.ctrlKey && e.key == 2) {
        e.preventDefault();
        handleCreateElement("h2");
      }
      if (e.ctrlKey && e.key == 3) {
        e.preventDefault();
        handleCreateElement("h3");
      }
      if (e.ctrlKey && e.key == 4) {
        e.preventDefault();
        handleCreateElement("h4");
      }
      if (e.ctrlKey && e.key == 5) {
        e.preventDefault();
        handleCreateElement("h5");
      }
      if (e.ctrlKey && e.key == 6) {
        e.preventDefault();
        handleCreateElement("h6");
      }
      if (e.ctrlKey && e.key == "p") {
        e.preventDefault();
        handleCreateElement("para");
      }

      if (e.key == "Delete") {
        if (canvasRef?.current?.getActiveObject()) {
          canvasRef?.current?.remove(canvasRef?.current?.getActiveObject());
        }
      }

      if (e.ctrlKey && e.key == "c") {
        // console.log('welcome CCCC');
        canvasRef?.current?.getActiveObject().clone(function (cloned: any) {
          navigator.clipboard.writeText(JSON.stringify(cloned));
        });
      }
      if (e.ctrlKey && e.key == "v") {
        // console.log('welcome VVVV');
        navigator.clipboard.readText().then((clipboardText) => {
          try {
            const clipboardData = JSON.parse(clipboardText);

            fabric.util.enlivenObjects(
              [clipboardData],
              (objects: fabric.Object[]) => {
                const pastedObject: any = objects[0];
                // console.log(pastedObject);

                // Offset the pasted object to avoid overlap
                pastedObject.set({
                  left: pastedObject?.left + 10,
                  top: pastedObject?.top + 10,
                });

                // Add the pasted object to the canvas
                canvasRef?.current.add(pastedObject);

                // Set the pasted object as the active object
                canvasRef?.current.setActiveObject(pastedObject);

                // Render the changes
                canvasRef?.current.renderAll();
              },
              ""
            );
          } catch (err) {
            console.log("ERR ", err);
          }
        });
      }
    });

    return () => {
      document.removeEventListener("keydown", () => {
        console.log("removed");
      });
    };
  }, []);

  useEffect(() => {
    /**
     * Create Fabric canva instance
     */
    const canvas = new fabric.Canvas("aplus-content", {
      backgroundColor: "#ffffff",
    });

    setCurrentSelectedCanva(0);

    const guideline = new AlignGuidelines({
      canvas: canvas,
      aligningOptions: {
        lineColor: "red",
        lineWidth: 1,
        lineMargin: 1,
      },
    });

    guideline.init();

    let mediaSearchArray: any = [...CloneSearchOptions];

    media?.forEach((opt: any) => {
      mediaSearchArray.push({
        type: "image",
        name: opt.name,
        url: opt.img,
      });
    });

    setTimeout(() => {
      setCloneSearchOptions(mediaSearchArray);
    }, 200);

    // canvas.setBackgroundColor(grad.toObject(), () )

    if (canvas) {
      var canvasHistory: any = {
        state: [],
        currentStateIndex: -1,
        undoStatus: false,
        redoStatus: false,
        undoFinishedStatus: true,
        redoFinishedStatus: true,
      };

      const updateHistory = () => {
        // localStorage.setItem("video-editor", JSON.stringify(canvaDetails));

        if (
          canvasHistory.undoStatus === true ||
          canvasHistory.redoStatus === true
        ) {
          console.log(
            "Do not do anything, this got triggered automatically while the undo and redo actions were performed"
          );
        } else {
          const jsonData = canvas.toJSON();
          const canvasAsJson = JSON.stringify(jsonData);

          // NOTE: This is to replace the canvasHistory when it gets rewritten 20180912:Alevale
          if (
            canvasHistory.currentStateIndex <
            canvasHistory.state.length - 1
          ) {
            const indexToBeInserted = canvasHistory.currentStateIndex + 1;
            canvasHistory.state[indexToBeInserted] = canvasAsJson;
            const elementsToKeep = indexToBeInserted + 1;
            console.log(`History rewritten, preserved ${elementsToKeep} items`);
            canvasHistory.state = canvasHistory.state.splice(0, elementsToKeep);

            // NOTE: This happens when there is a new item pushed to the canvasHistory (normal case) 20180912:Alevale
          } else {
            console.log("push to canvasHistory");
            canvasHistory.state.push(canvasAsJson);
          }

          canvasHistory.currentStateIndex = canvasHistory.state.length - 1;
        }
      };

      canvas.on("object:added", () => {
        console.log("commmmmmmm");
        updateHistory();
        setObjectEvent(true);
        // handleCanvaDetailsUpd();
      });
      canvas.on("object:modified", () => {
        updateHistory();
        setObjectEvent(true);
        // handleCanvaDetailsUpd();
      });
      canvas.on("object:removed", () => {
        updateHistory();
        setObjectEvent(true);
        // handleCanvaDetailsUpd();
      });

      canvas.on("after:render", () => {
        setRendered(true);
      });

      var undo = () => {
        if (canvasHistory.currentStateIndex - 1 === -1) {
          console.log(
            "do not do anything anymore, you are going far to the past, before creation, there was nothing"
          );
          return;
        }

        if (canvasHistory.undoFinishedStatus) {
          canvasHistory.undoFinishedStatus = false;
          canvasHistory.undoStatus = true;
          canvas.loadFromJSON(
            canvasHistory.state[canvasHistory.currentStateIndex - 1],
            () => {
              canvas.renderAll();
              canvasHistory.undoStatus = false;
              canvasHistory.currentStateIndex--;
              canvasHistory.undoFinishedStatus = true;
            }
          );
        }
      };

      var redo = () => {
        if (
          canvasHistory.currentStateIndex + 1 ===
          canvasHistory.state.length
        ) {
          console.log(
            "do not do anything anymore, you do not know what is after the present, do not mess with the future"
          );
          return;
        }

        if (canvasHistory.redoFinishedStatus) {
          canvasHistory.redoFinishedStatus = false;
          canvasHistory.redoStatus = true;
          canvas.loadFromJSON(
            canvasHistory.state[canvasHistory.currentStateIndex + 1],
            () => {
              canvas.renderAll();
              canvasHistory.redoStatus = false;
              canvasHistory.currentStateIndex++;
              canvasHistory.redoFinishedStatus = true;
            }
          );
        }
      };

      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key == "z") {
          e.preventDefault();
          undo();
        }
        if (e.ctrlKey && e.key == "y") {
          e.preventDefault();
          redo();
        }
      });
    }

    fabric.Object.prototype.borderColor = "#8B3DFF";
    fabric.Object.prototype.borderDashArray = [0, 0];
    fabric.Object.prototype.borderScaleFactor = 5;

    canvas.preserveObjectStacking = true;

    if (height > 768) {
      const wrapper = document.querySelector(
        ".aplus-content-canva-wrapper"
      ) as HTMLElement;

      const holder = document.querySelector(
        ".aplus-content-canva-holder"
      ) as HTMLElement;
      const canvaElement = document.querySelector(
        "#aplus-content"
      ) as HTMLElement;
      const upperCanva = document.querySelector(
        ".upper-canvas "
      ) as HTMLElement;

      holder.addEventListener("click", (e: any) => {
        e.stopImmediatePropagation();
        const list = e.target.classList;

        list?.forEach((v: any) => {
          if (v !== "upper-canvas") {
            canvas.discardActiveObject().renderAll();
            const upperCanva = document.querySelector(
              ".upper-canvas "
            ) as HTMLElement;
            upperCanva.style.borderColor = "transparent";
          }
        });
      });

      // holder.style.scale = '0.7';
      // wrapper.style.scale = '0.7';
    }

    canvas.on("drop", (event: any) => {
      // console.log('EVENT ', canvas?.getPointer(event.e));

      const pointer = canvas?.getPointer(event.e);

      const object = JSON.parse(event?.e?.dataTransfer?.getData("text/plain"));

      if (event?.e?.dataTransfer?.getData("text/plain")) {
        if (object.type == "img") {
          fabric.Image.fromURL(object.data, (img: any) => {
            img.set({
              scaleX: 0.5,
              scaleY: 0.5,
              top: pointer.y,
              left: pointer.x,
            });

            canvas.add(img);
            canvas.bringToFront(img);
          });
        } else if (object.type == "text") {
          const text = new fabric.IText(object.data, {
            fontSize:
              object?.data == "Heading 1"
                ? 48
                : object?.data == "Heading 2"
                ? 42
                : object?.data == "Heading 3"
                ? 36
                : object?.data == "Heading 4"
                ? 24
                : object?.data == "Heading 5"
                ? 18
                : object?.data == "Heading 6"
                ? 16
                : 16,
            fontWeight: 600,
            fontFamily: "Roboto",
          });

          text.set({
            top: pointer.y,
            left: pointer.x,
          });

          canvas.add(text);
          canvas?.discardActiveObject();
          canvas?.setActiveObject(text);
          canvas.bringToFront(text);
        } else if (object.type == "obj") {
          handleCreateElement("obj", object.data, pointer);
        } else if (object.type == "icon") {
          handleCreateElement("icon", object.data, pointer);
        }

        canvas?.renderAll();
        canvas?.requestRenderAll();
      }
    });

    // Prevent the default behavior for drop events
    canvas.on("dragover", function (e: any) {
      e.preventDefault();
    });

    // check if the canva is clicked
    canvas.on("mouse:down", (e) => {
      if (!e.target) {
        setSelectedElement(null);
        setSelectedElementType(null);
        // setCurrentMenu(null);
        const upperCanva = document.querySelector(
          ".upper-canvas "
        ) as HTMLElement;
        upperCanva.style.borderColor = "#8B3DFF";
      }
    });

    canvas.on("object:moving", function () {
      const toolbar = document.querySelector(
        ".aplus-content-toolbar"
      ) as HTMLElement;
      toolbar.style.display = "none";
    });

    canvas.on("object:modified", (e) => {
      handleSelection(e);
    });

    // const canvaElement =  document.querySelector('#aplus-content') as HTMLElement;
    // canvaElement.addEventListener('')

    function handleSelection(event: any) {
      const upperCanva = document.querySelector(
        ".upper-canvas "
      ) as HTMLElement;
      upperCanva.style.borderColor = "transparent";
      // console.log(event);
      let element;
      if (event.selected) {
        element = event.selected[0];
      } else if (event.target) {
        element = event.target;
      }

      const canvasRect = element.canvas.lowerCanvasEl.getBoundingClientRect();

      // console.log(element.getBoundingRect(), canvas?.getActiveObject());

      const toolbar = document.querySelector(
        ".aplus-content-toolbar"
      ) as HTMLElement;

      const elementStyle = element.getBoundingRect();

      toolbar.style.display = "flex";

      var left =
        canvasRect.left +
        (elementStyle.left == 0
          ? elementStyle.left
          : Math.round(elementStyle.left));
      var top =
        canvasRect.top +
        (elementStyle.top == 0
          ? elementStyle.top
          : Math.round(elementStyle.top)) -
        56;

      // toolbar.style.transform = 'translate(' + left + 'px, -' + top + 'px )';
      toolbar.style.top = top + "px";
      toolbar.style.left = left + "px";

      // console.log(toolbar);

      setSelectedElement(element);
      // console.log(element.get('type'), 'TTTYPPPE');
      setSelectedElementType(element?.get("type"));
    }

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => {
      setIsStrokeStyle(false);
      setIsBgStyle(false);
      const sidebarBox = document.querySelectorAll(
        ".aplus-content-sidebar-box"
      );

      sidebarBox?.forEach((box, i) => {
        // console.log(box.classList.contains('aplus-content-sidebar-box-active'), i + 1);

        if (i + 1 == 2) {
          handleSidebarToggle("text");
        } else if (i + 1 == 3) {
          handleSidebarToggle("media");
        } else if (i + 1 == 4) {
          handleSidebarToggle("objects");
        } else if (i + 1 == 5) {
          handleSidebarToggle("layers");
        }
      });

      const toolbar = document.querySelector(
        ".aplus-content-toolbar"
      ) as HTMLElement;
      toolbar.style.display = "none";
      toolbar.style.transform = "translate(0, 0)";
      const upperCanva = document.querySelector(
        ".upper-canvas "
      ) as HTMLElement;
      upperCanva.style.borderColor = "#8B3DFF";
      setSelectedElement(null);
      canvas.discardActiveObject().renderAll();
    });

    canvasRef.current = canvas;

    canvas.setDimensions({
      width,
      height,
    });

    if (localStorage.getItem("video-editor")) {
      const data: any = JSON.parse(localStorage.getItem("video-editor") || "");

      setTimeout(() => {
        console.log("imcoming ", data[0]);
        const json = data[0].prop;
        canvas.loadFromJSON(json, () => {
          canvas?.renderAll();
          canvas?.requestRenderAll();
        });
      }, 500);

      setCanvaDetails(data);
    }

    return () => {
      canvas.dispose();
      canvas.off("object:modified", handleCanvaDetailsUpd);
      canvas.off("object:added", handleCanvaDetailsUpd);
      canvas.off("object:removed", handleCanvaDetailsUpd);
      document.removeEventListener("keydown", () => {
        console.log("removed");
      });
      document.removeEventListener("click", () => {
        console.log("removed");
      });
    };
  }, []);

  useEffect(() => {
    if (rendered) {
      localStorage.setItem("video-editor", JSON.stringify(canvaDetails));
      setRendered(false);
    }
  }, [canvaDetails]);

  useEffect(() => {
    // console.log(canvaDetails, currentSelectedCanva);
    canvasRef.current?.on("object:added", handleCanvaDetailsUpd);
    canvasRef.current?.on("object:modified", handleCanvaDetailsUpd);
    canvasRef.current?.on("object:removed", handleCanvaDetailsUpd);
  }, [canvaDetails, currentSelectedCanva]);

  function handleCanvaDetailsUpd() {
    // console.log("comeiomeiorjio");
    const cD = [...canvaDetails];

    // console.log("CAMVVVV ", canvaDetails, currentSelectedCanva);

    const currentCD = { ...cD[currentSelectedCanva] };
    currentCD.prop = canvasRef?.current.toJSON();
    currentCD.img = canvasRef?.current?.toDataURL();
    cD[currentSelectedCanva] = currentCD;
    setCanvaDetails(cD);
    setObjectEvent(false);
  }

  useEffect(() => {
    let json = canvaDetails[currentSelectedCanva]?.prop;
    // console.log("JSON ", json, currentSelectedCanva);
    canvasRef?.current?.loadFromJSON(json, () => {
      canvasRef?.current?.renderAll();
      canvasRef?.current?.requestRenderAll();
    });
  }, [currentSelectedCanva]);

  useEffect(() => {
    window.onclick = function (event: any) {
      var dropdown = document.querySelector(
        ".dropdown-stroke-clr"
      ) as HTMLElement;
      var bgClr = document.querySelector(".dropdown-bg") as HTMLElement;

      if (event.target !== dropdown && !dropdown?.contains(event.target)) {
        setIsStrokeStyle(false);
      }
      if (event.target !== bgClr && !bgClr?.contains(event.target)) {
        setIsBgStyle(false);
      }
    };

    // document.addEventListener('keydown', (e) => {
    //   if (e.ctrlKey && e.key === 'z') {
    //     e.preventDefault();
    //     undo();
    //   }
    // });
  }, []);

  // const saveState = () => {
  //   const canvas = canvasRef.current;
  //   if (canvas) {
  //     localStorage.setItem('aplus-content-' + image, JSON.stringify(canvas?.toJSON()));

  //     setHistory((prev) => [...prev, canvas?.toJSON()]);
  //     setCurrentIndex((prevIndex) => prevIndex + 1);
  //   }
  // };

  // const undo = () => {
  //   console.log('CCCDDDDD', currentIndex, history);
  //   // console.log('undo');
  //   if (currentIndex > 0) {
  //     setCurrentIndex((prevIndex) => prevIndex - 1);
  //     applyHistory();
  //   }
  // };

  // const redo = () => {
  //   console.log('CAME TO REDO');
  //   if (currentIndex < history.length - 1) {
  //     setCurrentIndex((prevIndex) => prevIndex + 1);
  //     applyHistory();
  //   }
  // };

  // const applyHistory = () => {
  //   const canvas = canvasRef.current;
  //   const objects: any = history[currentIndex];

  //   if (canvas && objects) {
  //     canvas?.clear();
  //     console.log(objects);

  //     canvas?.loadFromJSON(objects, () => {
  //       // setDontUpdate(false);
  //       canvas.renderAll();
  //       canvas?.requestRenderAll();
  //     });
  //   }
  // };

  /**
   *
   * @param e
   */
  function handleNavEvents(e: any) {
    setCurrentMenu(e);
    console.log(canvasRef?.current?.getActiveObject().get("type"));
    if (e == "dimensions") {
      console.log("WEEEE");
    } else if (e == "bg") {
      console.log("BG");
    }
  }

  /**
   * This function handles the toggle of sidebar
   */
  function handleSidebarToggle(type: string) {
    setCurrentMenu(type);
    const sidebarBox = document.querySelectorAll(".aplus-content-sidebar-box");

    if (type == "text") {
      sidebarBox[1].classList.add("aplus-content-sidebar-box-active");
      sidebarBox[2].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[3].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[4].classList.remove("aplus-content-sidebar-box-active");
    } else if (type == "media") {
      sidebarBox[1].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[2].classList.add("aplus-content-sidebar-box-active");
      sidebarBox[3].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[4].classList.remove("aplus-content-sidebar-box-active");
    } else if (type == "objects") {
      sidebarBox[1].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[2].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[3].classList.add("aplus-content-sidebar-box-active");
      sidebarBox[4].classList.remove("aplus-content-sidebar-box-active");
    } else if (type == "layers") {
      sidebarBox[1].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[2].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[3].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[4].classList.add("aplus-content-sidebar-box-active");
    } else {
      setCurrentMenu(null);
      sidebarBox[1].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[2].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[3].classList.remove("aplus-content-sidebar-box-active");
      sidebarBox[4].classList.remove("aplus-content-sidebar-box-active");
    }
  }

  /**
   * this function helps us handle media uploads
   */
  const customRequest = ({
    file,
    onSuccess,
    onError,
  }: {
    file?: any;
    onSuccess?: any;
    onError?: any;
  }) => {
    // Manually handle the file here
    console.log(file);
    getBase64(file, (base64: any) => {
      onMediaUpdate({ img: base64, name: file.name });
      // console.log('Base64:', base64);
      setMediaList([...mediaList, { img: base64, name: file?.name }]);

      onSuccess();
    });
  };

  /**
   * converts the incoming image to base64
   * @param file
   * @param callback
   */
  const getBase64 = (file: any, callback: any) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  /**
   * this function helps us upload the formatted data to db
   */
  function handleMediaUploadSubmit() {
    setSelectedMedia(null);
    // console.log(mediaList);
    setMediaList([...mediaList, { img: selectedMedia }]);
  }

  /**
   * handles media drag start
   */
  function handleMediaDragStart(type: any, e: any, data: any) {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: type, data: data })
    );
  }

  /**
   *
   * @param file
   * @returns data url
   */
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Error reading file as data URL"));
        }
      };

      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    document.addEventListener("keydown", (e: any) => {
      const objects = canvasRef?.current?.getObjects();

      if (e.ctrlKey && e.key == "[") {
        // e.preventDefault();
        let index = objects.indexOf(canvasRef?.current?.getActiveObject());
        // canvasRef?.current?.moveTo(canvasRef?.current?.getActiveObject(), index - 1);
        canvasRef?.current?.sendBackwards(
          canvasRef?.current?.getActiveObject()
        );
      } else if (e.ctrlKey && e.key == "]") {
        // e.preventDefault();
        let index = objects.indexOf(canvasRef?.current?.getActiveObject());
        // canvasRef?.current?.moveTo(canvasRef?.current?.getActiveObject(), index + 1);
        canvasRef?.current?.bringForward(canvasRef?.current?.getActiveObject());
      }
    });
    return () => {
      document.removeEventListener("keydown", () => {
        console.log("removed");
      });
      document.removeEventListener("contextmenu", () => {
        console.log("removed");
      });
    };
  }, [selectedElementType]);

  /**
   * this function helps create a new element
   * @param type
   * @param media
   */
  function handleCreateElement(type: string, media?: any, pointer?: any) {
    canvasRef?.current?.discardActiveObject();

    if (type == "h1") {
      const text = new fabric.IText("Heading 1", {
        fontSize: 48,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "h2") {
      const text = new fabric.IText("Heading 2", {
        fontSize: 36,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "h3") {
      const text = new fabric.IText("Heading 3", {
        fontSize: 32,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "h4") {
      const text = new fabric.IText("Heading 4", {
        fontSize: 24,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "h5") {
      const text = new fabric.IText("Heading 5", {
        fontSize: 18,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "h6") {
      const text = new fabric.IText("Heading 6", {
        fontSize: 16,
        fontWeight: 600,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "para") {
      const text = new fabric.IText("Paragraph", {
        fontSize: 16,
        fontWeight: 400,
        fontFamily: "Roboto",
      });

      canvasRef.current.add(text);
      canvasRef?.current?.setActiveObject(text);
      canvasRef.current.bringToFront(text);
    } else if (type == "img") {
      fabric.Image.fromURL(media, (data) => {
        data.set({
          scaleX: 0.5,
          scaleY: 0.5,
        });
        canvasRef.current.add(data);
        canvasRef?.current?.setActiveObject(data);
        canvasRef.current.bringToFront(data);
      });
    } else if (type == "obj") {
      if (media == "rect") {
        var rect = new fabric.Rect({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          width: 150,
          height: 100,
          fill: "gray",
        });

        canvasRef.current?.add(rect);
        canvasRef?.current?.setActiveObject(rect);
        canvasRef.current.bringToFront(rect);
      } else if (media == "square") {
        var rect = new fabric.Rect({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          width: 100,
          height: 100,
          fill: "gray",
        });

        canvasRef.current?.add(rect);
        canvasRef?.current?.setActiveObject(rect);
        canvasRef.current.bringToFront(rect);
      } else if (media == "square-rounded") {
        var rect = new fabric.Rect({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          width: 100,
          height: 100,
          rx: 10,
          ry: 10,
          fill: "gray",
        });

        canvasRef.current?.add(rect);
        canvasRef?.current?.setActiveObject(rect);
        canvasRef.current.bringToFront(rect);
      } else if (media == "circle") {
        var circle = new fabric.Circle({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          radius: 50,
          fill: "gray",
        });

        canvasRef.current?.add(circle);
        canvasRef?.current?.setActiveObject(circle);
        canvasRef.current.bringToFront(circle);
      } else if (media == "triangle") {
        var triangle = new fabric.Triangle({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          width: 100,
          height: 100,
          fill: "gray",
        });

        canvasRef.current?.add(triangle);
        canvasRef?.current?.setActiveObject(triangle);
        canvasRef.current.bringToFront(triangle);
      } else if (media == "reverse-triangle") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path d="M50 100L0 0L100 0L50 100Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "ellipse") {
        var ellipse = new fabric.Ellipse({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
          rx: 80,
          ry: 40,
          fill: "gray",
        });

        canvasRef.current?.add(ellipse);
        canvasRef?.current?.setActiveObject(ellipse);
        canvasRef.current.bringToFront(ellipse);
      } else if (media == "polygon-4") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path d="M50 0L100 50L50 100L0 50L50 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "polygon-5") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="91" viewBox="0 0 96 91" fill="none">
        <path d="M48 0L95.5528 34.5491L77.3893 90.4509H18.6107L0.447174 34.5491L48 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "polygon-6") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="100" viewBox="0 0 88 100" fill="none">
        <path d="M44 0L87.3013 25V75L44 100L0.69873 75V25L44 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "star-4") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path d="M50 0L63.5045 36.4955L100 50L63.5045 63.5045L50 100L36.4955 63.5045L0 50L36.4955 36.4955L50 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "star-6") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="100" viewBox="0 0 88 100" fill="none">
        <path d="M44 0L61.5 19.6891L87.3013 25L79 50L87.3013 75L61.5 80.3109L44 100L26.5 80.3109L0.69873 75L9 50L0.69873 25L26.5 19.6891L44 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "star-8") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path d="M50 0L63.3939 17.6642L85.3553 14.6447L82.3358 36.6061L100 50L82.3358 63.3939L85.3553 85.3553L63.3939 82.3358L50 100L36.6061 82.3358L14.6447 85.3553L17.6642 63.3939L0 50L17.6642 36.6061L14.6447 14.6447L36.6061 17.6642L50 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "star-12") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path d="M50 0L59.0587 16.1926L75 6.69873L74.7487 25.2513L93.3013 25L83.8074 40.9413L100 50L83.8074 59.0587L93.3013 75L74.7487 74.7487L75 93.3013L59.0587 83.8074L50 100L40.9413 83.8074L25 93.3013L25.2513 74.7487L6.69873 75L16.1926 59.0587L0 50L16.1926 40.9413L6.69873 25L25.2513 25.2513L25 6.69873L40.9413 16.1926L50 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "star") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="91" viewBox="0 0 96 91" fill="none">
        <path d="M48 0L59.2257 34.5491H95.5528L66.1636 55.9017L77.3893 90.4509L48 69.0983L18.6107 90.4509L29.8364 55.9017L0.447174 34.5491H36.7743L48 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "message") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="101" height="101" viewBox="0 0 101 101" fill="none">
        <g clip-path="url(#clip0_5_5)">
          <path d="M50.1021 6.92485C22.4849 6.92485 0.102051 25.1084 0.102051 47.5499C0.102051 57.2374 4.28174 66.1045 11.2349 73.0772C8.79346 82.9209 0.629395 91.6905 0.531738 91.7881C0.102051 92.2374 -0.0151367 92.9014 0.23877 93.4874C0.492676 94.0733 1.03955 94.4249 1.66455 94.4249C14.6138 94.4249 24.3208 88.2139 29.1255 84.3858C35.5122 86.7881 42.6021 88.1749 50.1021 88.1749C77.7192 88.1749 100.102 69.9913 100.102 47.5499C100.102 25.1084 77.7192 6.92485 50.1021 6.92485Z" fill="#D9D9D9"/>
        </g>
        <defs>
          <clipPath id="clip0_5_5">
            <rect width="100" height="100" fill="white" transform="translate(0.102051 0.67485)"/>
          </clipPath>
        </defs>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "right-arrow") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="88" viewBox="0 0 100 88" fill="none">
        <path d="M0 21H62V67H0V21Z" fill="#D9D9D9"/>
        <path d="M100 44L52 0.69873V87.3013L100 44Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "right-up") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="100" viewBox="0 0 88 100" fill="none">
        <path d="M21 100L21 38L67 38V100H21Z" fill="#D9D9D9"/>
        <path d="M44 0L0.69873 48L87.3013 48L44 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "right-left") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="88" viewBox="0 0 100 88" fill="none">
        <path d="M100 67H38L38 21L100 21L100 67Z" fill="#D9D9D9"/>
        <path d="M0 44L48 87.3013L48 0.69873L0 44Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "right-down") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="100" viewBox="0 0 88 100" fill="none">
        <path d="M67 0V62L21 62V0L67 0Z" fill="#D9D9D9"/>
        <path d="M44 100L87.3013 52L0.69873 52L44 100Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      } else if (media == "left-tilted-sq") {
        var startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="100" viewBox="0 0 140 100" fill="none">
        <path d="M0 0H100L140 100H40L0 0Z" fill="#D9D9D9"/>
      </svg>`;

        fabric.loadSVGFromString(startSvg, (objects, options) => {
          var svgObject = fabric.util.groupSVGElements(objects, options);
          svgObject.set({
            left: pointer ? pointer.x : 10,
            top: pointer ? pointer.y : 10,
          });
          canvasRef.current?.add(svgObject);
          canvasRef?.current?.setActiveObject(svgObject);
          canvasRef.current.bringToFront(svgObject);
        });
      }
    } else if (type == "icon") {
      fabric.loadSVGFromString(media, (objects, options) => {
        var svgObject = fabric.util.groupSVGElements(objects, options);
        svgObject.set({
          left: pointer ? pointer.x : 10,
          top: pointer ? pointer.y : 10,
        });

        canvasRef.current?.add(svgObject);
        canvasRef?.current?.setActiveObject(svgObject);
        canvasRef.current.bringToFront(svgObject);
      });
    }

    canvasRef.current?.renderAll();
    canvasRef.current?.requestRenderAll();
  }

  /**
   * this is an items for flip
   */
  const items: MenuProps["items"] = [
    {
      label: <span>Flip Horizontal</span>,
      key: "1",
      onClick: () => handleStyleEvents("horizontal", "flip"),
    },
    {
      label: <span>Flip Vertical</span>,
      key: "2",
      onClick: () => handleStyleEvents("vertical", "flip"),
    },
  ];

  /**
   * this menu is for dropdown alignment
   */

  const alignmentMenu: any = [
    {
      label: (
        <>
          <svg
            onClick={() => handleStyleEvents("left", "textalign")}
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
          >
            <path
              d="M17.5992 10.822H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 6.82202H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 14.822H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M17.5992 18.822H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </>
      ),
      key: "1",
    },
    {
      label: (
        <>
          <svg
            onClick={() => handleStyleEvents("center", "textalign")}
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
          >
            <path
              d="M18.5992 10.8221H6.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 6.82205H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 14.8221H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M18.5992 18.8221H6.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </>
      ),
      key: "2",
    },
    {
      label: (
        <>
          <svg
            onClick={() => handleStyleEvents("right", "textalign")}
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
          >
            <path
              d="M21.5992 10.822H7.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 6.82202H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 14.822H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 18.822H7.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </>
      ),
      key: "3",
    },
    {
      label: (
        <>
          <svg
            onClick={() => handleStyleEvents("justify", "textalign")}
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
          >
            <path
              d="M21.5992 10.8221H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 6.82205H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 14.8221H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M21.5992 18.8221H3.59924"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </>
      ),
      key: "4",
    },
  ];

  /**
   * menu for items for transparent
   */
  const transparentItem: any = [
    {
      label: (
        <>
          <div style={{ width: "200px" }}>
            <label>Transparency</label>
            <Slider
              ref={TransparencyRef}
              min={0}
              max={10}
              defaultValue={canvasRef?.current?.getActiveObject()?.opacity * 10}
              onChange={(e) => handleStyleEvents(e, "opacity")}
            />
          </div>
        </>
      ),
      key: "1",
    },
  ];

  /**
   * this function handles the style of the content
   * @param e
   * @param type
   */
  function handleStyleEvents(e: any, type: string) {
    const currentObject = canvasRef.current?.getActiveObject();

    if (type == "canva-bg") {
      canvasRef?.current?.set({
        backgroundColor: e,
      });
    } else if (type == "fill-svg") {
      if (e == "none") {
        currentObject?.set({
          fill: "transparent",
        });
      } else {
        currentObject?.set({
          fill: e,
        });
      }
    } else if (type == "line-height") {
      currentObject?.set({
        lineHeight: e,
      });
    } else if (type == "letter-spacing") {
      currentObject?.set({
        charSpacing: e,
      });
    } else if (type == "border-width") {
      console.log("camemmme ");
      if (currentObject?.stroke) {
        currentObject?.set({
          strokeWidth: e,
        });
      } else {
        currentObject?.set({
          stroke: "black",
          strokeWidth: e,
        });
      }
    } else if (type == "border-radius") {
      console.log("wewewe ");
      currentObject?.set({
        rx: e,
        ry: e,
      });
    } else if (type == "border-style") {
      if (currentObject?.strokeWidth) {
        currentObject?.set({
          strokeDashArray: [e, e],
        });
      } else {
        currentObject?.set({
          strokeWidth: 1,
          strokeDashArray: [e, e],
        });
      }
    } else if (type == "none") {
      currentObject.filters = [];
      currentObject.applyFilters();
    } else if (type == "grayscale") {
      console.log("camememen");
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Grayscale());
      currentObject.applyFilters();
    } else if (type == "invert") {
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Invert());
      currentObject.applyFilters();
    } else if (type == "sepia") {
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Sepia());
      currentObject.applyFilters();
    } else if (type == "brownie") {
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Grayscale("20%"));
      currentObject.filters.push(new fabric.Image.filters.Sepia("50%"));
      currentObject.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.1 })
      );

      currentObject.applyFilters();
    } else if (type == "vintage") {
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Sepia("30%"));
      currentObject.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.01 })
      );
      currentObject.filters.push(
        new fabric.Image.filters.Contrast({ contrast: 0.01 })
      );
      // currentObject.filters.push(new fabric.Image.filters.Grayscale('10%'));

      currentObject.applyFilters();
    }
    //  else if (type == 'Kodachrome') {
    //   var kodachromeFilter = new fabric.Image.filters.Sepia('0.01%');
    //   var contrastFilter = new fabric.Image.filters.Contrast({ contrast: 0.01 });
    //   var brightnessFilter = new fabric.Image.filters.Brightness({ brightness: -0.01 });

    //   currentObject.filters.push(kodachromeFilter, contrastFilter, brightnessFilter);
    //   console.log('WEWEWEW');
    //   currentObject.applyFilters();
    // }
    else if (type == "technicolor") {
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Sepia("30%"));
      currentObject.filters.push(
        new fabric.Image.filters.Brightness({ brightness: 0.01 })
      );
      currentObject.filters.push(
        new fabric.Image.filters.Contrast({ contrast: 0.01 })
      );
      // currentObject.filters.push(new fabric.Image.filters.Grayscale('10%'));

      currentObject.applyFilters();
    } else if (type == "polaroid") {
      console.log("comeojoejrj");
      currentObject.filters = [];
      currentObject.applyFilters();
      currentObject.filters.push(new fabric.Image.filters.Grayscale());
      currentObject.filters.push(new fabric.Image.filters.Sepia());
      currentObject.applyFilters();
    } else if (type == "stroke-fill-svg") {
      if (e == "none") {
        currentObject?.set({
          stroke: null,
        });
      } else {
        currentObject?.set({
          stroke: e,
        });
      }
    } else if (type == "img-brightness") {
      console.log(e, e * 0.1);

      let brightness = new fabric.Image.filters.Brightness({
        brightness: e * 0.1,
      });

      if (currentObject?.filters) {
        currentObject?.filters?.forEach((filter: any) => {
          if (filter.brightness) {
            filter = e * 0.1;
          }
        });
      } else {
        currentObject?.filters.push(brightness);
      }

      currentObject.applyFilters();
    } else if (type == "stroke-svg") {
      console.log("CC", currentObject?.getObjects());
      currentObject?.getObjects().map((obj: any) => {
        obj.set({
          fill: e,
          stroke: e,
        });
      });
      // currentObject?.set({
      //   fill: e,
      //   stroke: 'red',
      //   backgroundColor: 'red',
      //   background: 'red',
      // });
    }
    // else if (type == 'canva-gradient') {
    //   var gradient = new fabric.Gradient({
    //     type: 'linear',
    //     coords: { x1: 0, y1: 0, x2: canvasRef?.current?.width, y2: canvasRef?.current?.height },
    //     colorStops: [
    //       { offset: 0, color: e?.one },
    //       { offset: 1, color: e?.two },
    //     ],
    //   });

    //   canvasRef?.current?.setBackgroundColor({
    //     source: gradient,
    //     repeat: 'repeat',
    //   });
    // }
    else if (type == "gradient") {
      if (e == "none") {
        currentObject?.set({
          fill: "Gray",
        });
      } else {
        currentObject?.set({
          fill: new fabric.Gradient({
            type: "linear",
            coords: { x1: 0, y1: 0, x2: 150, y2: 0 }, // 90 degrees (left to right)

            colorStops: [
              { offset: 0, color: e?.one },
              { offset: 1, color: e?.two },
            ],
          }),
        });
      }
    } else if (type == "canva-height") {
      canvasRef?.current?.setDimensions({ height: Number(e.target.value) });
    } else if (type == "canva-width") {
      canvasRef?.current?.setDimensions({ width: Number(e.target.value) });
    } else if (type == "opacity") {
      currentObject.set({
        opacity: Number(e / 10),
      });
    } else if (type == "color") {
      currentObject.set({
        fill: e.target.value,
      });
    } else if (type == "b") {
      if (currentObject?.fontWeight == "bold") {
        currentObject?.set({
          fontWeight: "normal",
        });
      } else {
        currentObject?.set({
          fontWeight: "bold",
        });
      }
    } else if (type == "i") {
      if (currentObject?.fontStyle == "italic") {
        currentObject?.set({
          fontStyle: "normal",
        });
      } else {
        currentObject?.set({
          fontStyle: "italic",
        });
      }
    } else if (type == "u") {
      if (currentObject?.underline) {
        currentObject?.set({
          underline: false,
        });
      } else {
        currentObject?.set({
          underline: true,
        });
      }
    } else if (type == "fontsize") {
      currentObject.set({
        fontSize: Number(e),
      });
    } else if (type == "family") {
      // console.log(e);
      currentObject.set({
        fontFamily: e,
      });
    } else if (type == "textalign") {
      currentObject.set({
        textAlign: e,
      });
    } else if (type == "width") {
      currentObject.set({
        width: Number(e.target.value),
      });
    } else if (type == "height") {
      currentObject.set({
        height: Number(e.target.value),
      });
    } else if (type == "flip") {
      if (e == "horizontal") {
        currentObject.set({
          flipX: !currentObject.flipX,
        });
      } else if (e == "vertical") {
        currentObject.set({
          flipY: !currentObject.flipY,
        });
      }
    } else if (type == "image-filter") {
      // currentObject.set({
      // })
    }

    canvasRef.current?.renderAll();
    canvasRef.current?.requestRenderAll();
  }

  /**
   * this function helps us set the cropped area in the cropper
   * @param croppedArea
   * @param croppedAreaPixels
   */
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  /**
   * This function handles the crop submit
   */
  function handleCropSubmit() {
    setIsModalOpen(false);
    console.log(croppedAreaPixels);
    const selectedObject: any = canvasRef.current?.getActiveObject();

    selectedObject.set({
      cropX: croppedAreaPixels?.x,
      cropY: croppedAreaPixels?.y,
      width: croppedAreaPixels?.width,
      height: croppedAreaPixels?.height,
      // scaleX: 1,
      // scaleY: 1,
    });

    // canvasRef?.current?.setDimensions({
    //   height: croppedAreaPixels?.height,
    //   width: croppedAreaPixels?.width,
    // });

    canvasRef.current?.renderAll();
    canvasRef.current?.requestRenderAll();
    // document.querySelector('.reactEasyCrop_Image')?.clientWidth
    setCropAspect(null);
  }

  /**
   * handles incoming crop changes
   */
  function handleCropEvent(e: any) {
    if ((e.x != 0 || e.x != Number(-0)) && e.y != 0) {
      setCrop(e);
    }
  }

  useEffect(() => {
    if (currentMenu == "layers") {
      const list = document.querySelector(
        ".aplus-content-layer-box"
      ) as HTMLElement;
      list.innerHTML = "";
      canvasRef?.current
        ?.getObjects()
        ?.reverse()
        .map((obj: any) => {
          const div = document.createElement("div");
          div.classList.add("aplus-content-layer-content");
          if (obj.get("type") == "i-text") {
            div.innerHTML = obj?.text;
          } else if (obj?.get("type") == "image") {
            const img = document.createElement("img");
            img.src = obj?.getSrc();
            div.appendChild(img);
          } else {
            const img = document.createElement("img") as HTMLImageElement;
            img.src = obj.toDataURL();
            img.style.width = "50%";
            img.style.height = "auto";
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.justifyContent = "center";
            div.appendChild(img);
          }
          list.appendChild(div);
        });

      // const list = document.querySelector('.aplus-content-layer-box') as HTMLElement;
      var sortable = new Sortable(list, {
        sort: true,
        onEnd: (evt: any) => {
          console.log(evt);

          // console.log(evt);
          var origin = evt.oldIndex;
          var destination = evt.newIndex;

          let canvaArr = canvasRef.current?.getObjects().reverse();
          let originalArr = canvasRef.current?.getObjects();

          let stepsmoved = destination - origin;
          console.log(stepsmoved, "STPS MOVED", destination, origin);

          if (origin > destination) {
            console.log("CCAAA");
            // canvasRef.current?.moveTo(canvaArr[origin], destination + 1);
            for (let i = 0; i < Math.abs(stepsmoved); i++) {
              console.log("CCAAA");
              canvasRef?.current.bringForward(canvaArr[origin]);
            }
          } else {
            console.log("DDDDDDDDDD");
            for (let i = 0; i < Math.abs(stepsmoved); i++) {
              console.log("CCAAA");
              canvasRef?.current.sendBackwards(canvaArr[origin]);
            }
          }

          canvasRef.current?.renderAll();
          canvasRef.current?.requestRenderAll();
        },
      });
    }
    if (currentMenu == "objects") {
      const grid = document.querySelector(".icons-grid") as HTMLElement;
      grid.innerHTML = "";
      SvgIcons.map((icon, index) => {
        const Div = document.createElement("div") as HTMLDivElement;
        Div.classList.add("aplus-icon-box");
        Div.draggable = true;
        Div.ondragstart = (e) => handleMediaDragStart("icon", e, icon);
        Div.innerHTML = icon;
        Div.onclick = () => handleCreateElement("icon", icon);
        grid.appendChild(Div);
      });
    }
    // console.log(canvasRef?.current?.getObjects());
  }, [currentMenu, canvasRef?.current?.getObjects()]);

  function handleSave() {
    console.log(canvasRef.current);

    if (canvasRef?.current) {
      onSave(canvasRef.current?.toDataURL());
    }

    // setOutputImage(canvasRef.current?.toDataURL());
  }

  /**
   * handles the remove bg
   */
  function handleRemoveBG() {
    // console.log(canvasRef?.current?.getActiveObject()?.toDataURL());

    // return;
    const div = document.createElement("div");
    const box = document.createElement("div");
    box.classList.add("gpt-loading-box");
    const loader = document.createElement("div");
    loader.classList.add("copy-loader");
    box.appendChild(loader);
    const cancel = document.createElement("button");
    cancel.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
    <path d="M18.0855 6.04507L6.08551 18.0451" stroke="black" stroke-width="2" strokeLinecap="round" stroke-linejoin="round"/>
    <path d="M6.08551 6.04507L18.0855 18.0451" stroke="black" stroke-width="2" strokeLinecap="round" stroke-linejoin="round"/>
  </svg>
    `;
    cancel.classList.add("gpt-cancel-btn");
    box.appendChild(cancel);
    div.classList.add("gpt-loading");
    div.appendChild(box);
    document.body.appendChild(div);

    const controller = new AbortController();
    const signal = controller.signal;

    cancel.onclick = () => {
      controller.abort();
      document.body.removeChild(div);
    };

    axios({
      url: "https://api-oms-dev.rubick.ai/copilot/webhook/preview",
      method: "POST",
      headers: {
        accept: "application/json",
        token: "b110e49a-b0a5-11ee-a7f7-c8f7507e3fb9",
        Authorization:
          "Bearer " + localStorage.getItem("accessToken")?.replaceAll('"', ""),
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      signal,
      data: {
        name: "editImage",
        operator: "editImage",
        inputColumns: [
          {
            name: "image",
            // value: canvasRef?.current?.getActiveObject()?.getSrc(),
            value: canvasRef?.current?.getActiveObject()?.toDataURL(),
            type: "imageurl",
          },
        ],
        outputColumns: [
          {
            name: "editedImage",
            value: "",
          },
        ],
        operands: [
          {
            name: "background",
            value: "transparent",
            mandatory: true,
            options: [],
          },
        ],
        expression: "",
      },
    })
      .then(async (response) => {
        const activeObj = canvasRef?.current?.getActiveObject();

        await imageUrlToBase64(
          response.data?.outputColumns[0].value,
          (url: any) => {
            if (url) {
              activeObj?.setSrc(url, (img: any) => {
                img.set({
                  crossOrigin: "anonymous",
                });

                canvasRef.current?.renderAll();
                canvasRef.current?.requestRenderAll();
                document.body.removeChild(div);
                console.log(img.getSrc(), img);
              });
            }
          }
        );
      })
      .catch((err) => {
        document.body.removeChild(div);
        console.log("BG remover error ", err);
      });
  }

  /**
   * converts the url image to base64
   * @param imageUrl
   * @param callback
   */
  function imageUrlToBase64(imageUrl: any, callback: any) {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = function () {
          callback(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => console.error("Error fetching image:", error));
  }

  /**
   * deletes the selected object
   */
  function handleToolbarDelete() {
    console.log("cccc");
    const activeObj = canvasRef?.current?.getActiveObject();
    console.log(activeObj);
    canvasRef.current.remove(activeObj);
    canvasRef.current?.renderAll();
    canvasRef.current?.requestRenderAll();
  }

  /**
   * duplicates the selected object
   */
  function handleToolbarDuplicate() {
    // var object = fabric.util.object.clone(canvasRef?.current?.getActiveObject());

    canvasRef?.current?.getActiveObject().clone((e: any) => {
      console.log(e);

      e.set({
        top: e.top + 5,
        left: e.left + 5,
      });

      canvasRef?.current?.add(e);
      canvasRef?.current?.discardActiveObject();
      canvasRef?.current?.bringToFront(e);
      canvasRef?.current?.setActiveObject(e);
      canvasRef.current?.renderAll();
      canvasRef.current?.requestRenderAll();
    });

    return;
    // object.set('top', object.top + 5);
    // object.set('left', object.left + 5);
    // canvasRef?.current?.discardActiveObject();
    // canvasRef?.current?.bringToFront(object);
    // canvasRef?.current?.add(object);
    // canvasRef?.current?.setActiveObject(object);
  }

  /**
   * this function handles the click events in unsplash images result
   * @param e
   */
  function handleUnsplashCreate(e: any, name: any) {
    onMediaUpdate({ img: e, name: name });
    setMediaList([...mediaList, { img: e, name: name }]);
    handleCreateElement("img", e);
    setUnsplashSearch(null);
    setIsUnsplashModal(false);
  }

  const BorderWidth: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-flex-20">
          <Slider
            min={0}
            style={{ width: "200px" }}
            max={100}
            className="aplus-content-border-width"
            defaultValue={canvasRef?.current?.getActiveObject()?.strokeWidth}
            onChange={(e) => handleStyleEvents(e, "border-width")}
          />
          {/* <Input
            type="number"
            max={100}
            min={0}
            className="nav-input-popup"
            onChange={(e) => handleStyleEvents(e, 'border-width')}
          /> */}
        </div>
      ),
      key: "1",
    },
  ];

  const FontLineHeight: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-flex-20">
          <Slider
            min={0.5}
            step={0.5}
            style={{ width: "200px" }}
            max={2.5}
            defaultValue={canvasRef?.current?.getActiveObject()?.lineHeight}
            onChange={(e) => handleStyleEvents(e, "line-height")}
          />
          {/* <Input
            type="number"
            max={100}
            min={0}
            className="nav-input-popup"
            onChange={(e) => handleStyleEvents(e, 'border-width')}
          /> */}
        </div>
      ),
      key: "1",
    },
  ];

  const FontLetterSpacing: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-flex-20">
          <Slider
            min={0}
            step={1}
            style={{ width: "200px" }}
            max={800}
            defaultValue={canvasRef?.current?.getActiveObject()?.charSpacing}
            onChange={(e) => handleStyleEvents(e, "letter-spacing")}
          />
          {/* <Input
            type="number"
            max={100}
            min={0}
            className="nav-input-popup"
            onChange={(e) => handleStyleEvents(e, 'border-width')}
          /> */}
        </div>
      ),
      key: "1",
    },
  ];

  const BorderRadius: MenuProps["items"] = [
    {
      label: (
        <Slider
          min={0}
          style={{ width: "200px" }}
          max={100}
          defaultValue={canvasRef?.current?.getActiveObject()?.rx}
          onChange={(e) => handleStyleEvents(e, "border-radius")}
        />
      ),
      key: "1",
    },
  ];

  const BorderStyle: MenuProps["items"] = [
    {
      label: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x2="24"
            y1="50%"
            y2="50%"
            stroke="currentColor"
            stroke-width="2"
            shape-rendering="crispEdges"
          ></line>
        </svg>
      ),
      key: "1",
      onClick: () => handleStyleEvents(0, "border-style"),
    },
    {
      label: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="-1"
            x2="25"
            y1="50%"
            y2="50%"
            stroke="currentColor"
            stroke-dasharray="12 2"
            stroke-width="2"
            shape-rendering="crispEdges"
          ></line>
        </svg>
      ),
      key: "2",
      onClick: () => handleStyleEvents(20, "border-style"),
    },
    {
      label: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="1"
            x2="23"
            y1="50%"
            y2="50%"
            stroke="currentColor"
            stroke-dasharray="6 2"
            stroke-width="2"
            shape-rendering="crispEdges"
          ></line>
        </svg>
      ),
      key: "3",
      onClick: () => handleStyleEvents(10, "border-style"),
    },
    {
      label: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="1"
            x2="23"
            y1="50%"
            y2="50%"
            stroke="currentColor"
            stroke-dasharray="2 2"
            stroke-width="2"
            shape-rendering="crispEdges"
          ></line>
        </svg>
      ),
      key: "4",
      onClick: () => handleStyleEvents(4, "border-style"),
    },
  ];

  const CanvaBackgroundColor: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-assets-bg-grid remove-margin-popup">
          {/* black family */}
          <div
            onClick={() => handleStyleEvents("black", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "black" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#545454", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#545454" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#737373", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#737373" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#a6a6a6", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#a6a6a6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#d9d9d9", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#d9d9d9" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("white", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "white" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF3131", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF3131" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF5757", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF5757" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF66C4", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF66C4" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#cb6ce6", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#cb6ce6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#8c52ff", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#8c52ff" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5e17eb", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5e17eb" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#0097B2", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#0097B2" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#0CC0DF", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#0CC0DF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5CE1E6", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5CE1E6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#38B6FF", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#38B6FF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5271FF", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5271FF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#004AAD", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#004AAD" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#00BF63", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#00BF63" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#7ED957", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#7ED957" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#C1FF72", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#C1FF72" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FFDE59", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FFDE59" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FFBD59", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FFBD59" }}
          ></div>

          <div
            onClick={() => handleStyleEvents("#FF914D", "canva-bg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF914D" }}
          ></div>
        </div>
      ),
      key: "1",
    },
  ];

  const BackgroundColor: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-assets-bg-grid remove-margin-popup">
          {/* black family */}
          <div
            onClick={() => handleStyleEvents("black", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "black" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#545454", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#545454" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#737373", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#737373" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#a6a6a6", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#a6a6a6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#d9d9d9", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#d9d9d9" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("white", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "white" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF3131", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF3131" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF5757", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF5757" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FF66C4", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF66C4" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#cb6ce6", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#cb6ce6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#8c52ff", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#8c52ff" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5e17eb", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5e17eb" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#0097B2", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#0097B2" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#0CC0DF", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#0CC0DF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5CE1E6", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5CE1E6" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#38B6FF", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#38B6FF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#5271FF", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#5271FF" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#004AAD", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#004AAD" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#00BF63", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#00BF63" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#7ED957", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#7ED957" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#C1FF72", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#C1FF72" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FFDE59", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FFDE59" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("#FFBD59", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FFBD59" }}
          ></div>

          <div
            onClick={() => handleStyleEvents("#FF914D", "fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "#FF914D" }}
          ></div>
        </div>
      ),
      key: "1",
    },
  ];

  const BackgroundGradient: MenuProps["items"] = [
    {
      label: (
        <div
          className="aplus-content-svg-clrs-grid remove-margin-popup"
          style={{ marginBottom: "0 !important" }}
        >
          <div
            onClick={() => handleStyleEvents("none", "gradient")}
            className="aplus-content-assets-bg-box"
          >
            <svg
              style={{ height: "42px", width: "100%" }}
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="99"
                height="99"
                rx="3.5"
                fill="white"
                stroke="black"
              />
              <rect
                x="0.667419"
                y="97.0433"
                width="136.579"
                height="3"
                rx="1"
                transform="rotate(-45 0.667419 97.0433)"
                fill="#FF0000"
              />
            </svg>
          </div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "black", two: "gray" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, black, gray)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "black", two: "yellow" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, black, yellow)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "black", two: "blue" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, black, blue)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "lightgray", two: "white" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, lightgray, white)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents(
                { one: "lightyellow", two: "lightpink" },
                "gradient"
              )
            }
            className="aplus-content-assets-bg-box"
            style={{
              background: "linear-gradient(90deg, lightyellow, lightpink)",
            }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "red", two: "orange" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, red, orange)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "red", two: "purple" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, red, purple)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "purple", two: "pink" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, purple, pink)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "blue", two: "pink" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, blue, pink)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "violet", two: "lightblue" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, violet, lightblue)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "yellow", two: "orange" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, yellow, orange)" }}
          ></div>
          <div
            onClick={() =>
              handleStyleEvents({ one: "pink", two: "yellow" }, "gradient")
            }
            className="aplus-content-assets-bg-box"
            style={{ background: "linear-gradient(90deg, pink, yellow)" }}
          ></div>
        </div>
      ),
      key: "1",
    },
  ];

  const BackgroundStrokeColor: MenuProps["items"] = [
    {
      label: (
        <div className="aplus-content-svg-clrs-grid remove-margin-popup">
          {/* black family */}
          <div
            onClick={() => handleStyleEvents("none", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
          >
            <svg
              style={{ height: "42px", width: "100%" }}
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="99"
                height="99"
                rx="3.5"
                fill="white"
                stroke="black"
              />
              <rect
                x="0.667419"
                y="97.0433"
                width="136.579"
                height="3"
                rx="1"
                transform="rotate(-45 0.667419 97.0433)"
                fill="#FF0000"
              />
            </svg>
          </div>
          <div
            // onClick={() => handleStyleEvents('black', 'fill-svg')}
            className="aplus-content-assets-bg-box"
            // style={{ backgroundColor: 'black' }}
          >
            <input
              type="color"
              onChange={(e) =>
                handleStyleEvents(e.target.value, "stroke-fill-svg")
              }
              className="color-picker"
            />
          </div>
          <div
            onClick={() => handleStyleEvents("black", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "black" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("gray", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "gray" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("lightgray", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "lightgray" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("white", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "white" }}
          ></div>
          {/* Red family */}
          <div
            onClick={() => handleStyleEvents("red", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "Red" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("orange", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "orange" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("pink", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "pink" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("magenta", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "magenta" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("violet", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "violet" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("purple", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "purple" }}
          ></div>
          {/* green family */}
          <div
            onClick={() => handleStyleEvents("turquoise", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "turquoise" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("aqua", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "aqua" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("blue", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "blue" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("lightblue", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "lightblue" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("green", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "green" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("lightgreen", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "lightgreen" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("lime", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "lime" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("yellow", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "yellow" }}
          ></div>
          <div
            onClick={() => handleStyleEvents("coral", "stroke-fill-svg")}
            className="aplus-content-assets-bg-box"
            style={{ backgroundColor: "coral" }}
          ></div>
        </div>
      ),
      key: "1",
    },
  ];

  function DropdownClick(type: any) {
    if (type == "stroke-color") {
      if (isStrokeStyle) {
        setIsStrokeStyle(false);
      } else {
        setIsStrokeStyle(true);
      }
    } else if (type == "bg-color") {
      if (isBgStyle) {
        setIsBgStyle(false);
      } else {
        setIsBgStyle(true);
      }
    }
  }

  function handleDropdownClick(e: any) {
    e.preventDefault();
    setTimeout(() => {
      console.log(canvasRef?.current?.getActiveObject()?.textAlign);
    }, 200);
  }

  return (
    <Fragment>
      <div className="aplus-content-container">
        <div className="aplus-content-sidebar-holder">
          <div className="aplus-content-sidebar">
            <div className="aplus-content-sidebar-box">
              <svg
                width="28"
                height="40"
                viewBox="0 0 28 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 12.9389H7"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14 19.9389L7 12.9389L14 5.93892"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M1.05682 37V28.2727H4.10795C4.71591 28.2727 5.21733 28.3778 5.61222 28.5881C6.0071 28.7955 6.30114 29.0753 6.49432 29.4276C6.6875 29.777 6.78409 30.1648 6.78409 30.5909C6.78409 30.9659 6.71733 31.2756 6.58381 31.5199C6.45313 31.7642 6.27983 31.9574 6.06392 32.0994C5.85085 32.2415 5.61932 32.3466 5.36932 32.4148V32.5C5.63636 32.517 5.90483 32.6108 6.17472 32.7812C6.4446 32.9517 6.67045 33.196 6.85227 33.5142C7.03409 33.8324 7.125 34.2216 7.125 34.6818C7.125 35.1193 7.02557 35.5128 6.8267 35.8622C6.62784 36.2116 6.31392 36.4886 5.88494 36.6932C5.45597 36.8977 4.89773 37 4.21023 37H1.05682ZM2.11364 36.0625H4.21023C4.90057 36.0625 5.39063 35.929 5.6804 35.6619C5.97301 35.392 6.11932 35.0653 6.11932 34.6818C6.11932 34.3864 6.04403 34.1136 5.89347 33.8636C5.7429 33.6108 5.52841 33.4091 5.25 33.2585C4.97159 33.1051 4.64205 33.0284 4.26136 33.0284H2.11364V36.0625ZM2.11364 32.108H4.07386C4.39205 32.108 4.67898 32.0455 4.93466 31.9205C5.19318 31.7955 5.39773 31.6193 5.5483 31.392C5.7017 31.1648 5.77841 30.8977 5.77841 30.5909C5.77841 30.2074 5.64489 29.8821 5.37784 29.6151C5.1108 29.3452 4.6875 29.2102 4.10795 29.2102H2.11364V32.108ZM10.6513 37.1534C10.2365 37.1534 9.86009 37.0753 9.52202 36.919C9.18395 36.7599 8.91548 36.5312 8.71662 36.233C8.51776 35.9318 8.41832 35.5682 8.41832 35.142C8.41832 34.767 8.49219 34.4631 8.63991 34.2301C8.78764 33.9943 8.98509 33.8097 9.23224 33.6761C9.4794 33.5426 9.75213 33.4432 10.0504 33.3778C10.3516 33.3097 10.6541 33.2557 10.9581 33.2159C11.3558 33.1648 11.6783 33.1264 11.9254 33.1009C12.1754 33.0724 12.3572 33.0256 12.4709 32.9602C12.5874 32.8949 12.6456 32.7812 12.6456 32.6193V32.5852C12.6456 32.1648 12.5305 31.8381 12.3004 31.6051C12.0732 31.3722 11.728 31.2557 11.2649 31.2557C10.7848 31.2557 10.4084 31.3608 10.1357 31.571C9.86293 31.7812 9.67116 32.0057 9.56037 32.2443L8.60582 31.9034C8.77628 31.5057 9.00355 31.196 9.28764 30.9744C9.57457 30.75 9.88707 30.5937 10.2251 30.5057C10.5661 30.4148 10.9013 30.3693 11.2308 30.3693C11.4411 30.3693 11.6825 30.3949 11.9553 30.446C12.2308 30.4943 12.4964 30.5952 12.7521 30.7486C13.0107 30.902 13.2251 31.1335 13.3956 31.4432C13.5661 31.7528 13.6513 32.1676 13.6513 32.6875V37H12.6456V36.1136H12.5945C12.5263 36.2557 12.4126 36.4077 12.2536 36.5696C12.0945 36.7315 11.8828 36.8693 11.6186 36.983C11.3544 37.0966 11.032 37.1534 10.6513 37.1534ZM10.8047 36.25C11.2024 36.25 11.5376 36.1719 11.8104 36.0156C12.0859 35.8594 12.2933 35.6577 12.4325 35.4105C12.5746 35.1634 12.6456 34.9034 12.6456 34.6307V33.7102C12.603 33.7614 12.5092 33.8082 12.3643 33.8509C12.2223 33.8906 12.0575 33.9261 11.87 33.9574C11.6854 33.9858 11.505 34.0114 11.3288 34.0341C11.1555 34.054 11.0149 34.071 10.907 34.0852C10.6456 34.1193 10.4013 34.1747 10.174 34.2514C9.94957 34.3253 9.76776 34.4375 9.62855 34.5881C9.49219 34.7358 9.42401 34.9375 9.42401 35.1932C9.42401 35.5426 9.55327 35.8068 9.81179 35.9858C10.0732 36.1619 10.4041 36.25 10.8047 36.25ZM18.146 37.1364C17.5323 37.1364 17.0039 36.9915 16.5607 36.7017C16.1175 36.4119 15.7766 36.0128 15.538 35.5043C15.2994 34.9957 15.18 34.4148 15.18 33.7614C15.18 33.0966 15.3022 32.5099 15.5465 32.0014C15.7937 31.4901 16.1374 31.0909 16.5778 30.804C17.021 30.5142 17.538 30.3693 18.1289 30.3693C18.5891 30.3693 19.0039 30.4545 19.3732 30.625C19.7425 30.7955 20.0451 31.0341 20.2809 31.3409C20.5167 31.6477 20.663 32.0057 20.7198 32.4148H19.7141C19.6374 32.1165 19.467 31.8523 19.2028 31.6222C18.9414 31.3892 18.5891 31.2727 18.146 31.2727C17.7539 31.2727 17.4102 31.375 17.1147 31.5795C16.8221 31.7812 16.5934 32.0668 16.4286 32.4361C16.2667 32.8026 16.1857 33.233 16.1857 33.7273C16.1857 34.233 16.2653 34.6733 16.4244 35.0483C16.5863 35.4233 16.8136 35.7145 17.1062 35.9219C17.4016 36.1293 17.7482 36.233 18.146 36.233C18.4073 36.233 18.6445 36.1875 18.8576 36.0966C19.0707 36.0057 19.2511 35.875 19.3988 35.7045C19.5465 35.5341 19.6516 35.3295 19.7141 35.0909H20.7198C20.663 35.4773 20.5224 35.8253 20.2979 36.1349C20.0763 36.4418 19.7823 36.6861 19.4158 36.8679C19.0522 37.0469 18.6289 37.1364 18.146 37.1364ZM23.1275 34.6136L23.1104 33.3693H23.315L26.1786 30.4545H27.4229L24.3718 33.5398H24.2866L23.1275 34.6136ZM22.19 37V28.2727H23.1957V37H22.19ZM26.3491 37L23.7923 33.7614L24.5082 33.0625L27.6275 37H26.3491Z"
                  fill="#F4F4F4"
                />
              </svg>
            </div>
            {/* text box */}
            <div
              onClick={() => handleSidebarToggle("text")}
              className="aplus-content-sidebar-box"
            >
              <svg
                width="25"
                height="39"
                viewBox="0 0 25 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.880327 28.2102V27.2727H7.42578V28.2102H4.68146V36H3.62465V28.2102H0.880327ZM10.7156 36.1364C10.0849 36.1364 9.54084 35.9972 9.08345 35.7188C8.62891 35.4375 8.27805 35.0455 8.03089 34.5426C7.78658 34.0369 7.66442 33.4489 7.66442 32.7784C7.66442 32.108 7.78658 31.517 8.03089 31.0057C8.27805 30.4915 8.6218 30.0909 9.06214 29.804C9.50533 29.5142 10.0224 29.3693 10.6133 29.3693C10.9542 29.3693 11.2908 29.4261 11.6232 29.5398C11.9556 29.6534 12.2582 29.8381 12.5309 30.0938C12.8036 30.3466 13.021 30.6818 13.1829 31.0994C13.3448 31.517 13.4258 32.0312 13.4258 32.642V33.0682H8.38033V32.1989H12.4031C12.4031 31.8295 12.3292 31.5 12.1815 31.2102C12.0366 30.9205 11.8292 30.6918 11.5593 30.5241C11.2923 30.3565 10.9769 30.2727 10.6133 30.2727C10.2127 30.2727 9.86612 30.3722 9.57351 30.571C9.28374 30.767 9.06072 31.0227 8.90447 31.3381C8.74822 31.6534 8.6701 31.9915 8.6701 32.3523V32.9318C8.6701 33.4261 8.75533 33.8452 8.92578 34.1889C9.09908 34.5298 9.33913 34.7898 9.64595 34.9688C9.95277 35.1449 10.3093 35.233 10.7156 35.233C10.9798 35.233 11.2184 35.196 11.4315 35.1222C11.6474 35.0455 11.8335 34.9318 11.9897 34.7812C12.146 34.6278 12.2667 34.4375 12.3519 34.2102L13.3235 34.483C13.2212 34.8125 13.0494 35.1023 12.8079 35.3523C12.5664 35.5994 12.2681 35.7926 11.913 35.9318C11.5579 36.0682 11.1587 36.1364 10.7156 36.1364ZM15.5298 29.4545L17.098 32.1307L18.6662 29.4545H19.8253L17.7116 32.7273L19.8253 36H18.6662L17.098 33.4602L15.5298 36H14.3707L16.4503 32.7273L14.3707 29.4545H15.5298ZM24.1069 29.4545V30.3068H20.7148V29.4545H24.1069ZM21.7035 27.8864H22.7092V34.125C22.7092 34.4091 22.7504 34.6222 22.8327 34.7642C22.918 34.9034 23.0259 34.9972 23.1566 35.0455C23.2901 35.0909 23.4308 35.1136 23.5785 35.1136C23.6893 35.1136 23.7802 35.108 23.8512 35.0966C23.9222 35.0824 23.979 35.071 24.0217 35.0625L24.2262 35.9659C24.158 35.9915 24.0629 36.017 23.9407 36.0426C23.8185 36.071 23.6637 36.0852 23.4762 36.0852C23.1921 36.0852 22.9137 36.0241 22.641 35.902C22.3711 35.7798 22.1467 35.5938 21.9677 35.3438C21.7915 35.0938 21.7035 34.7784 21.7035 34.3977V27.8864Z"
                  fill="#F4F4F4"
                />
                <path
                  d="M5 7V4H21V7"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10 20H16"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M13 4V20"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            {/* Media box */}
            <div
              onClick={() => handleSidebarToggle("media")}
              className="aplus-content-sidebar-box"
            >
              <svg
                width="35"
                height="39"
                viewBox="0 0 35 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.19549 27.2727H2.45685L5.42276 34.517H5.52504L8.49094 27.2727H9.75231V36H8.76367V29.3693H8.67844L5.95117 36H4.99663L2.26935 29.3693H2.18413V36H1.19549V27.2727ZM14.4792 36.1364C13.8485 36.1364 13.3045 35.9972 12.8471 35.7188C12.3926 35.4375 12.0417 35.0455 11.7946 34.5426C11.5502 34.0369 11.4281 33.4489 11.4281 32.7784C11.4281 32.108 11.5502 31.517 11.7946 31.0057C12.0417 30.4915 12.3855 30.0909 12.8258 29.804C13.269 29.5142 13.786 29.3693 14.377 29.3693C14.7179 29.3693 15.0545 29.4261 15.3869 29.5398C15.7193 29.6534 16.0218 29.8381 16.2946 30.0938C16.5673 30.3466 16.7846 30.6818 16.9466 31.0994C17.1085 31.517 17.1895 32.0312 17.1895 32.642V33.0682H12.144V32.1989H16.1667C16.1667 31.8295 16.0929 31.5 15.9451 31.2102C15.8002 30.9205 15.5929 30.6918 15.323 30.5241C15.0559 30.3565 14.7406 30.2727 14.377 30.2727C13.9764 30.2727 13.6298 30.3722 13.3372 30.571C13.0474 30.767 12.8244 31.0227 12.6681 31.3381C12.5119 31.6534 12.4338 31.9915 12.4338 32.3523V32.9318C12.4338 33.4261 12.519 33.8452 12.6895 34.1889C12.8627 34.5298 13.1028 34.7898 13.4096 34.9688C13.7164 35.1449 14.073 35.233 14.4792 35.233C14.7434 35.233 14.9821 35.196 15.1951 35.1222C15.411 35.0455 15.5971 34.9318 15.7534 34.7812C15.9096 34.6278 16.0304 34.4375 16.1156 34.2102L17.0872 34.483C16.9849 34.8125 16.813 35.1023 16.5716 35.3523C16.3301 35.5994 16.0318 35.7926 15.6767 35.9318C15.3216 36.0682 14.9224 36.1364 14.4792 36.1364ZM21.1909 36.1364C20.6454 36.1364 20.1639 35.9986 19.7463 35.723C19.3287 35.4446 19.002 35.0526 18.7662 34.5469C18.5304 34.0384 18.4125 33.4375 18.4125 32.7443C18.4125 32.0568 18.5304 31.4602 18.7662 30.9545C19.002 30.4489 19.3301 30.0582 19.7505 29.7827C20.171 29.5071 20.6568 29.3693 21.2079 29.3693C21.6341 29.3693 21.9707 29.4403 22.2179 29.5824C22.4679 29.7216 22.6582 29.8807 22.7889 30.0597C22.9224 30.2358 23.0261 30.3807 23.1 30.4943H23.1852V27.2727H24.1909V36H23.2193V34.9943H23.1C23.0261 35.1136 22.921 35.2642 22.7846 35.446C22.6483 35.625 22.4537 35.7855 22.2008 35.9276C21.948 36.0668 21.6113 36.1364 21.1909 36.1364ZM21.3272 35.233C21.7306 35.233 22.0716 35.1278 22.35 34.9176C22.6284 34.7045 22.84 34.4105 22.9849 34.0355C23.1298 33.6577 23.2022 33.2216 23.2022 32.7273C23.2022 32.2386 23.1312 31.8111 22.9892 31.4446C22.8471 31.0753 22.6369 30.7884 22.3585 30.5838C22.0801 30.3764 21.7363 30.2727 21.3272 30.2727C20.9011 30.2727 20.546 30.3821 20.2619 30.6009C19.9806 30.8168 19.769 31.1108 19.627 31.483C19.4877 31.8523 19.4181 32.267 19.4181 32.7273C19.4181 33.1932 19.4892 33.6165 19.6312 33.9972C19.7761 34.375 19.9892 34.6761 20.2704 34.9006C20.5545 35.1222 20.9068 35.233 21.3272 35.233ZM26.1724 36V29.4545H27.1781V36H26.1724ZM26.6838 28.3636C26.4877 28.3636 26.3187 28.2969 26.1767 28.1634C26.0375 28.0298 25.9679 27.8693 25.9679 27.6818C25.9679 27.4943 26.0375 27.3338 26.1767 27.2003C26.3187 27.0668 26.4877 27 26.6838 27C26.8798 27 27.0474 27.0668 27.1866 27.2003C27.3287 27.3338 27.3997 27.4943 27.3997 27.6818C27.3997 27.8693 27.3287 28.0298 27.1866 28.1634C27.0474 28.2969 26.8798 28.3636 26.6838 28.3636ZM30.9462 36.1534C30.5314 36.1534 30.155 36.0753 29.8169 35.919C29.4789 35.7599 29.2104 35.5312 29.0115 35.233C28.8127 34.9318 28.7132 34.5682 28.7132 34.142C28.7132 33.767 28.7871 33.4631 28.9348 33.2301C29.0826 32.9943 29.28 32.8097 29.5272 32.6761C29.7743 32.5426 30.0471 32.4432 30.3453 32.3778C30.6465 32.3097 30.949 32.2557 31.253 32.2159C31.6507 32.1648 31.9732 32.1264 32.2203 32.1009C32.4703 32.0724 32.6522 32.0256 32.7658 31.9602C32.8823 31.8949 32.9405 31.7812 32.9405 31.6193V31.5852C32.9405 31.1648 32.8255 30.8381 32.5953 30.6051C32.3681 30.3722 32.0229 30.2557 31.5598 30.2557C31.0797 30.2557 30.7033 30.3608 30.4306 30.571C30.1578 30.7812 29.9661 31.0057 29.8553 31.2443L28.9007 30.9034C29.0712 30.5057 29.2985 30.196 29.5826 29.9744C29.8695 29.75 30.182 29.5937 30.5201 29.5057C30.861 29.4148 31.1962 29.3693 31.5257 29.3693C31.736 29.3693 31.9775 29.3949 32.2502 29.446C32.5257 29.4943 32.7914 29.5952 33.0471 29.7486C33.3056 29.902 33.5201 30.1335 33.6905 30.4432C33.861 30.7528 33.9462 31.1676 33.9462 31.6875V36H32.9405V35.1136H32.8894C32.8212 35.2557 32.7076 35.4077 32.5485 35.5696C32.3894 35.7315 32.1777 35.8693 31.9135 35.983C31.6493 36.0966 31.3269 36.1534 30.9462 36.1534ZM31.0996 35.25C31.4973 35.25 31.8326 35.1719 32.1053 35.0156C32.3809 34.8594 32.5882 34.6577 32.7275 34.4105C32.8695 34.1634 32.9405 33.9034 32.9405 33.6307V32.7102C32.8979 32.7614 32.8042 32.8082 32.6593 32.8509C32.5172 32.8906 32.3525 32.9261 32.165 32.9574C31.9803 32.9858 31.7999 33.0114 31.6238 33.0341C31.4505 33.054 31.3098 33.071 31.2019 33.0852C30.9405 33.1193 30.6962 33.1747 30.4689 33.2514C30.2445 33.3253 30.0627 33.4375 29.9235 33.5881C29.7871 33.7358 29.7189 33.9375 29.7189 34.1932C29.7189 34.5426 29.8482 34.8068 30.1067 34.9858C30.3681 35.1619 30.699 35.25 31.0996 35.25Z"
                  fill="#F4F4F4"
                />
                <path
                  d="M25 3H11C9.89543 3 9 3.89543 9 5V19C9 20.1046 9.89543 21 11 21H25C26.1046 21 27 20.1046 27 19V5C27 3.89543 26.1046 3 25 3Z"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.5 10C15.3284 10 16 9.32843 16 8.5C16 7.67157 15.3284 7 14.5 7C13.6716 7 13 7.67157 13 8.5C13 9.32843 13.6716 10 14.5 10Z"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M27 15L22 10L11 21"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            {/* Objects Box */}
            <div
              onClick={() => handleSidebarToggle("objects")}
              className="aplus-content-sidebar-box"
            >
              <svg
                width="44"
                height="39"
                viewBox="0 0 44 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.60014 31.6364C8.60014 32.5568 8.43395 33.3523 8.10156 34.0227C7.76918 34.6932 7.31321 35.2102 6.73367 35.5739C6.15412 35.9375 5.49219 36.1193 4.74787 36.1193C4.00355 36.1193 3.34162 35.9375 2.76207 35.5739C2.18253 35.2102 1.72656 34.6932 1.39418 34.0227C1.06179 33.3523 0.895597 32.5568 0.895597 31.6364C0.895597 30.7159 1.06179 29.9205 1.39418 29.25C1.72656 28.5795 2.18253 28.0625 2.76207 27.6989C3.34162 27.3352 4.00355 27.1534 4.74787 27.1534C5.49219 27.1534 6.15412 27.3352 6.73367 27.6989C7.31321 28.0625 7.76918 28.5795 8.10156 29.25C8.43395 29.9205 8.60014 30.7159 8.60014 31.6364ZM7.57742 31.6364C7.57742 30.8807 7.45099 30.2429 7.19815 29.723C6.94815 29.2031 6.60866 28.8097 6.17969 28.5426C5.75355 28.2756 5.27628 28.142 4.74787 28.142C4.21946 28.142 3.74077 28.2756 3.31179 28.5426C2.88565 28.8097 2.54616 29.2031 2.29332 29.723C2.04332 30.2429 1.91832 30.8807 1.91832 31.6364C1.91832 32.392 2.04332 33.0298 2.29332 33.5497C2.54616 34.0696 2.88565 34.4631 3.31179 34.7301C3.74077 34.9972 4.21946 35.1307 4.74787 35.1307C5.27628 35.1307 5.75355 34.9972 6.17969 34.7301C6.60866 34.4631 6.94815 34.0696 7.19815 33.5497C7.45099 33.0298 7.57742 32.392 7.57742 31.6364ZM10.3771 36V27.2727H11.3828V30.4943H11.468C11.5419 30.3807 11.6442 30.2358 11.7749 30.0597C11.9084 29.8807 12.0987 29.7216 12.3459 29.5824C12.5959 29.4403 12.9339 29.3693 13.3601 29.3693C13.9112 29.3693 14.397 29.5071 14.8175 29.7827C15.2379 30.0582 15.5661 30.4489 15.8018 30.9545C16.0376 31.4602 16.1555 32.0568 16.1555 32.7443C16.1555 33.4375 16.0376 34.0384 15.8018 34.5469C15.5661 35.0526 15.2393 35.4446 14.8217 35.723C14.4041 35.9986 13.9226 36.1364 13.3771 36.1364C12.9567 36.1364 12.62 36.0668 12.3672 35.9276C12.1143 35.7855 11.9197 35.625 11.7834 35.446C11.647 35.2642 11.5419 35.1136 11.468 34.9943H11.3487V36H10.3771ZM11.3658 32.7273C11.3658 33.2216 11.4382 33.6577 11.5831 34.0355C11.728 34.4105 11.9396 34.7045 12.218 34.9176C12.4964 35.1278 12.8374 35.233 13.2408 35.233C13.6612 35.233 14.0121 35.1222 14.2933 34.9006C14.5774 34.6761 14.7905 34.375 14.9325 33.9972C15.0774 33.6165 15.1499 33.1932 15.1499 32.7273C15.1499 32.267 15.0788 31.8523 14.9368 31.483C14.7976 31.1108 14.5859 30.8168 14.3018 30.6009C14.0206 30.3821 13.6669 30.2727 13.2408 30.2727C12.8317 30.2727 12.4879 30.3764 12.2095 30.5838C11.9311 30.7884 11.7209 31.0753 11.5788 31.4446C11.4368 31.8111 11.3658 32.2386 11.3658 32.7273ZM17.6939 29.4545H18.6996V36.4773C18.6996 36.8807 18.63 37.2301 18.4908 37.5256C18.3544 37.821 18.147 38.0497 17.8686 38.2116C17.593 38.3736 17.245 38.4545 16.8246 38.4545C16.7905 38.4545 16.7564 38.4545 16.7223 38.4545C16.6882 38.4545 16.6541 38.4545 16.62 38.4545V37.517C16.6541 37.517 16.6854 37.517 16.7138 37.517C16.7422 37.517 16.7734 37.517 16.8075 37.517C17.1143 37.517 17.3388 37.4261 17.4808 37.2443C17.6229 37.0653 17.6939 36.8097 17.6939 36.4773V29.4545ZM18.1882 28.3636C17.9922 28.3636 17.8232 28.2969 17.6811 28.1634C17.5419 28.0298 17.4723 27.8693 17.4723 27.6818C17.4723 27.4943 17.5419 27.3338 17.6811 27.2003C17.8232 27.0668 17.9922 27 18.1882 27C18.3842 27 18.5518 27.0668 18.6911 27.2003C18.8331 27.3338 18.9041 27.4943 18.9041 27.6818C18.9041 27.8693 18.8331 28.0298 18.6911 28.1634C18.5518 28.2969 18.3842 28.3636 18.1882 28.3636ZM23.2859 36.1364C22.6552 36.1364 22.1112 35.9972 21.6538 35.7188C21.1992 35.4375 20.8484 35.0455 20.6012 34.5426C20.3569 34.0369 20.2347 33.4489 20.2347 32.7784C20.2347 32.108 20.3569 31.517 20.6012 31.0057C20.8484 30.4915 21.1921 30.0909 21.6325 29.804C22.0756 29.5142 22.5927 29.3693 23.1836 29.3693C23.5245 29.3693 23.8612 29.4261 24.1935 29.5398C24.5259 29.6534 24.8285 29.8381 25.1012 30.0938C25.3739 30.3466 25.5913 30.6818 25.7532 31.0994C25.9151 31.517 25.9961 32.0312 25.9961 32.642V33.0682H20.9506V32.1989H24.9734C24.9734 31.8295 24.8995 31.5 24.7518 31.2102C24.6069 30.9205 24.3995 30.6918 24.1296 30.5241C23.8626 30.3565 23.5472 30.2727 23.1836 30.2727C22.783 30.2727 22.4364 30.3722 22.1438 30.571C21.854 30.767 21.631 31.0227 21.4748 31.3381C21.3185 31.6534 21.2404 31.9915 21.2404 32.3523V32.9318C21.2404 33.4261 21.3256 33.8452 21.4961 34.1889C21.6694 34.5298 21.9094 34.7898 22.2163 34.9688C22.5231 35.1449 22.8796 35.233 23.2859 35.233C23.5501 35.233 23.7887 35.196 24.0018 35.1222C24.2177 35.0455 24.4038 34.9318 24.56 34.7812C24.7163 34.6278 24.837 34.4375 24.9222 34.2102L25.8938 34.483C25.7915 34.8125 25.6197 35.1023 25.3782 35.3523C25.1367 35.5994 24.8384 35.7926 24.4833 35.9318C24.1282 36.0682 23.729 36.1364 23.2859 36.1364ZM30.185 36.1364C29.5714 36.1364 29.043 35.9915 28.5998 35.7017C28.1566 35.4119 27.8157 35.0128 27.5771 34.5043C27.3384 33.9957 27.2191 33.4148 27.2191 32.7614C27.2191 32.0966 27.3413 31.5099 27.5856 31.0014C27.8327 30.4901 28.1765 30.0909 28.6168 29.804C29.06 29.5142 29.5771 29.3693 30.168 29.3693C30.6282 29.3693 31.043 29.4545 31.4123 29.625C31.7816 29.7955 32.0842 30.0341 32.32 30.3409C32.5558 30.6477 32.7021 31.0057 32.7589 31.4148H31.7532C31.6765 31.1165 31.506 30.8523 31.2418 30.6222C30.9805 30.3892 30.6282 30.2727 30.185 30.2727C29.793 30.2727 29.4492 30.375 29.1538 30.5795C28.8612 30.7812 28.6325 31.0668 28.4677 31.4361C28.3058 31.8026 28.2248 32.233 28.2248 32.7273C28.2248 33.233 28.3043 33.6733 28.4634 34.0483C28.6254 34.4233 28.8526 34.7145 29.1452 34.9219C29.4407 35.1293 29.7873 35.233 30.185 35.233C30.4464 35.233 30.6836 35.1875 30.8967 35.0966C31.1097 35.0057 31.2901 34.875 31.4379 34.7045C31.5856 34.5341 31.6907 34.3295 31.7532 34.0909H32.7589C32.7021 34.4773 32.5614 34.8253 32.337 35.1349C32.1154 35.4418 31.8214 35.6861 31.4549 35.8679C31.0913 36.0469 30.668 36.1364 30.185 36.1364ZM37.0756 29.4545V30.3068H33.6836V29.4545H37.0756ZM34.6722 27.8864H35.6779V34.125C35.6779 34.4091 35.7191 34.6222 35.8015 34.7642C35.8867 34.9034 35.9947 34.9972 36.1254 35.0455C36.2589 35.0909 36.3995 35.1136 36.5472 35.1136C36.658 35.1136 36.7489 35.108 36.82 35.0966C36.891 35.0824 36.9478 35.071 36.9904 35.0625L37.195 35.9659C37.1268 35.9915 37.0316 36.017 36.9094 36.0426C36.7873 36.071 36.6325 36.0852 36.445 36.0852C36.1609 36.0852 35.8825 36.0241 35.6097 35.902C35.3398 35.7798 35.1154 35.5938 34.9364 35.3438C34.7603 35.0938 34.6722 34.7784 34.6722 34.3977V27.8864ZM43.1076 30.9205L42.2042 31.1761C42.1474 31.0256 42.0636 30.8793 41.9528 30.7372C41.8448 30.5923 41.6971 30.473 41.5096 30.3793C41.3221 30.2855 41.082 30.2386 40.7894 30.2386C40.3888 30.2386 40.055 30.331 39.788 30.5156C39.5238 30.6974 39.3917 30.929 39.3917 31.2102C39.3917 31.4602 39.4826 31.6577 39.6644 31.8026C39.8462 31.9474 40.1303 32.0682 40.5167 32.1648L41.4883 32.4034C42.0735 32.5455 42.5096 32.7628 42.7965 33.0554C43.0835 33.3452 43.2269 33.7187 43.2269 34.1761C43.2269 34.5511 43.119 34.8864 42.9031 35.1818C42.69 35.4773 42.3917 35.7102 42.0082 35.8807C41.6246 36.0511 41.1786 36.1364 40.6701 36.1364C40.0025 36.1364 39.4499 35.9915 39.0124 35.7017C38.5749 35.4119 38.2979 34.9886 38.1815 34.4318L39.136 34.1932C39.2269 34.5455 39.3988 34.8097 39.6516 34.9858C39.9073 35.1619 40.2411 35.25 40.6531 35.25C41.1218 35.25 41.494 35.1506 41.7695 34.9517C42.0479 34.75 42.1871 34.5085 42.1871 34.2273C42.1871 34 42.1076 33.8097 41.9485 33.6562C41.7894 33.5 41.5451 33.3835 41.2156 33.3068L40.1246 33.0511C39.5252 32.9091 39.0849 32.6889 38.8036 32.3906C38.5252 32.0895 38.386 31.7131 38.386 31.2614C38.386 30.892 38.4897 30.5653 38.6971 30.2812C38.9073 29.9972 39.1928 29.7741 39.5536 29.6122C39.9173 29.4503 40.3292 29.3693 40.7894 29.3693C41.4371 29.3693 41.9457 29.5114 42.315 29.7955C42.6871 30.0795 42.9513 30.4545 43.1076 30.9205Z"
                  fill="#F4F4F4"
                />
                <path
                  d="M31 16V8C30.9996 7.64928 30.9071 7.30481 30.7315 7.00116C30.556 6.69752 30.3037 6.44536 30 6.27L23 2.27C22.696 2.09446 22.3511 2.00205 22 2.00205C21.6489 2.00205 21.304 2.09446 21 2.27L14 6.27C13.6963 6.44536 13.444 6.69752 13.2685 7.00116C13.0929 7.30481 13.0004 7.64928 13 8V16C13.0004 16.3507 13.0929 16.6952 13.2685 16.9988C13.444 17.3025 13.6963 17.5546 14 17.73L21 21.73C21.304 21.9055 21.6489 21.998 22 21.998C22.3511 21.998 22.696 21.9055 23 21.73L30 17.73C30.3037 17.5546 30.556 17.3025 30.7315 16.9988C30.9071 16.6952 30.9996 16.3507 31 16Z"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M13.27 6.96L22 12.01L30.73 6.96"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M22 22.08V12"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            {/* Layers box */}
            <div
              onClick={() => handleSidebarToggle("layers")}
              className="aplus-content-sidebar-box"
            >
              <svg
                width="38"
                height="39"
                viewBox="0 0 38 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.33612 36V27.2727H2.39293V35.0625H6.44975V36H1.33612ZM9.87589 36.1534C9.46112 36.1534 9.08469 36.0753 8.74663 35.919C8.40856 35.7599 8.14009 35.5312 7.94123 35.233C7.74237 34.9318 7.64293 34.5682 7.64293 34.142C7.64293 33.767 7.7168 33.4631 7.86452 33.2301C8.01225 32.9943 8.20969 32.8097 8.45685 32.6761C8.70401 32.5426 8.97674 32.4432 9.27504 32.3778C9.57617 32.3097 9.87873 32.2557 10.1827 32.2159C10.5804 32.1648 10.9029 32.1264 11.15 32.1009C11.4 32.0724 11.5819 32.0256 11.6955 31.9602C11.812 31.8949 11.8702 31.7812 11.8702 31.6193V31.5852C11.8702 31.1648 11.7551 30.8381 11.525 30.6051C11.2978 30.3722 10.9526 30.2557 10.4895 30.2557C10.0094 30.2557 9.63299 30.3608 9.36026 30.571C9.08754 30.7812 8.89577 31.0057 8.78498 31.2443L7.83043 30.9034C8.00089 30.5057 8.22816 30.196 8.51225 29.9744C8.79918 29.75 9.11168 29.5937 9.44975 29.5057C9.79066 29.4148 10.1259 29.3693 10.4554 29.3693C10.6657 29.3693 10.9071 29.3949 11.1799 29.446C11.4554 29.4943 11.7211 29.5952 11.9767 29.7486C12.2353 29.902 12.4498 30.1335 12.6202 30.4432C12.7907 30.7528 12.8759 31.1676 12.8759 31.6875V36H11.8702V35.1136H11.8191C11.7509 35.2557 11.6373 35.4077 11.4782 35.5696C11.3191 35.7315 11.1074 35.8693 10.8432 35.983C10.579 36.0966 10.2566 36.1534 9.87589 36.1534ZM10.0293 35.25C10.427 35.25 10.7623 35.1719 11.035 35.0156C11.3105 34.8594 11.5179 34.6577 11.6571 34.4105C11.7992 34.1634 11.8702 33.9034 11.8702 33.6307V32.7102C11.8276 32.7614 11.7338 32.8082 11.589 32.8509C11.4469 32.8906 11.2821 32.9261 11.0946 32.9574C10.91 32.9858 10.7296 33.0114 10.5534 33.0341C10.3801 33.054 10.2395 33.071 10.1316 33.0852C9.87021 33.1193 9.62589 33.1747 9.39862 33.2514C9.17418 33.3253 8.99237 33.4375 8.85316 33.5881C8.7168 33.7358 8.64862 33.9375 8.64862 34.1932C8.64862 34.5426 8.77788 34.8068 9.0364 34.9858C9.29776 35.1619 9.62873 35.25 10.0293 35.25ZM15.1248 38.4545C14.9544 38.4545 14.8024 38.4403 14.6689 38.4119C14.5353 38.3864 14.443 38.3608 14.3919 38.3352L14.6475 37.4489C14.8919 37.5114 15.1078 37.5341 15.2953 37.517C15.4828 37.5 15.649 37.4162 15.7939 37.2656C15.9416 37.1179 16.0765 36.8778 16.1987 36.5455L16.3862 36.0341L13.9657 29.4545H15.0566L16.8635 34.6705H16.9316L18.7385 29.4545H19.8294L17.051 36.9545C16.926 37.2926 16.7711 37.5724 16.5865 37.794C16.4018 38.0185 16.1873 38.1847 15.943 38.2926C15.7015 38.4006 15.4288 38.4545 15.1248 38.4545ZM23.6667 36.1364C23.036 36.1364 22.492 35.9972 22.0346 35.7188C21.5801 35.4375 21.2292 35.0455 20.9821 34.5426C20.7377 34.0369 20.6156 33.4489 20.6156 32.7784C20.6156 32.108 20.7377 31.517 20.9821 31.0057C21.2292 30.4915 21.573 30.0909 22.0133 29.804C22.4565 29.5142 22.9735 29.3693 23.5645 29.3693C23.9054 29.3693 24.242 29.4261 24.5744 29.5398C24.9068 29.6534 25.2093 29.8381 25.4821 30.0938C25.7548 30.3466 25.9721 30.6818 26.1341 31.0994C26.296 31.517 26.377 32.0312 26.377 32.642V33.0682H21.3315V32.1989H25.3542C25.3542 31.8295 25.2804 31.5 25.1326 31.2102C24.9877 30.9205 24.7804 30.6918 24.5105 30.5241C24.2434 30.3565 23.9281 30.2727 23.5645 30.2727C23.1639 30.2727 22.8173 30.3722 22.5247 30.571C22.2349 30.767 22.0119 31.0227 21.8556 31.3381C21.6994 31.6534 21.6213 31.9915 21.6213 32.3523V32.9318C21.6213 33.4261 21.7065 33.8452 21.877 34.1889C22.0502 34.5298 22.2903 34.7898 22.5971 34.9688C22.9039 35.1449 23.2605 35.233 23.6667 35.233C23.9309 35.233 24.1696 35.196 24.3826 35.1222C24.5985 35.0455 24.7846 34.9318 24.9409 34.7812C25.0971 34.6278 25.2179 34.4375 25.3031 34.2102L26.2747 34.483C26.1724 34.8125 26.0005 35.1023 25.7591 35.3523C25.5176 35.5994 25.2193 35.7926 24.8642 35.9318C24.5091 36.0682 24.1099 36.1364 23.6667 36.1364ZM27.9068 36V29.4545H28.8784V30.4432H28.9466C29.0659 30.1193 29.2818 29.8565 29.5943 29.6548C29.9068 29.4531 30.2591 29.3523 30.6511 29.3523C30.725 29.3523 30.8173 29.3537 30.9281 29.3565C31.0389 29.3594 31.1227 29.3636 31.1795 29.3693V30.392C31.1454 30.3835 31.0673 30.3707 30.9451 30.3537C30.8258 30.3338 30.6994 30.3239 30.5659 30.3239C30.2477 30.3239 29.9636 30.3906 29.7136 30.5241C29.4664 30.6548 29.2704 30.8366 29.1255 31.0696C28.9835 31.2997 28.9125 31.5625 28.9125 31.858V36H27.9068ZM37.008 30.9205L36.1046 31.1761C36.0478 31.0256 35.964 30.8793 35.8532 30.7372C35.7452 30.5923 35.5975 30.473 35.41 30.3793C35.2225 30.2855 34.9824 30.2386 34.6898 30.2386C34.2892 30.2386 33.9554 30.331 33.6884 30.5156C33.4242 30.6974 33.2921 30.929 33.2921 31.2102C33.2921 31.4602 33.383 31.6577 33.5648 31.8026C33.7466 31.9474 34.0307 32.0682 34.4171 32.1648L35.3887 32.4034C35.9739 32.5455 36.41 32.7628 36.6969 33.0554C36.9838 33.3452 37.1273 33.7187 37.1273 34.1761C37.1273 34.5511 37.0194 34.8864 36.8034 35.1818C36.5904 35.4773 36.2921 35.7102 35.9086 35.8807C35.525 36.0511 35.079 36.1364 34.5705 36.1364C33.9029 36.1364 33.3503 35.9915 32.9128 35.7017C32.4753 35.4119 32.1983 34.9886 32.0819 34.4318L33.0364 34.1932C33.1273 34.5455 33.2992 34.8097 33.552 34.9858C33.8077 35.1619 34.1415 35.25 34.5534 35.25C35.0222 35.25 35.3944 35.1506 35.6699 34.9517C35.9483 34.75 36.0875 34.5085 36.0875 34.2273C36.0875 34 36.008 33.8097 35.8489 33.6562C35.6898 33.5 35.4455 33.3835 35.1159 33.3068L34.025 33.0511C33.4256 32.9091 32.9853 32.6889 32.704 32.3906C32.4256 32.0895 32.2864 31.7131 32.2864 31.2614C32.2864 30.892 32.3901 30.5653 32.5975 30.2812C32.8077 29.9972 33.0932 29.7741 33.454 29.6122C33.8176 29.4503 34.2296 29.3693 34.6898 29.3693C35.3375 29.3693 35.8461 29.5114 36.2154 29.7955C36.5875 30.0795 36.8517 30.4545 37.008 30.9205Z"
                  fill="#F4F4F4"
                />
                <path
                  d="M19 2L9 7L19 12L29 7L19 2Z"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M9 17L19 22L29 17"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M9 12L19 17L29 12"
                  stroke="#F4F4F4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
          <div
            className={
              currentMenu
                ? "aplus-content-assets-container aplus-content-assets-container-active"
                : "aplus-content-assets-container"
            }
            style={{
              background:
                currentMenu == "bg" ||
                currentMenu == "dimensions" ||
                currentMenu == "edit"
                  ? "#FFFFFF"
                  : "#222222",
            }}
          >
            {currentMenu == "text" && (
              <div className="aplus-content-assets-text">
                <div className="aplus-content-assets-title">Text</div>
                <div className="aplus-content-assets-flex">
                  <h1
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 1")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h1")}
                    style={{ fontSize: "48px" }}
                  >
                    Heading 1
                  </h1>
                  <h2
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 2")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h2")}
                    style={{ fontSize: "42px" }}
                  >
                    Heading 2
                  </h2>
                  <h3
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 3")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h3")}
                    style={{ fontSize: "36px" }}
                  >
                    Heading 3
                  </h3>
                  <h4
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 4")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h4")}
                    style={{ fontSize: "24px" }}
                  >
                    Heading 4
                  </h4>
                  <h5
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 5")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h5")}
                    style={{ fontSize: "18px" }}
                  >
                    Heading 5
                  </h5>
                  <h6
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Heading 6")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("h6")}
                    style={{ fontSize: "16px" }}
                  >
                    Heading 6
                  </h6>
                  <p
                    draggable={true}
                    onDragStart={(e) =>
                      handleMediaDragStart("text", e, "Paragraph")
                    }
                    className="aplus-content-assests-text-box"
                    onClick={() => handleCreateElement("para")}
                  >
                    Paragraph
                  </p>
                </div>
              </div>
            )}
            {currentMenu == "bg" &&
              !selectedElement &&
              !selectedElementType && (
                <div className="aplus-content-assests-bg">
                  <div className="aplus-content-assets-title">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.235 9.19a1.5 1.5 0 1 1 .448-2.966 1.5 1.5 0 0 1-.448 2.966zM14.235 8.99a1.5 1.5 0 1 1 .448-2.966 1.5 1.5 0 0 1-.448 2.966zm2.317 3.2A1.5 1.5 0 1 1 17 9.224a1.5 1.5 0 0 1-.448 2.966z"
                        fill="currentColor"
                      ></path>
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M12.586 3v.015c4.749.06 8.63 3.52 8.63 7.854a5.202 5.202 0 0 1-5.195 5.195H14.44a.575.575 0 0 0-.435.962 2.085 2.085 0 0 1-1.542 3.478h-.005a8.755 8.755 0 0 1 0-17.5l.13-.004zM7.51 6.73a7.255 7.255 0 0 1 4.955-2.216c4.035.001 7.242 2.88 7.242 6.355a3.693 3.693 0 0 1-3.685 3.695h-1.58a2.084 2.084 0 0 0-1.554 3.458l.007.007a.576.576 0 0 1-.428.985A7.255 7.255 0 0 1 7.509 6.73z"
                        fill="currentColor"
                      ></path>
                    </svg>{" "}
                    Default Colours
                  </div>
                  <div className="aplus-content-assets-subtitle">
                    Solid colours
                  </div>
                  <div className="aplus-content-assets-bg-grid">
                    <Tooltip title="Black #000000" placement="bottomLeft">
                      <div
                        onClick={() => handleStyleEvents("black", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "black" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Dark Gray #545454" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#545454", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#545454" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Gray #737373" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#737373", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#737373" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Gray #A6A6A6" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#a6a6a6", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#a6a6a6" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Light Gray #D9D9D9" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#d9d9d9", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#d9d9d9" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="White #FFFFFF" placement="bottomRight">
                      <div
                        onClick={() => handleStyleEvents("white", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "white" }}
                      ></div>
                    </Tooltip>
                    {/* Red family */}
                    <Tooltip title="Bright Red #FF3131" placement="bottomLeft">
                      <div
                        onClick={() => handleStyleEvents("#FF3131", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FF3131" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Coral Red #FF5757" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#FF5757", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FF5757" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Pink #FF66C4" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#FF66C4", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FF66C4" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Magenta #CB6CE6" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#cb6ce6", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#cb6ce6" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Purple #8C52FF" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#8c52ff", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#8c52ff" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Violet #5E17EB" placement="bottomRight">
                      <div
                        onClick={() => handleStyleEvents("#5e17eb", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#5e17eb" }}
                      ></div>
                    </Tooltip>

                    <Tooltip
                      title="Dark Turquoise #0097B2"
                      placement="bottomLeft"
                    >
                      <div
                        onClick={() => handleStyleEvents("#0097B2", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#0097B2" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Aqua Blue #0CC0DF" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#0CC0DF", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#0CC0DF" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Turquoise Blue #5CE1E6" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#5CE1E6", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#5CE1E6" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Light Blue #38B6FF" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#38B6FF", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#38B6FF" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Royal Blue #5271FF" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#5271FF", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#5271FF" }}
                      ></div>
                    </Tooltip>
                    <Tooltip
                      title="Cobalt Blue #004AAD"
                      placement="bottomRight"
                    >
                      <div
                        onClick={() => handleStyleEvents("#004AAD", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#004AAD" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Green #00BF63" placement="bottomLeft">
                      <div
                        onClick={() => handleStyleEvents("#00BF63", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#00BF63" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Grass Green #7ED957" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#7ED957", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#7ED957" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Lime #C1FF72" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#C1FF72", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#C1FF72" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Yellow #FFDE59" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#FFDE59", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FFDE59" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Peach #FFBD59" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#FFBD59", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FFBD59" }}
                      ></div>
                    </Tooltip>
                    <Tooltip title="Orange #FF914D" placement="bottom">
                      <div
                        onClick={() => handleStyleEvents("#FF914D", "canva-bg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "#FF914D" }}
                      ></div>
                    </Tooltip>
                  </div>
                </div>
              )}
            {currentMenu == "media" && (
              <div className="aplus-content-assets-media">
                <div className="aplus-content-assets-title">Media</div>

                <div className="aplus-content-search">
                  <Input
                    type="text"
                    placeholder="Search"
                    onChange={handleMediaSearch}
                    value={mediaSearchText}
                  />
                </div>

                <div className="aplus-media-upload">
                  {/* <Input type="file" onChange={handleMediaUpload} />
                  <Button type="primary" onClick={handleMediaUploadSubmit}>
                    Upload
                  </Button> */}

                  <Dragger
                    name="file"
                    // onChange={handleMediaUpload}
                    customRequest={customRequest}
                    multiple={false}
                    showUploadList={false}
                    className="aplus-media-input"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                  </Dragger>
                </div>
                <div className="aplus-content-media-grid">
                  {mediaList?.map((media: any) => (
                    <img
                      src={media.img}
                      onDragStart={(e) =>
                        handleMediaDragStart("img", e, media.img)
                      }
                      data-src={media.img}
                      onClick={() => handleCreateElement("img", media.img)}
                      alt="image-url"
                      className="aplus-content-media-grid-image"
                    />
                  ))}
                </div>
              </div>
            )}
            {currentMenu == "edit" &&
              canvasRef?.current?.getActiveObject() &&
              (selectedElementType == "rect" || "triangle" || "path") &&
              selectedElementType !== "image" &&
              selectedElementType !== "group" && (
                <div className="aplus-content-edit">
                  <div className="aplus-content-assets-title">Object Edit</div>

                  <div className="aplus-content-sidebar-group">
                    <h6 className="aplus-content-assets-subtitle">
                      Background
                    </h6>
                    {/* <Input
                      type="color"
                      defaultValue={selectedElement?.height}
                      onBlur={(e) => handleStyleEvents(e, 'color')}
                    /> */}
                    <div className="aplus-content-svg-clrs-grid">
                      {/* black family */}
                      <div
                        onClick={() => handleStyleEvents("none", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                      >
                        <svg
                          style={{ height: "42px", width: "100%" }}
                          width="100"
                          height="100"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="0.5"
                            y="0.5"
                            width="99"
                            height="99"
                            rx="3.5"
                            fill="white"
                            stroke="black"
                          />
                          <rect
                            x="0.667419"
                            y="97.0433"
                            width="136.579"
                            height="3"
                            rx="1"
                            transform="rotate(-45 0.667419 97.0433)"
                            fill="#FF0000"
                          />
                        </svg>
                      </div>
                      <div
                        // onClick={() => handleStyleEvents('black', 'fill-svg')}
                        className="aplus-content-assets-bg-box"
                        // style={{ backgroundColor: 'black' }}
                      >
                        <input
                          type="color"
                          onChange={(e) =>
                            handleStyleEvents(e.target.value, "fill-svg")
                          }
                          className="color-picker"
                        />
                      </div>
                      <div
                        onClick={() => handleStyleEvents("black", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "black" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("gray", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "gray" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgray", "fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgray" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("white", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "white" }}
                      ></div>
                      {/* Red family */}
                      <div
                        onClick={() => handleStyleEvents("red", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "Red" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("orange", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "orange" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("pink", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "pink" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("magenta", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "magenta" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("violet", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "violet" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("purple", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "purple" }}
                      ></div>
                      {/* green family */}
                      <div
                        onClick={() =>
                          handleStyleEvents("turquoise", "fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "turquoise" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("aqua", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "aqua" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("blue", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "blue" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightblue", "fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightblue" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("green", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "green" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgreen", "fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgreen" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("lime", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lime" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("yellow", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "yellow" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("coral", "fill-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "coral" }}
                      ></div>
                    </div>
                  </div>

                  <div className="aplus-content-sidebar-group">
                    <h6 className="aplus-content-assets-subtitle">
                      Stroke Color
                    </h6>

                    <div className="aplus-content-svg-clrs-grid">
                      <div
                        onClick={() =>
                          handleStyleEvents("none", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                      >
                        <svg
                          style={{ height: "42px", width: "100%" }}
                          width="100"
                          height="100"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="0.5"
                            y="0.5"
                            width="99"
                            height="99"
                            rx="3.5"
                            fill="white"
                            stroke="black"
                          />
                          <rect
                            x="0.667419"
                            y="97.0433"
                            width="136.579"
                            height="3"
                            rx="1"
                            transform="rotate(-45 0.667419 97.0433)"
                            fill="#FF0000"
                          />
                        </svg>
                      </div>
                      <div className="aplus-content-assets-bg-box">
                        <input
                          type="color"
                          onChange={(e) =>
                            handleStyleEvents(e.target.value, "stroke-fill-svg")
                          }
                          className="color-picker"
                        />
                      </div>
                      <div
                        onClick={() =>
                          handleStyleEvents("black", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "black" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("gray", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "gray" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgray", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgray" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("white", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "white" }}
                      ></div>

                      <div
                        onClick={() =>
                          handleStyleEvents("red", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "Red" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("orange", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "orange" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("pink", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "pink" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("magenta", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "magenta" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("violet", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "violet" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("purple", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "purple" }}
                      ></div>

                      <div
                        onClick={() =>
                          handleStyleEvents("turquoise", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "turquoise" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("aqua", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "aqua" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("blue", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "blue" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightblue", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightblue" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("green", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "green" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgreen", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgreen" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lime", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lime" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("yellow", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "yellow" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("coral", "stroke-fill-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "coral" }}
                      ></div>
                    </div>
                  </div>

                  <div className="aplus-content-sidebar-group">
                    <h6 className="aplus-content-assets-subtitle">Gradient</h6>

                    <div className="aplus-content-svg-clrs-grid">
                      <div
                        onClick={() => handleStyleEvents("none", "gradient")}
                        className="aplus-content-assets-bg-box"
                      >
                        <svg
                          style={{ height: "42px", width: "100%" }}
                          width="100"
                          height="100"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="0.5"
                            y="0.5"
                            width="99"
                            height="99"
                            rx="3.5"
                            fill="white"
                            stroke="black"
                          />
                          <rect
                            x="0.667419"
                            y="97.0433"
                            width="136.579"
                            height="3"
                            rx="1"
                            transform="rotate(-45 0.667419 97.0433)"
                            fill="#FF0000"
                          />
                        </svg>
                      </div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "black", two: "gray" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, black, gray)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "black", two: "yellow" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, black, yellow)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "black", two: "blue" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, black, blue)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "lightgray", two: "white" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background:
                            "linear-gradient(90deg, lightgray, white)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "lightyellow", two: "lightpink" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background:
                            "linear-gradient(90deg, lightyellow, lightpink)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "red", two: "orange" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, red, orange)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "red", two: "purple" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, red, purple)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "purple", two: "pink" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, purple, pink)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "blue", two: "pink" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, blue, pink)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "violet", two: "lightblue" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background:
                            "linear-gradient(90deg, violet, lightblue)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "yellow", two: "orange" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, yellow, orange)",
                        }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents(
                            { one: "pink", two: "yellow" },
                            "gradient"
                          )
                        }
                        className="aplus-content-assets-bg-box"
                        style={{
                          background: "linear-gradient(90deg, pink, yellow)",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

            {currentMenu == "edit" &&
              selectedElementType !== "group" &&
              "triangle" &&
              "path" &&
              "rect" &&
              selectedElementType == "image" && (
                <div className="aplus-content-edit">
                  <div
                    className="aplus-content-assets-title"
                    onClick={() => handleStyleEvents("grayscale", "grayscale")}
                  >
                    Image Filters
                  </div>
                  <div className="aplus-content-img-filter-grid">
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() => handleStyleEvents("img-filter", "none")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        alt="image filter"
                      />
                      <label>None</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() =>
                        handleStyleEvents("grayscale", "grayscale")
                      }
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{ filter: "grayscale(100%)" }}
                        alt="image filter"
                      />
                      <label>Grayscale</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() => handleStyleEvents("invert", "invert")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{ filter: "invert(100%)" }}
                        alt="image filter"
                      />
                      <label>Invert</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() => handleStyleEvents("sepia", "sepia")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{ filter: "sepia(100%)" }}
                        alt="image filter"
                      />
                      <label>Sepia</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() => handleStyleEvents("brownie", "brownie")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{
                          filter: "grayscale(20%) sepia(50%) brightness(90%)",
                        }}
                        alt="image filter"
                      />
                      <label>Brownie</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() => handleStyleEvents("vintage", "vintage")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{
                          filter:
                            "sepia(30%) brightness(80%) contrast(120%) grayscale(10%)",
                        }}
                        alt="image filter"
                      />
                      <label>Vintage</label>
                    </div>

                    <div
                      className="aplus-content-img-filter-box"
                      onClick={() =>
                        handleStyleEvents("technicolor", "technicolor")
                      }
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{
                          filter:
                            "contrast(130%) brightness(120%) saturate(120%) sepia(10%)",
                        }}
                        alt="image filter"
                      />
                      <label>Technicolor</label>
                    </div>
                    <div
                      className="aplus-content-img-filter-box polaroid-image"
                      onClick={() => handleStyleEvents("polaroid", "polaroid")}
                    >
                      <img
                        src={canvasRef?.current?.getActiveObject()?.getSrc()}
                        style={{
                          filter:
                            "saturate(150%) contrast(120%) brightness(110%)",
                        }}
                        alt="image filter"
                      />
                      <label>Polaroid</label>
                    </div>
                  </div>
                </div>
              )}

            {currentMenu == "edit" &&
              selectedElementType == "group" &&
              selectedElementType !== "triangle" &&
              selectedElementType !== "path" &&
              selectedElementType !== "image" && (
                <div className="aplus-content-edit">
                  <div className="aplus-content-assets-title">Object Edit</div>

                  <div className="aplus-content-sidebar-group">
                    <h6>Stroke Color</h6>

                    <div className="aplus-content-svg-clrs-grid">
                      <div
                        onClick={() => handleStyleEvents("black", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "black" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("gray", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "gray" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgray", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgray" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("white", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "white" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("red", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "Red" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("orange", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "orange" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("pink", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "pink" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("magenta", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "magenta" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("violet", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "violet" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("purple", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "purple" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("turquoise", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "turquoise" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("aqua", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "aqua" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("blue", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "blue" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightblue", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightblue" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("green", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "green" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("lightgreen", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lightgreen" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("lime", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "lime" }}
                      ></div>
                      <div
                        onClick={() =>
                          handleStyleEvents("yellow", "stroke-svg")
                        }
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "yellow" }}
                      ></div>
                      <div
                        onClick={() => handleStyleEvents("coral", "stroke-svg")}
                        className="aplus-content-assets-bg-box"
                        style={{ backgroundColor: "coral" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            {currentMenu == "objects" && (
              <div className="aplus-content-layers">
                <div className="aplus-content-assets-title">Shapes</div>
                <div className="aplus-content-obj-shape-grid">
                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "square")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "square")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      // draggable={true}
                      // onClick={() => handleCreateElement('obj', 'square')}
                    >
                      <path d="M0 0H100V100H0V0Z" fill="#D9D9D9" />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "square-rounded")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "square-rounded")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      // onClick={() => handleCreateElement('obj', 'square-rounded')}
                    >
                      <path
                        d="M0 10C0 4.47716 4.47715 0 10 0H90C95.5228 0 100 4.47715 100 10V90C100 95.5228 95.5228 100 90 100H10C4.47716 100 0 95.5228 0 90V10Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "rect")}
                    onDragStart={(e) => handleMediaDragStart("obj", e, "rect")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="200"
                      height="100"
                      viewBox="0 0 200 100"
                      fill="none"
                      // onClick={() => handleCreateElement('obj', 'rect')}
                    >
                      <path d="M0 0H200V100H0V0Z" fill="#D9D9D9" />
                    </svg>
                  </div>
                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "circle")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "circle")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      // onClick={() => handleCreateElement('obj', 'circle')}
                    >
                      <path
                        d="M0 50C0 22.3858 22.3858 0 50 0C77.6142 0 100 22.3858 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "triangle")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "triangle")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      // onClick={() => handleCreateElement('obj', 'triangle')}
                    >
                      <path d="M50 0L100 100H0L50 0Z" fill="#D9D9D9" />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() =>
                      handleCreateElement("obj", "reverse-triangle")
                    }
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "reverse-triangle")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      // onClick={() => handleCreateElement('obj', 'reverse-triangle')}
                    >
                      <path d="M50 100L0 0L100 0L50 100Z" fill="#D9D9D9" />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "ellipse")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "ellipse")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="181"
                      height="100"
                      viewBox="0 0 181 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "ellipse")}
                    >
                      <path
                        d="M181 50C181 77.6142 140.482 100 90.5 100C40.5182 100 0 77.6142 0 50C0 22.3858 40.5182 0 90.5 0C140.482 0 181 22.3858 181 50Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "star")}
                    onDragStart={(e) => handleMediaDragStart("obj", e, "star")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="96"
                      height="91"
                      viewBox="0 0 96 91"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "star")}
                    >
                      <path
                        d="M48 0L59.2257 34.5491H95.5528L66.1636 55.9017L77.3893 90.4509L48 69.0983L18.6107 90.4509L29.8364 55.9017L0.447174 34.5491H36.7743L48 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "star-4")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "star-4")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "star-4")}
                    >
                      <path
                        d="M50 0L63.5045 36.4955L100 50L63.5045 63.5045L50 100L36.4955 63.5045L0 50L36.4955 36.4955L50 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "star-6")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "star-6")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="88"
                      height="100"
                      viewBox="0 0 88 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "star-6")}
                    >
                      <path
                        d="M44 0L61.5 19.6891L87.3013 25L79 50L87.3013 75L61.5 80.3109L44 100L26.5 80.3109L0.69873 75L9 50L0.69873 25L26.5 19.6891L44 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "star-8")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "star-8")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "star-8")}
                    >
                      <path
                        d="M50 0L63.3939 17.6642L85.3553 14.6447L82.3358 36.6061L100 50L82.3358 63.3939L85.3553 85.3553L63.3939 82.3358L50 100L36.6061 82.3358L14.6447 85.3553L17.6642 63.3939L0 50L17.6642 36.6061L14.6447 14.6447L36.6061 17.6642L50 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "star-12")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "star-12")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "star-12")}
                    >
                      <path
                        d="M50 0L59.0587 16.1926L75 6.69873L74.7487 25.2513L93.3013 25L83.8074 40.9413L100 50L83.8074 59.0587L93.3013 75L74.7487 74.7487L75 93.3013L59.0587 83.8074L50 100L40.9413 83.8074L25 93.3013L25.2513 74.7487L6.69873 75L16.1926 59.0587L0 50L16.1926 40.9413L6.69873 25L25.2513 25.2513L25 6.69873L40.9413 16.1926L50 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "polygon-4")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "polygon-4")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "polygon-4")}
                    >
                      <path d="M50 0L100 50L50 100L0 50L50 0Z" fill="#D9D9D9" />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "polygon-5")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "polygon-5")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="96"
                      height="91"
                      viewBox="0 0 96 91"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "polygon-5")}
                    >
                      <path
                        d="M48 0L95.5528 34.5491L77.3893 90.4509H18.6107L0.447174 34.5491L48 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "polygon-6")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "polygon-6")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="88"
                      height="100"
                      viewBox="0 0 88 100"
                      onClick={() => handleCreateElement("obj", "polygon-6")}
                      fill="none"
                    >
                      <path
                        d="M44 0L87.3013 25V75L44 100L0.69873 75V25L44 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "message")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "message")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="101"
                      height="101"
                      viewBox="0 0 101 101"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "message")}
                    >
                      <g clip-path="url(#clip0_5_5)">
                        <path
                          d="M50.1021 6.92485C22.4849 6.92485 0.102051 25.1084 0.102051 47.5499C0.102051 57.2374 4.28174 66.1045 11.2349 73.0772C8.79346 82.9209 0.629395 91.6905 0.531738 91.7881C0.102051 92.2374 -0.0151367 92.9014 0.23877 93.4874C0.492676 94.0733 1.03955 94.4249 1.66455 94.4249C14.6138 94.4249 24.3208 88.2139 29.1255 84.3858C35.5122 86.7881 42.6021 88.1749 50.1021 88.1749C77.7192 88.1749 100.102 69.9913 100.102 47.5499C100.102 25.1084 77.7192 6.92485 50.1021 6.92485Z"
                          fill="#D9D9D9"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_5_5">
                          <rect
                            width="100"
                            height="100"
                            fill="white"
                            transform="translate(0.102051 0.67485)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "right-arrow")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "right-arrow")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="88"
                      viewBox="0 0 100 88"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "right-arrow")}
                    >
                      <path d="M0 21H62V67H0V21Z" fill="#D9D9D9" />
                      <path
                        d="M100 44L52 0.69873V87.3013L100 44Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "right-up")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "right-up")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="88"
                      height="100"
                      viewBox="0 0 88 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "right-up")}
                    >
                      <path d="M21 100L21 38L67 38V100H21Z" fill="#D9D9D9" />
                      <path
                        d="M44 0L0.69873 48L87.3013 48L44 0Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "right-left")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "right-left")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100"
                      height="88"
                      viewBox="0 0 100 88"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "right-left")}
                    >
                      <path
                        d="M100 67H38L38 21L100 21L100 67Z"
                        fill="#D9D9D9"
                      />
                      <path
                        d="M0 44L48 87.3013L48 0.69873L0 44Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "right-down")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "right-down")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="88"
                      height="100"
                      viewBox="0 0 88 100"
                      fill="none"
                      onClick={() => handleCreateElement("obj", "right-down")}
                    >
                      <path d="M67 0V62L21 62V0L67 0Z" fill="#D9D9D9" />
                      <path
                        d="M44 100L87.3013 52L0.69873 52L44 100Z"
                        fill="#D9D9D9"
                      />
                    </svg>
                  </div>

                  <div
                    draggable={true}
                    onClick={() => handleCreateElement("obj", "left-tilted-sq")}
                    onDragStart={(e) =>
                      handleMediaDragStart("obj", e, "left-tilted-sq")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="140"
                      height="100"
                      viewBox="0 0 140 100"
                      fill="none"
                      onClick={() =>
                        handleCreateElement("obj", "left-tilted-sq")
                      }
                    >
                      <path d="M0 0H100L140 100H40L0 0Z" fill="#D9D9D9" />
                    </svg>
                  </div>
                </div>

                <div className="aplus-content-assets-title">Icons</div>
                <div className="aplus-content-svg-clrs-grid icons-grid"></div>
              </div>
            )}
            {currentMenu == "layers" && (
              <div className="aplus-content-layers">
                <div className="aplus-content-assets-title">Layers</div>
                <div className="aplus-content-layer-box"></div>
              </div>
            )}
          </div>
        </div>
        <div className="aplus-content-main">
          <nav className="aplus-content-nav">
            <div className="aplus-content-nav-item">
              {!selectedElement && (
                <div className="aplus-content-nav-item">
                  {/* <span className="aplus-content-nav-button" onClick={() => handleNavEvents('bg')}>
                    <img src={MultiColor} alt="multi" />
                  </span> */}

                  <Dropdown
                    trigger={["click"]}
                    menu={{ items: CanvaBackgroundColor }}
                    placement="bottomLeft"
                  >
                    <a
                      onClick={(e) => e.preventDefault()}
                      className="aplus-content-nav-button"
                    >
                      <img src={MultiColor} alt="multi" />
                    </a>
                  </Dropdown>
                  <div className="aplus-content-divider"></div>

                  <div className="aplus-content-nav-input-group">
                    <h6>H</h6>
                    <Input
                      className="aplus-content-nav-input"
                      defaultValue={canvasRef?.current?.height}
                      placeholder="Enter Height"
                      onPressEnter={(e) => handleStyleEvents(e, "canva-height")}
                      onBlur={(e) => handleStyleEvents(e, "canva-height")}
                    />
                  </div>
                  {/* <div className="aplus-content-divider"></div> */}
                  <div className="aplus-content-nav-input-group">
                    <h6>W</h6>
                    <Input
                      className="aplus-content-nav-input"
                      defaultValue={canvasRef?.current?.width}
                      placeholder="Enter Width"
                      onPressEnter={(e) => handleStyleEvents(e, "canva-width")}
                      onBlur={(e) => handleStyleEvents(e, "canva-width")}
                    />
                  </div>
                </div>
              )}

              {selectedElement &&
                canvasRef?.current?.getActiveObject() &&
                selectedElementType == "image" && (
                  <div className="aplus-content-nav-item">
                    <div className="aplus-content-nav-input-group">
                      <h6>H</h6>
                      <Input
                        className="aplus-content-nav-input"
                        defaultValue={
                          canvasRef?.current?.getActiveObject()?.height *
                          canvasRef?.current?.getActiveObject()?.scaleY
                        }
                        placeholder="Enter Height"
                        onPressEnter={(e) => handleStyleEvents(e, "height")}
                        onBlur={(e) => handleStyleEvents(e, "height")}
                      />
                    </div>
                    <div className="aplus-content-nav-input-group">
                      <h6>W</h6>
                      <Input
                        className="aplus-content-nav-input"
                        defaultValue={
                          canvasRef?.current?.getActiveObject()?.width *
                          canvasRef?.current?.getActiveObject()?.scaleX
                        }
                        onPressEnter={(e) => handleStyleEvents(e, "width")}
                        onBlur={(e) => handleStyleEvents(e, "width")}
                        placeholder="Enter Width"
                      />
                    </div>
                    <div className="aplus-content-divider"></div>
                    <Dropdown
                      trigger={["click"]}
                      menu={{ items }}
                      placement="bottomLeft"
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                      >
                        Flip
                      </a>
                    </Dropdown>
                    <div className="aplus-content-divider"></div>
                    <div
                      className="aplus-content-nav-button"
                      onClick={handleRemoveBG}
                    >
                      Remove BG
                    </div>
                    <div className="aplus-content-divider"></div>
                    <div
                      className="aplus-content-nav-button"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Crop
                    </div>
                    <Modal
                      onCancel={() => setIsModalOpen(false)}
                      onOk={handleCropSubmit}
                      open={isModalOpen}
                      width={"1080px"}
                      // style={{ height: Number(canvasRef.current?.getActiveObject().height * 0.7) }}
                    >
                      <div className="aplus-content-cropper-holder">
                        {isModalOpen && (
                          <Cropper
                            image={canvasRef.current
                              ?.getActiveObject()
                              ?.getSrc()}
                            crop={crop}
                            zoom={zoom}
                            onCropChange={(e) => handleCropEvent(e)}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            restrictPosition={false}
                            aspect={
                              (document.querySelector(".reactEasyCrop_Image")
                                ?.clientWidth || 0) /
                              (document.querySelector(".reactEasyCrop_Image")
                                ?.clientHeight || 0)
                            }
                            // transform="none"
                            // cropSize={{
                            //   width: Number(canvasRef.current?.getActiveObject().width * 0.475),
                            //   height: Number(canvasRef.current?.getActiveObject().height * 0.475),
                            // }}
                            // objectFit={'contain'}
                          />
                          // <ReactCrop
                          //   crop={crop}
                          //   onChange={(_, percentCrop) => setCrop(percentCrop)}
                          // >
                          //   <img src={canvasRef.current?.getActiveObject()?.getSrc()} />
                          // </ReactCrop>
                        )}
                      </div>
                    </Modal>
                    <div className="aplus-content-divider"></div>

                    <Dropdown
                      trigger={["click"]}
                      placement="bottomLeft"
                      menu={{ items: transparentItem }}
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                        >
                          <g fill="currentColor" fill-rule="evenodd">
                            <path d="M3 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"></path>
                            <path
                              d="M11 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".45"
                            ></path>
                            <path
                              d="M19 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".15"
                            ></path>
                            <path
                              d="M7 6h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".7"
                            ></path>
                            <path
                              d="M15 6h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".3"
                            ></path>
                          </g>
                        </svg>
                      </a>
                    </Dropdown>
                  </div>
                )}

              {selectedElement &&
                canvasRef?.current?.getActiveObject() &&
                selectedElementType == "i-text" && (
                  <div className="aplus-content-nav-item">
                    <Select
                      style={{ width: "200px" }}
                      defaultValue={selectedElement?.fontFamily}
                      onChange={(e) => handleStyleEvents(e, "family")}
                    >
                      <Select.Option value="Roboto">Roboto</Select.Option>
                      <Select.Option value="Poppins">Poppins</Select.Option>\
                      <Select.Option value="Playfair Display">
                        Playfair Display
                      </Select.Option>
                      <Select.Option value="Inter">Inter</Select.Option>
                    </Select>
                    {/* <div className="aplus-content-divider"></div> */}
                    <Select
                      style={{ width: "80px" }}
                      defaultValue={selectedElement?.fontSize}
                      onChange={(e) => handleStyleEvents(e, "fontsize")}
                    >
                      <Select.Option value="10">10</Select.Option>
                      <Select.Option value="12">12</Select.Option>\
                      <Select.Option value="14">14</Select.Option>
                      <Select.Option value="20">20</Select.Option>
                      <Select.Option value="24">24</Select.Option>
                      <Select.Option value="32">32</Select.Option>
                      <Select.Option value="36">36</Select.Option>
                      <Select.Option value="40">40</Select.Option>
                      <Select.Option value="48">48</Select.Option>
                      <Select.Option value="64">64</Select.Option>
                      <Select.Option value="96">96</Select.Option>
                      <Select.Option value="128">128</Select.Option>
                    </Select>

                    <div className="aplus-content-divider"></div>

                    <div
                      className="aplus-content-nav-button"
                      onClick={() => handleStyleEvents("bold", "b")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        style={{ height: "20px", width: "20px" }}
                        viewBox="0 0 25 25"
                        fill="none"
                      >
                        <path
                          d="M19.4087 11.6211C20.1523 10.7128 20.6109 9.60508 20.7271 8.43701C21.0874 4.71143 18.1641 1.5625 14.5225 1.5625H4.78516C4.57796 1.5625 4.37924 1.64481 4.23273 1.79132C4.08622 1.93784 4.00391 2.13655 4.00391 2.34375V4.6875C4.00391 4.8947 4.08622 5.09341 4.23273 5.23993C4.37924 5.38644 4.57796 5.46875 4.78516 5.46875H6.34131V19.5312H4.78516C4.57796 19.5312 4.37924 19.6136 4.23273 19.7601C4.08622 19.9066 4.00391 20.1053 4.00391 20.3125V22.6562C4.00391 22.8635 4.08622 23.0622 4.23273 23.2087C4.37924 23.3552 4.57796 23.4375 4.78516 23.4375H15.0059C18.4629 23.4375 21.5557 20.9106 21.8906 17.4609C22.1221 15.0952 21.0903 12.9658 19.4087 11.6211ZM10.2373 5.46875H14.5225C15.1441 5.46875 15.7402 5.71568 16.1797 6.15522C16.6193 6.59476 16.8662 7.1909 16.8662 7.8125C16.8662 8.4341 16.6193 9.03024 16.1797 9.46978C15.7402 9.90932 15.1441 10.1562 14.5225 10.1562H10.2373V5.46875ZM14.5225 19.5312H10.2373V14.0625H14.5225C15.2477 14.0625 15.9432 14.3506 16.456 14.8634C16.9688 15.3762 17.2568 16.0717 17.2568 16.7969C17.2568 17.5221 16.9688 18.2176 16.456 18.7304C15.9432 19.2432 15.2477 19.5312 14.5225 19.5312Z"
                          fill="black"
                        />
                      </svg>
                    </div>

                    <div
                      className="aplus-content-nav-button"
                      onClick={() => handleStyleEvents("italic", "i")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        style={{ height: "20px", width: "20px" }}
                        viewBox="0 0 25 25"
                        fill="none"
                      >
                        <path
                          d="M20.3125 2.34375V3.90625C20.3125 4.11345 20.2302 4.31216 20.0837 4.45868C19.9372 4.60519 19.7385 4.6875 19.5312 4.6875H16.4668L12.5605 20.3125H14.8438C15.051 20.3125 15.2497 20.3948 15.3962 20.5413C15.5427 20.6878 15.625 20.8865 15.625 21.0938V22.6562C15.625 22.8635 15.5427 23.0622 15.3962 23.2087C15.2497 23.3552 15.051 23.4375 14.8438 23.4375H5.46875C5.26155 23.4375 5.06284 23.3552 4.91632 23.2087C4.76981 23.0622 4.6875 22.8635 4.6875 22.6562V21.0938C4.6875 20.8865 4.76981 20.6878 4.91632 20.5413C5.06284 20.3948 5.26155 20.3125 5.46875 20.3125H8.5332L12.4395 4.6875H10.1562C9.94905 4.6875 9.75034 4.60519 9.60382 4.45868C9.45731 4.31216 9.375 4.11345 9.375 3.90625V2.34375C9.375 2.13655 9.45731 1.93784 9.60382 1.79132C9.75034 1.64481 9.94905 1.5625 10.1562 1.5625H19.5312C19.7385 1.5625 19.9372 1.64481 20.0837 1.79132C20.2302 1.93784 20.3125 2.13655 20.3125 2.34375Z"
                          fill="black"
                        />
                      </svg>
                    </div>

                    <div
                      className="aplus-content-nav-button"
                      onClick={() => handleStyleEvents("underline", "u")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="26"
                        height="26"
                        viewBox="0 0 26 26"
                        fill="none"
                        style={{ height: "20px", width: "20px" }}
                      >
                        <g clip-path="url(#clip0_46_28)">
                          <path
                            d="M3.78864 3.55923H5.35114V11.3717C5.35114 15.6793 8.85602 19.1842 13.1636 19.1842C17.4713 19.1842 20.9761 15.6793 20.9761 11.3717V3.55923H22.5386C22.7458 3.55923 22.9446 3.47692 23.0911 3.3304C23.2376 3.18389 23.3199 2.98518 23.3199 2.77798V1.21548C23.3199 1.00827 23.2376 0.809561 23.0911 0.663048C22.9446 0.516535 22.7458 0.434225 22.5386 0.434225H15.5074C15.3002 0.434225 15.1015 0.516535 14.955 0.663048C14.8084 0.809561 14.7261 1.00827 14.7261 1.21548V2.77798C14.7261 2.98518 14.8084 3.18389 14.955 3.3304C15.1015 3.47692 15.3002 3.55923 15.5074 3.55923H17.0699V11.3717C17.0699 12.4077 16.6583 13.4013 15.9258 14.1339C15.1932 14.8664 14.1996 15.278 13.1636 15.278C12.1276 15.278 11.1341 14.8664 10.4015 14.1339C9.66894 13.4013 9.25739 12.4077 9.25739 11.3717V3.55923H10.8199C11.0271 3.55923 11.2258 3.47692 11.3723 3.3304C11.5188 3.18389 11.6011 2.98518 11.6011 2.77798V1.21548C11.6011 1.00827 11.5188 0.809561 11.3723 0.663048C11.2258 0.516535 11.0271 0.434225 10.8199 0.434225H3.78864C3.58143 0.434225 3.38272 0.516535 3.23621 0.663048C3.0897 0.809561 3.00739 1.00827 3.00739 1.21548V2.77798C3.00739 2.98518 3.0897 3.18389 3.23621 3.3304C3.38272 3.47692 3.58143 3.55923 3.78864 3.55923ZM23.3199 22.3092H3.00739C2.80018 22.3092 2.60147 22.3915 2.45496 22.538C2.30845 22.6846 2.22614 22.8833 2.22614 23.0905V24.653C2.22614 24.8602 2.30845 25.0589 2.45496 25.2054C2.60147 25.3519 2.80018 25.4342 3.00739 25.4342H23.3199C23.5271 25.4342 23.7258 25.3519 23.8723 25.2054C24.0188 25.0589 24.1011 24.8602 24.1011 24.653V23.0905C24.1011 22.8833 24.0188 22.6846 23.8723 22.538C23.7258 22.3915 23.5271 22.3092 23.3199 22.3092Z"
                            fill="black"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_46_28">
                            <rect
                              width="25"
                              height="25"
                              fill="white"
                              transform="translate(0.663635 0.434225)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>

                    <div className="aplus-content-divider"></div>

                    <Dropdown
                      placement="bottomLeft"
                      trigger={["click"]}
                      menu={{ items: alignmentMenu }}
                    >
                      <a
                        onClick={handleDropdownClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {canvasRef?.current?.getActiveObject().textAlign ==
                        "left" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 25 25"
                            fill="none"
                          >
                            <path
                              d="M17.5992 10.822H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 6.82202H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 14.822H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M17.5992 18.822H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        ) : canvasRef?.current?.getActiveObject().textAlign ==
                          "center" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 25 25"
                            fill="none"
                          >
                            <path
                              d="M18.5992 10.8221H6.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 6.82205H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 14.8221H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M18.5992 18.8221H6.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        ) : canvasRef?.current?.getActiveObject().textAlign ==
                          "right" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 25 25"
                            fill="none"
                          >
                            <path
                              d="M21.5992 10.822H7.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 6.82202H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 14.822H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 18.822H7.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            viewBox="0 0 25 25"
                            fill="none"
                          >
                            <path
                              d="M21.5992 10.8221H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 6.82205H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 14.8221H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M21.5992 18.8221H3.59924"
                              stroke="black"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        )}
                      </a>
                    </Dropdown>

                    <Dropdown
                      trigger={["click"]}
                      placement="bottomLeft"
                      menu={{ items: FontLineHeight }}
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 26 26"
                          style={{ height: "22px", width: "22px" }}
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="url(#clip0_2_3)">
                            <path
                              d="M17.3465 18.7443H15.0975V6.83602H17.3465C18.3905 6.83602 18.9134 5.57376 18.1751 4.83548L13.973 0.63338C13.5154 0.175714 12.7734 0.175714 12.3158 0.63338L8.11366 4.83548C7.37542 5.57371 7.89827 6.83602 8.94232 6.83602H11.1912V18.7443H8.94227C7.89823 18.7443 7.37537 20.0066 8.11361 20.7449L12.3157 24.947C12.7734 25.4046 13.5153 25.4046 13.973 24.947L18.1751 20.7449C18.9134 20.0066 18.3905 18.7443 17.3465 18.7443Z"
                              fill="black"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_2_3">
                              <rect
                                width="25"
                                height="25"
                                fill="white"
                                transform="translate(0.644371 0.290161)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                      </a>
                    </Dropdown>

                    <Dropdown
                      trigger={["click"]}
                      placement="bottomLeft"
                      menu={{ items: FontLetterSpacing }}
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 26 26"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="url(#clip0_2_3)">
                            <path
                              d="M19.0985 8.58806V10.837H7.19022V8.58806C7.19022 7.54402 5.92796 7.02117 5.18968 7.7594L0.987582 11.9615C0.529916 12.4192 0.529916 13.1611 0.987582 13.6188L5.18968 17.8209C5.92791 18.5591 7.19022 18.0363 7.19022 16.9922V14.7433L19.0985 14.7433V16.9923C19.0985 18.0363 20.3608 18.5592 21.0991 17.8209L25.3012 13.6188C25.7588 13.1612 25.7588 12.4192 25.3012 11.9616L21.0991 7.75945C20.3608 7.02117 19.0985 7.54402 19.0985 8.58806Z"
                              fill="black"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_2_3">
                              <rect
                                width="25"
                                height="25"
                                fill="white"
                                transform="matrix(0 -1 1 0 0.644371 25.2902)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                      </a>
                    </Dropdown>

                    <div className="aplus-content-divider"></div>
                    <Dropdown
                      trigger={["click"]}
                      placement="bottomLeft"
                      menu={{ items: transparentItem }}
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                        >
                          <g fill="currentColor" fill-rule="evenodd">
                            <path d="M3 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"></path>
                            <path
                              d="M11 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".45"
                            ></path>
                            <path
                              d="M19 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".15"
                            ></path>
                            <path
                              d="M7 6h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".7"
                            ></path>
                            <path
                              d="M15 6h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"
                              opacity=".3"
                            ></path>
                          </g>
                        </svg>
                      </a>
                    </Dropdown>
                  </div>
                )}

              {selectedElement &&
                selectedElementType !== "group" &&
                canvasRef?.current?.getActiveObject() &&
                (selectedElementType == "rect" || "triangle" || "path") &&
                (selectedElementType !== "i-text" || "image" || "group") && (
                  <div className="aplus-content-nav-item">
                    {selectedElementType !== "image" && (
                      // <Dropdown
                      //   trigger={['click']}
                      // menu={{ items: BackgroundColor }}
                      //   placement="bottomLeft"
                      // >
                      //   <a onClick={(e) => e.preventDefault()} className="aplus-content-nav-button">
                      //     <img src={MultiColor} alt="bg" />
                      //   </a>
                      // </Dropdown>

                      <div className="aplus-content-dropdown dropdown-bg">
                        <div
                          className="aplus-content-nav-button aplus-content-dropdown-btn"
                          onClick={() => DropdownClick("bg-color")}
                        >
                          <img src={MultiColor} alt="bg" />
                        </div>
                        {isBgStyle && (
                          <div className="aplus-content-dropdown-content">
                            <div className="aplus-content-assets-bg-grid remove-margin-popup">
                              {/* black family */}
                              <div
                                onClick={() =>
                                  handleStyleEvents("none", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                              >
                                <svg
                                  style={{ height: "42px", width: "100%" }}
                                  width="100"
                                  height="100"
                                  viewBox="0 0 100 100"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="0.5"
                                    y="0.5"
                                    width="99"
                                    height="99"
                                    rx="3.5"
                                    fill="white"
                                    stroke="black"
                                  />
                                  <rect
                                    x="0.667419"
                                    y="97.0433"
                                    width="136.579"
                                    height="3"
                                    rx="1"
                                    transform="rotate(-45 0.667419 97.0433)"
                                    fill="#FF0000"
                                  />
                                </svg>
                              </div>
                              <div
                                // onClick={() => handleStyleEvents('black', 'fill-svg')}
                                className="aplus-content-assets-bg-box"
                                // style={{ backgroundColor: 'black' }}
                              >
                                <input
                                  type="color"
                                  onChange={(e) =>
                                    handleStyleEvents(
                                      e.target.value,
                                      "fill-svg"
                                    )
                                  }
                                  className="color-picker"
                                />
                              </div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("black", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "black" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#545454", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#545454" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#737373", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#737373" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#a6a6a6", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#a6a6a6" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#d9d9d9", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#d9d9d9" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("white", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "white" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#FF3131", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FF3131" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#FF5757", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FF5757" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#FF66C4", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FF66C4" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#cb6ce6", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#cb6ce6" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#8c52ff", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#8c52ff" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#5e17eb", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#5e17eb" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#0097B2", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#0097B2" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#0CC0DF", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#0CC0DF" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#5CE1E6", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#5CE1E6" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#38B6FF", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#38B6FF" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#5271FF", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#5271FF" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#004AAD", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#004AAD" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#00BF63", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#00BF63" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#7ED957", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#7ED957" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#C1FF72", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#C1FF72" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#FFDE59", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FFDE59" }}
                              ></div>
                              <div
                                onClick={() =>
                                  handleStyleEvents("#FFBD59", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FFBD59" }}
                              ></div>

                              <div
                                onClick={() =>
                                  handleStyleEvents("#FF914D", "fill-svg")
                                }
                                className="aplus-content-assets-bg-box"
                                style={{ backgroundColor: "#FF914D" }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedElementType !== "image" && (
                      <Dropdown
                        trigger={["click"]}
                        menu={{ items: BackgroundGradient }}
                        placement="bottomLeft"
                      >
                        <a
                          onClick={(e) => e.preventDefault()}
                          className="aplus-content-nav-button"
                        >
                          <div
                            style={{
                              background:
                                "linear-gradient(90deg, violet, lightblue)",
                              height: "30px",
                              width: "30px",
                            }}
                          ></div>
                        </a>
                      </Dropdown>
                    )}
                    {/* 
                    <Dropdown
                      trigger={['click']}
                      menu={{ items: BackgroundStrokeColor }}
                      placement="bottomLeft"
                    >
                      <a onClick={handleDropdownClick} className="aplus-content-nav-button">
                        <img src={StrokeColor} alt="stroke color" />
                      </a>
                    </Dropdown> */}

                    <div className="aplus-content-dropdown dropdown-stroke-clr">
                      <div
                        className="aplus-content-nav-button aplus-content-dropdown-btn"
                        onClick={() => DropdownClick("stroke-color")}
                      >
                        <img src={StrokeColor} alt="stroke color" />
                      </div>
                      {isStrokeStyle && (
                        <div className="aplus-content-dropdown-content">
                          <div className="aplus-content-svg-clrs-grid remove-margin-popup">
                            {/* black family */}
                            <div
                              onClick={() =>
                                handleStyleEvents("none", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                            >
                              <svg
                                style={{ height: "42px", width: "100%" }}
                                width="100"
                                height="100"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect
                                  x="0.5"
                                  y="0.5"
                                  width="99"
                                  height="99"
                                  rx="3.5"
                                  fill="white"
                                  stroke="black"
                                />
                                <rect
                                  x="0.667419"
                                  y="97.0433"
                                  width="136.579"
                                  height="3"
                                  rx="1"
                                  transform="rotate(-45 0.667419 97.0433)"
                                  fill="#FF0000"
                                />
                              </svg>
                            </div>
                            <div
                              // onClick={() => handleStyleEvents('black', 'fill-svg')}
                              className="aplus-content-assets-bg-box"
                              // style={{ backgroundColor: 'black' }}
                            >
                              <input
                                type="color"
                                onChange={(e) =>
                                  handleStyleEvents(
                                    e.target.value,
                                    "stroke-fill-svg"
                                  )
                                }
                                className="color-picker"
                              />
                            </div>
                            <div
                              onClick={() =>
                                handleStyleEvents("black", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "black" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("gray", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "gray" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents(
                                  "lightgray",
                                  "stroke-fill-svg"
                                )
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "lightgray" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("white", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "white" }}
                            ></div>
                            {/* Red family */}
                            <div
                              onClick={() =>
                                handleStyleEvents("red", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "Red" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("orange", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "orange" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("pink", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "pink" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("magenta", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "magenta" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("violet", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "violet" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("purple", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "purple" }}
                            ></div>
                            {/* green family */}
                            <div
                              onClick={() =>
                                handleStyleEvents(
                                  "turquoise",
                                  "stroke-fill-svg"
                                )
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "turquoise" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("aqua", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "aqua" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("blue", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "blue" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents(
                                  "lightblue",
                                  "stroke-fill-svg"
                                )
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "lightblue" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("green", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "green" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents(
                                  "lightgreen",
                                  "stroke-fill-svg"
                                )
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "lightgreen" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("lime", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "lime" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("yellow", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "yellow" }}
                            ></div>
                            <div
                              onClick={() =>
                                handleStyleEvents("coral", "stroke-fill-svg")
                              }
                              className="aplus-content-assets-bg-box"
                              style={{ backgroundColor: "coral" }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="aplus-content-divider"></div>

                    <Dropdown
                      trigger={["click"]}
                      menu={{ items: BorderWidth }}
                      placement="bottomLeft"
                    >
                      <a
                        onClick={handleDropdownClick}
                        className="aplus-content-nav-button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                        >
                          <rect
                            width="18"
                            height="1.5"
                            x="3"
                            y="4"
                            fill="currentColor"
                            rx=".75"
                          ></rect>
                          <rect
                            width="18"
                            height="3"
                            x="3"
                            y="8.5"
                            fill="currentColor"
                            rx="1"
                          ></rect>
                          <rect
                            width="18"
                            height="5.5"
                            x="3"
                            y="14.5"
                            fill="currentColor"
                            rx="1"
                          ></rect>
                        </svg>
                      </a>
                    </Dropdown>
                    <Dropdown
                      trigger={["click"]}
                      menu={{ items: BorderStyle }}
                      placement="bottomLeft"
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="aplus-content-nav-button"
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 26 26"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14.2137 20.8366H12.6512C12.444 20.8366 12.2453 20.9189 12.0988 21.0654C11.9523 21.2119 11.87 21.4106 11.87 21.6178V23.1803C11.87 23.3875 11.9523 23.5862 12.0988 23.7328C12.2453 23.8793 12.444 23.9616 12.6512 23.9616H14.2137C14.4209 23.9616 14.6196 23.8793 14.7661 23.7328C14.9127 23.5862 14.995 23.3875 14.995 23.1803V21.6178C14.995 21.4106 14.9127 21.2119 14.7661 21.0654C14.6196 20.9189 14.4209 20.8366 14.2137 20.8366ZM9.52621 20.8366H7.96371C7.75651 20.8366 7.5578 20.9189 7.41129 21.0654C7.26477 21.2119 7.18246 21.4106 7.18246 21.6178V23.1803C7.18246 23.3875 7.26477 23.5862 7.41129 23.7328C7.5578 23.8793 7.75651 23.9616 7.96371 23.9616H9.52621C9.73341 23.9616 9.93213 23.8793 10.0786 23.7328C10.2252 23.5862 10.3075 23.3875 10.3075 23.1803V21.6178C10.3075 21.4106 10.2252 21.2119 10.0786 21.0654C9.93213 20.9189 9.73341 20.8366 9.52621 20.8366ZM18.9012 20.8366H17.3387C17.1315 20.8366 16.9328 20.9189 16.7863 21.0654C16.6398 21.2119 16.5575 21.4106 16.5575 21.6178V23.1803C16.5575 23.3875 16.6398 23.5862 16.7863 23.7328C16.9328 23.8793 17.1315 23.9616 17.3387 23.9616H18.9012C19.1084 23.9616 19.3071 23.8793 19.4536 23.7328C19.6002 23.5862 19.6825 23.3875 19.6825 23.1803V21.6178C19.6825 21.4106 19.6002 21.2119 19.4536 21.0654C19.3071 20.9189 19.1084 20.8366 18.9012 20.8366ZM23.5887 11.4616H22.0262C21.819 11.4616 21.6203 11.5439 21.4738 11.6904C21.3273 11.8369 21.245 12.0356 21.245 12.2428V13.8053C21.245 14.0125 21.3273 14.2112 21.4738 14.3578C21.6203 14.5043 21.819 14.5866 22.0262 14.5866H23.5887C23.7959 14.5866 23.9946 14.5043 24.1411 14.3578C24.2877 14.2112 24.37 14.0125 24.37 13.8053V12.2428C24.37 12.0356 24.2877 11.8369 24.1411 11.6904C23.9946 11.5439 23.7959 11.4616 23.5887 11.4616ZM23.5887 16.1491H22.0262C21.819 16.1491 21.6203 16.2314 21.4738 16.3779C21.3273 16.5244 21.245 16.7231 21.245 16.9303V18.4928C21.245 18.7 21.3273 18.8987 21.4738 19.0453C21.6203 19.1918 21.819 19.2741 22.0262 19.2741H23.5887C23.7959 19.2741 23.9946 19.1918 24.1411 19.0453C24.2877 18.8987 24.37 18.7 24.37 18.4928V16.9303C24.37 16.7231 24.2877 16.5244 24.1411 16.3779C23.9946 16.2314 23.7959 16.1491 23.5887 16.1491ZM23.5887 20.8366H22.0262C21.819 20.8366 21.6203 20.9189 21.4738 21.0654C21.3273 21.2119 21.245 21.4106 21.245 21.6178V23.1803C21.245 23.3875 21.3273 23.5862 21.4738 23.7328C21.6203 23.8793 21.819 23.9616 22.0262 23.9616H23.5887C23.7959 23.9616 23.9946 23.8793 24.1411 23.7328C24.2877 23.5862 24.37 23.3875 24.37 23.1803V21.6178C24.37 21.4106 24.2877 21.2119 24.1411 21.0654C23.9946 20.9189 23.7959 20.8366 23.5887 20.8366ZM23.5887 6.77408H22.0262C21.819 6.77408 21.6203 6.85639 21.4738 7.00291C21.3273 7.14942 21.245 7.34813 21.245 7.55533V9.11783C21.245 9.32503 21.3273 9.52375 21.4738 9.67026C21.6203 9.81677 21.819 9.89908 22.0262 9.89908H23.5887C23.7959 9.89908 23.9946 9.81677 24.1411 9.67026C24.2877 9.52375 24.37 9.32503 24.37 9.11783V7.55533C24.37 7.34813 24.2877 7.14942 24.1411 7.00291C23.9946 6.85639 23.7959 6.77408 23.5887 6.77408ZM23.5887 2.08658H4.05746C3.64306 2.08658 3.24564 2.2512 2.95261 2.54423C2.65958 2.83725 2.49496 3.23468 2.49496 3.64908L2.49496 23.1803C2.49496 23.3875 2.57727 23.5862 2.72379 23.7328C2.8703 23.8793 3.06901 23.9616 3.27621 23.9616H4.83871C5.04591 23.9616 5.24463 23.8793 5.39114 23.7328C5.53765 23.5862 5.61996 23.3875 5.61996 23.1803V5.21158H23.5887C23.7959 5.21158 23.9946 5.12927 24.1411 4.98276C24.2877 4.83625 24.37 4.63753 24.37 4.43033V2.86783C24.37 2.66063 24.2877 2.46192 24.1411 2.3154C23.9946 2.16889 23.7959 2.08658 23.5887 2.08658Z"
                            fill="black"
                          />
                        </svg>
                      </a>
                    </Dropdown>

                    {selectedElementType !== "i-text" &&
                      selectedElementType !== "image" && (
                        <Dropdown
                          trigger={["click"]}
                          menu={{ items: BorderRadius }}
                          placement="bottomLeft"
                        >
                          <a
                            onClick={(e) => e.preventDefault()}
                            className="aplus-content-nav-button"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect
                                x="2"
                                y="2"
                                width="20"
                                height="20"
                                rx="8"
                                stroke="black"
                                stroke-width="4"
                              />
                            </svg>
                          </a>
                        </Dropdown>
                      )}
                  </div>
                )}

              {selectedElementType == "group" && (
                <div className="aplus-content-nav-item">
                  <div className="aplus-content-dropdown dropdown-bg">
                    <div
                      className="aplus-content-nav-button aplus-content-dropdown-btn"
                      onClick={() => DropdownClick("bg-color")}
                    >
                      <img src={MultiColor} alt="bg" />
                    </div>
                    {isBgStyle && (
                      <div className="aplus-content-dropdown-content">
                        <div className="aplus-content-assets-bg-grid remove-margin-popup">
                          {/* black family */}
                          <div
                            onClick={() =>
                              handleStyleEvents("none", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                          >
                            <svg
                              style={{ height: "42px", width: "100%" }}
                              width="100"
                              height="100"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect
                                x="0.5"
                                y="0.5"
                                width="99"
                                height="99"
                                rx="3.5"
                                fill="white"
                                stroke="black"
                              />
                              <rect
                                x="0.667419"
                                y="97.0433"
                                width="136.579"
                                height="3"
                                rx="1"
                                transform="rotate(-45 0.667419 97.0433)"
                                fill="#FF0000"
                              />
                            </svg>
                          </div>
                          <div
                            // onClick={() => handleStyleEvents('black', 'fill-svg')}
                            className="aplus-content-assets-bg-box"
                            // style={{ backgroundColor: 'black' }}
                          >
                            <input
                              type="color"
                              onChange={(e) =>
                                handleStyleEvents(e.target.value, "stroke-svg")
                              }
                              className="color-picker"
                            />
                          </div>
                          <div
                            onClick={() =>
                              handleStyleEvents("black", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "black" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#545454", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#545454" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#737373", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#737373" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#a6a6a6", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#a6a6a6" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#d9d9d9", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#d9d9d9" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("white", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "white" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#FF3131", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FF3131" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#FF5757", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FF5757" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#FF66C4", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FF66C4" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#cb6ce6", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#cb6ce6" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#8c52ff", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#8c52ff" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#5e17eb", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#5e17eb" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#0097B2", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#0097B2" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#0CC0DF", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#0CC0DF" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#5CE1E6", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#5CE1E6" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#38B6FF", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#38B6FF" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#5271FF", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#5271FF" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#004AAD", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#004AAD" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#00BF63", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#00BF63" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#7ED957", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#7ED957" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#C1FF72", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#C1FF72" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#FFDE59", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FFDE59" }}
                          ></div>
                          <div
                            onClick={() =>
                              handleStyleEvents("#FFBD59", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FFBD59" }}
                          ></div>

                          <div
                            onClick={() =>
                              handleStyleEvents("#FF914D", "stroke-svg")
                            }
                            className="aplus-content-assets-bg-box"
                            style={{ backgroundColor: "#FF914D" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* {selectedElement && <Button onClick={() => handleNavEvents('edit')}>Edit</Button>} */}
            </div>
            <div>
              <Button type="primary" onClick={handleSave}>
                Save
              </Button>
            </div>
          </nav>
          <div className="aplus-content-canva-holder">
            <div className="aplus-content-canva-wrapper">
              <canvas id="aplus-content" width={width} height={height}>
                Canvas not supported
              </canvas>
            </div>
          </div>
          <Footer
            canvaData={canvaDetails}
            handleSelectedCanva={handleSelectedCanva}
            addCanva={handleAddCanva}
            canvaRef={canvasRef}
          />
        </div>
      </div>

      {/* Final Output popup */}
      <Modal
        open={outputImage}
        onOk={() => setOutputImage(null)}
        onCancel={() => setOutputImage(null)}
        width={1080}
      >
        <div className="aplus-content-output-container">
          <img
            src={outputImage}
            alt="image-output"
            className="aplus-conent-ouput"
          />
          {/* <Input
            type="text"
            className="aplus-content-output-input"
            value={outputImage}
          /> */}
        </div>
      </Modal>

      {/* Toolbar */}
      <Toolbar
        onDelete={handleToolbarDelete}
        onDuplicate={handleToolbarDuplicate}
        onEdit={() => handleNavEvents("edit")}
      />

      <Modal
        title="Search For Anything"
        open={isPopupSearch}
        // open={true}
        onCancel={() => setIsPopupSearch(false)}
        footer={""}
      >
        <div className="quick-search">
          <Input
            type="text"
            onChange={(e) => setPopupSearch(e.target.value)}
            value={popupSearch}
          />

          <div className="quick-search-results"></div>
        </div>
        {/* <div className="popup-search-holder">
          <div className="pp-s-title">Search For Items</div>
          <div className="pp-s-subtitle">Start by typing Rect, Circle, Icon Left Align etc,</div>
          <Input
            // type="text"
            ref={popupSearchRef}
            autoFocus={true}
            onChange={(e) => setPopupSearch(e.target.value)}
            value={popupSearch}
            onPressEnter={handlePopupSearchSubmit}
          />

          
        </div> */}
      </Modal>

      <Modal
        title="Search For Images"
        open={isUnsplashModal}
        onCancel={() => setIsUnsplashModal(false)}
        footer={""}
        width={"768px"}
      >
        <div className="unsplash-search-body">
          <Input
            ref={unsplashRef}
            autoFocus={true}
            onChange={(e) => setUnsplashSearch(e.target.value)}
            value={unsplashSearch}
            onPressEnter={handleUnsplashSearchSubmit}
          />

          <div className="unsplash-image-grid">
            {unsplashResults?.map((img: any) => (
              <img
                src={img?.urls?.small}
                alt={img?.alt_description}
                onClick={() =>
                  handleUnsplashCreate(img?.urls?.regular, img?.alt_description)
                }
              />
            ))}
          </div>
        </div>
      </Modal>
    </Fragment>
  );
};

export default CanvaEditor;
