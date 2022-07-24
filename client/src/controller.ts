export enum EventType {
    KeyPress = 1,
    MouseMove,
    MouseClick,
    MouseScroll,
}

export enum MouseButtonType {
    Left = 1,
    Right,
    Middle,
    None,
}

type EventData ={
    EventType: EventType,
    Key: string,
    X: number,
    Y: number,
    MKey: MouseButtonType,
}

class Controller {
    #ws: WebSocket;
    constructor() {
        this.#ws = new WebSocket("ws://localhost:8080/");
    }

    send(data: EventData) {
        this.#ws.send(JSON.stringify(data));
    }
}

export default Controller;

