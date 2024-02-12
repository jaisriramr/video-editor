import { Fragment, useEffect, useState } from "react";
import "./Canvas.css";
import { fabric } from "fabric";
import { AlignGuidelines } from "fabric-guideline-plugin";

const Canvas = ({
  height,
  width,
  canvasRef,
}: {
  height?: any;
  width?: any;
  canvasRef?: any;
}) => {
  const [rendered, setRendered] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedElementType, setSelectedElementType] = useState<any>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas-render", {
      backgroundColor: "#FFFFFF",
    });

    const guideline = new AlignGuidelines({
      canvas: canvas,
      aligningOptions: {
        lineColor: "red",
        lineWidth: 1,
        lineMargin: 1,
      },
    });

    guideline.init();

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
      });
      canvas.on("object:modified", () => {
        updateHistory();
      });
      canvas.on("object:removed", () => {
        updateHistory();
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

    canvas.on("dragover", function (e: any) {
      e.preventDefault();
    });

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
      const sidebarBox = document.querySelectorAll(
        ".aplus-content-sidebar-box"
      );

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

    return () => {
      canvas.dispose();
    };
  }, []);

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

  return (
    <Fragment>
      <div className="canvas-container">
        <canvas id="canvas-render" height={height} width={width}></canvas>
      </div>
    </Fragment>
  );
};

export default Canvas;
