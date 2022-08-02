import Controller, {EventType, MouseButtonType} from './controller';

const clamp01 = (num: number) => clamp(num, 0, 1);
  
const clamp = (num: number, min: number, max: number) =>
     Math.max(min, Math.min(num, max));

export class Sender {
    dataChannel : RTCDataChannel | null = null;
    videoElem: HTMLVideoElement | null = null;
    constructor(dataChannel : RTCDataChannel, videoElement : HTMLVideoElement) {
        this.dataChannel = dataChannel;
        this.videoElem = videoElement;
    }

    handlekeydown = (event: KeyboardEvent) => {
        console.log(event.key);
        const data = {
          type: EventType.KeyPress,
          key: event.key,
          X: -1,
          Y: -1,
          MKey: MouseButtonType.None
        };
        (() => {
            this.sendMessage(JSON.stringify(data));
        })();
    }
    
    handleMouseMove = (event: MouseEvent) => {
        const {x, y} = this.minimize(event);
        const data = {
          type: EventType.MouseMove,
          X: x,
          Y: y,
          MKey: MouseButtonType.None
        }
        console.log(data);
        this.sendMessage(JSON.stringify(data));
      }

      handleMouseClick = (event: MouseEvent) => {
        const {x, y} = this.minimize(event);
        const data = {
          eventType: EventType.MouseClick,
          x: x,
          y: y,
          MKey: event.type == "click" ? MouseButtonType.Left : MouseButtonType.Right,
        }
        console.log(data);
        this.sendMessage(JSON.stringify(data));
      }

      sendMessage = (msg: string) => {
        console.log("sending message");
        this.dataChannel?.send(msg);
      }

      minimize = (event: MouseEvent) => {
        if (this.videoElem === null) return {x : 0.0, y : 0.0};
        const x = clamp01(event.offsetX / this.videoElem.clientWidth);
        const y = clamp01(event.offsetY / this.videoElem.clientHeight);
        return {x, y};
      }
}

export class Receiver {
    controller: Controller | null = null;
    constructor() {
        this.controller = new Controller();
    }

    handleMessageReceived = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (this.controller != null) {
            this.controller.send(data);
        }
    }
}