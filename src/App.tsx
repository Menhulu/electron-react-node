import "./App.css";
import React, { useState, useEffect } from "react";
import { Row, Col, Radio, Button, Input } from "antd";
import InputFrom from "./client/InputFrom";
import JMuxer from "jmuxer";
import "./App.css";
const { TextArea } = Input;

function App() {
  // const [videoHtml, setVideoHtml] = useState<string>();
  const [ipCams, setIpCams] = useState<any>([]);
  const [drawState, setDrawState] = useState<any>();
  const [playersObj, setPlayersObj] = useState<any>({});
  const [areaDots, setAreaDots] = useState<any>([]);

  // {
  //   name: '',
  //   resolution: {
  //     width: 0,
  //     height: 0
  //   }
  // }

  const onSubmit = (response: any) => {
    setIpCams(response.data.data.camList);
  };

  const startFrame = (data: any) => {
    // const ipcams = data.data.data.camAddressList;
    for (let i = 0; i < data.length; i++) {
      setTimeout(() => {
        const name = data[i].name;
        const width = data[i].width;
        const height = data[i].height;
        playersObj[name] = new Object();
        playersObj[name].setDraw = new setDraw(name, width, height);
        // playersObj[name].setDraw.drawGrid('lightgray', 10, 10);
        playersObj[name].socketURL =
          // "ws://" + window.location.hostname + ":21808" + "/" + ipcamsName[i];
          "ws://" + "localhost:21808" + "/" + name;
        playersObj[name].player = new JMuxer({
          node: "player" + name,
          mode: "video",
          flushingTime: 280, // 2000
          fps: 30,
          clearBuffer: true,
          debug: true,
        });

        // playersObj[name].player.node.addEventListener(
        //   "timeupdate",
        //   function (e: any) {
        //     // console.log('playersObj7', playersObj[name].player.node.src);
        //     try {
        //       if (
        //         playersObj[name] &&
        //         playersObj[name].player &&
        //         playersObj[name].player.node.src
        //       ) {
        //         playersObj[name].player.node.buffered &&
        //           (playersObj[name].player.node.playbackRate =
        //             playersObj[name].player.node.buffered.end(0) -
        //               playersObj[name].player.node.currentTime >
        //             0.3
        //               ? 1.3
        //               : 1);
        //       }
        //     } catch (error) {
        //       console.log("playersObj12", error);
        //     }
        //   }
        // );

        playersObj[name].ws = new WebSocket(playersObj[name].socketURL);
        playersObj[name].ws.binaryType = "arraybuffer";
        // getBuffer(playersObj[name]);

        playersObj[name].ws.addEventListener("message", function (event: any) {
          if (event.data instanceof ArrayBuffer) {
            playersObj[name].player.feed({
              video: new Uint8Array(event.data),
            });
          }
        });

        playersObj[name].ws.addEventListener("error", function (e: any) {
          console.log("Socket Error", e);
        });

        setPlayersObj({ ...playersObj });
      }, i * 200);
    }
  };

  interface lineDots {
    top: { x: number; y: number };
    bottom: { x: number; y: number };
  }
  class setDraw {
    constructor(name: string, width: number, height: number) {
      this.name = name;
      this.drawer = document.getElementById("drawer" + name) as HTMLDivElement;
      this.canvas = document.getElementById(
        "canvas" + name
      ) as HTMLCanvasElement;
      this.rate = this.drawer.offsetWidth / width;
      this.canvas.width = width * this.rate;
      this.canvas.height = height * this.rate;
      this.context = this.canvas && this.canvas.getContext("2d");
      this.drawingSurfaceImageData = this.drawingSurfaceImageData;
      this.mousedown = {};
      this.rubberBandRect = {};
      this.dragging = false;
      this.loc = {};
      this.guideWires = true;
      this.rectangle = false;
      this.lines = [];

      this.drawGrid = this.drawGrid.bind(this);
      // this.windowToCanvas = this.windowToCanvas.bind(this);

      this.canvas.onmousedown = this.onmousedown;
      this.canvas.onmousemove = this.onmousemove;
      this.canvas.onmouseup = this.onmouseup;
      this.canvas.onmouseout = this.onmouseout;
    }
    name: string;
    drawer: HTMLDivElement;
    canvas: HTMLCanvasElement;
    rate: number;
    context: any;
    drawingSurfaceImageData: any;
    mousedown: any;
    rubberBandRect: any;
    dragging = false;
    loc: any;
    guideWires = true;
    rectangle = false;
    lines: lineDots[];

    // 画网格
    drawGrid(color: string, stepX: number, stepY: number) {
      this.context.save();
      this.context.lineWidth = 0.5;
      this.context.strokeStyle = color;

      for (var i = stepX + 0.5; i < this.canvas.width; i += stepX) {
        this.context.beginPath();
        this.context.moveTo(i, 0 + 0.5);
        this.context.lineTo(i, this.canvas.height + 0.5);
        this.context.stroke();
      }

      for (var i = stepY + 0.5; i < this.canvas.height; i += stepY) {
        this.context.beginPath();
        this.context.moveTo(0 + 0.5, i);
        this.context.lineTo(this.canvas.width, i);
        this.context.stroke();
      }
      this.context.restore();
    }
    // 坐标转化为canvas坐标
    windowToCanvas(x: number, y: number) {
      //返回元素的大小以及位置
      var bbox = this.canvas.getBoundingClientRect();
      return {
        x: x - bbox.left * (this.canvas.width / bbox.width),
        y: y - bbox.top * (this.canvas.height / bbox.height),
      };
    }

    //保存和恢复绘图面板
    saveDrawingSurface() {
      this.drawingSurfaceImageData = this.context.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }
    restoreDrawingSurface() {
      this.context.putImageData(this.drawingSurfaceImageData, 0, 0);
    }

    // 更新橡皮筋矩形
    updateRubberBandRectangle(loc: any) {
      this.context.strokeStyle = "#D7DF01";
      this.context.lineWidth = 2;
      this.rubberBandRect.width = Math.abs(loc.x - this.mousedown.x);
      this.rubberBandRect.height = Math.abs(loc.y - this.mousedown.y);

      //从左往右拉，和从右往左拉的两种情况。主要是判断左边的位置
      //因为从左往右拉的时候，左边x坐标不变
      //从右往左拉的时候，左边线的x坐标需要跟着鼠标移动

      if (loc.x > this.mousedown.x) this.rubberBandRect.left = this.mousedown.x;
      else this.rubberBandRect.left = loc.x;

      if (loc.y > this.mousedown.y) this.rubberBandRect.top = this.mousedown.y;
      else this.rubberBandRect.top = loc.y;

      this.context.save();
      this.context.beginPath();
      this.context.rect(
        this.rubberBandRect.left,
        this.rubberBandRect.top,
        this.rubberBandRect.width,
        this.rubberBandRect.height
      );
      this.context.stroke();
      this.context.restore();
    }

    // 画可以看得见的线
    drawRubberBandShape(loc: any) {
      this.context.strokeStyle = "#D7DF01";
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(this.mousedown.x, this.mousedown.y);
      this.context.lineTo(loc.x, loc.y);
      this.context.stroke();
    }

    // 更新橡皮筋
    updateRubberBand(loc: any) {
      //如果判断需要画矩形，就执行画矩形方法
      if (this.rectangle) {
        this.updateRubberBandRectangle(loc);
      }
      //执行画直线的方法，这里没加if是为了让读者容易理解矩形的绘制方法，因为"draw矩形"是基于"draw直线"的
      this.drawRubberBandShape(loc);
    }

    // 画水平辅助线，占整个canvas宽度
    drawHorizontalLine(y: number) {
      this.context.beginPath();
      this.context.moveTo(0, y + 0.5);
      this.context.lineTo(this.canvas.width, y + 0.5);
      this.context.stroke();
    }

    /**
     * 画垂直辅助线，占整个canvas高度
     * @param x
     */
    drawVerticalLine(x: number) {
      this.context.beginPath();
      this.context.moveTo(x + 0.5, 0);
      this.context.lineTo(x + 0.5, this.context.canvas.height);
      this.context.stroke();
    }

    // 画辅助线，并设置属性
    drawGuideWires(x: number, y: number) {
      this.context.save();
      // this.context.strokeStyle = 'rgba(0,0,230,0.4)';
      this.context.strokeStyle = "#ff0000";
      this.context.lineWidth = 0.5;
      this.drawVerticalLine(x);
      this.drawHorizontalLine(y);
      this.context.restore();
    }

    //事件

    // 鼠标按下的时候，记录坐标，并设置为拖拽状态
    onmousedown = (e: any) => {
      if (this.lines.length >= 4) return;
      this.loc = this.windowToCanvas(e.clientX, e.clientY);
      this.lines[this.lines.length] = {
        top: { x: 0, y: 0 },
        bottom: { x: 0, y: 0 },
      };
      this.lines[this.lines.length - 1]["top"] = {
        x: Math.round(this.loc.x / this.rate),
        y: Math.round(this.loc.y / this.rate),
      };
      e.preventDefault();
      this.saveDrawingSurface();
      this.mousedown.x = this.loc.x;
      this.mousedown.y = this.loc.y;
      this.dragging = true;
    };

    /**
     * （鼠标按下之后）鼠标移动的时候
     * 判断拖拽中：更新当前连线的位置
     * 判断辅助线显示：添加辅助线
     * @param e
     */
    onmousemove = (e: any) => {
      this.loc = {};
      if (this.dragging) {
        e.preventDefault();
        this.loc = this.windowToCanvas(e.clientX, e.clientY);
        this.restoreDrawingSurface();
        this.updateRubberBand(this.loc);
        if (this.guideWires) {
          this.drawGuideWires(this.loc.x, this.loc.y);
        }
      }
    };

    /**
     * (拖拽完成后)当鼠标松开时，重新获取本点坐标，清除之前的"跟随鼠标移动的线"，更新连线，取消拖拽状态
     * @param e
     */
    onmouseup = (e: any) => {
      if (
        this.lines.length >= 4 &&
        this.lines[3].bottom.x !== 0 &&
        this.lines[3].bottom.y !== 0
      )
        return;
      this.loc = this.windowToCanvas(e.clientX, e.clientY);
      this.lines[this.lines.length - 1]["bottom"] = {
        x: Math.round(this.loc.x / this.rate),
        y: Math.round(this.loc.y / this.rate),
      };
      // console.log('onmouseup', this.lines);
      this.restoreDrawingSurface();
      this.updateRubberBand(this.loc);
      this.dragging = false;
    };

    /**
     * mouseout
     * @param ev
     */
    onmouseout = (e: any) => {
      if (
        this.lines.length >= 4 &&
        this.lines[3].bottom.x !== 0 &&
        this.lines[3].bottom.y !== 0
      )
        return;
      if (this.loc.x !== undefined) {
        this.lines[this.lines.length - 1]["bottom"] = {
          x: Math.round(this.loc.x / this.rate),
          y: Math.round(this.loc.y / this.rate),
        };
        this.updateRubberBand(this.loc);
        this.dragging = false;
      }
    };

    eraseAll(ev: any) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid("red", 10, 10);
      this.saveDrawingSurface();
    }
  }

  const eraseAllClick = (e: any) => {
    for (let key in playersObj) {
      let drawObj = playersObj[key].setDraw;
      drawObj.context.clearRect(
        0,
        0,
        drawObj.canvas.width,
        drawObj.canvas.height
      );
      // drawObj.drawGrid('lightgray', 10, 10);
      drawObj.lines = [];
      drawObj.saveDrawingSurface();
    }
    setAreaDots([]);
  };

  const rectangleChange = (e: any) => {
    setDrawState(e.target.value);
    for (let key in playersObj) {
      let drawObj = playersObj[key].setDraw;
      drawObj.rectangle = e.target.value;
    }
  };

  const submitArea = (e: any) => {
    let resData = [];
    for (let key in playersObj) {
      let lines = playersObj[key].setDraw.lines;
      for (let j = 0; j < lines.length; j++) {
        for (let i = 0; i < lines.length; i++) {
          let temp = lines[i];
          if (i > 0 && lines[i].top.x < lines[i - 1].top.x) {
            lines[i] = lines[i - 1];
            lines[i - 1] = temp;
          }
        }
      }
      for (let i = 0; i < Math.floor(lines.length / 2); i++) {
        let item = {
          name: `${i}`,
          leftTop: `${lines[i * 2].top.x}, ${lines[i * 2].top.y}`,
          leftBottom: `${lines[i * 2].bottom.x}, ${lines[i * 2].bottom.y}`,
          rightTop: `${lines[i * 2 + 1].top.x}, ${lines[i * 2 + 1].top.y}`,
          rightBottom: `${lines[i * 2 + 1].bottom.x}, ${
            lines[i * 2 + 1].bottom.y
          }`,
        };
        resData.push(item);
      }
      setAreaDots(resData);
    }
  };

  const drawOptions = [
    { label: "线条", value: false },
    { label: "矩形", value: true },
  ];

  // const getThingTypeData = async () => {
  //   const request = {
  //     commonRequest: {},
  //     thingTypeDTO: {},
  //     thingTypeProfileFilter: {
  //       needProfileFlag: true,
  //     },
  //     pageRequest: {
  //       pageNo: 1,
  //       pageSize: 10000,
  //     },
  //   };

  // };

  useEffect(() => {
    if (ipCams.length <= 0) return;
    // start play video
    startFrame(ipCams);

    // 获取物类型列表
    // getThingTypeData();
  }, [ipCams]);

  return (
    <div className="App">
      <Row className="video-wrapper-row">
        <Col span={16} className="video-wrapper-col">
          {/* <div id="video_live"></div> */}
          {ipCams.map((cam: any, i: number) => {
            return (
              <div
                id={"drawer" + cam.name}
                key={"drawer" + cam.name}
                className={"drawer_frame"}
              >
                <canvas
                  id={"canvas" + cam.name}
                  key={"canvas" + cam.name}
                  // width={cam.width}
                  // height={cam.height}
                ></canvas>
                <video
                  autoPlay
                  muted
                  // poster={require('static/img/loader_thumb.png')}
                  // onMouseOver={onMouseOver}
                  id={"player" + cam.name}
                  key={"player" + cam.name}
                ></video>
              </div>
            );
          })}
        </Col>
        <Col span={8}>
          <InputFrom onSubmit={onSubmit} />

          <div className="draw">
            <Radio.Group
              options={drawOptions}
              onChange={rectangleChange}
              value={drawState}
              defaultValue={false}
              optionType="button"
              buttonStyle="solid"
            />
            <span className="draw-operation">
              <Button type="primary" onClick={eraseAllClick}>
                清除
              </Button>

              <Button type="primary" onClick={submitArea}>
                确定
              </Button>
            </span>
            <TextArea
              value={JSON.stringify(areaDots, null, 4)}
              style={{ height: "300px" }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default App;
