package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Message struct {
	EventType EventType       `json:"eventType"`
	Key       string          `json:"key"`
	X         int             `json:"x"`
	Y         int             `json:"y"`
	MKey      MouseButtonType `json:"mKey"`
}

var (
	wsUpgrade = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	wsConn *websocket.Conn
)

func WsHandler(w http.ResponseWriter, r *http.Request) {
	wsUpgrade.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	wsConn, err := wsUpgrade.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("could not upgrade to websocket: %s\n", err.Error())
	}

	defer wsConn.Close()

	for {
		var msg Message
		err := wsConn.ReadJSON(&msg)
		if err != nil {
			log.Fatalf("could not read message: %s\n", err.Error())
			break
		}
		log.Println(msg)
		eventResolver(&msg)
	}
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/", WsHandler)
	log.Fatal(http.ListenAndServe(":8080", router))
}
