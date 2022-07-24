package main

import (
	"log"

	"github.com/go-vgo/robotgo"
)

type EventType uint8

type MouseButtonType uint8

const (
	Left MouseButtonType = iota
	Right
	Middle
)

const (
	KeyPress EventType = iota
	MouseMove
	MouseClick
	MouseScroll
)

func eventResolver(msg *Message) {
	if msg.EventType == KeyPress {
		handleKeyPress(msg)
	} else if msg.EventType == MouseClick {
		handleMouseClick(msg)
	} else if msg.EventType == MouseMove {
		handleMouseMove(msg)
	} else if msg.EventType == MouseScroll {
		handleMouseScroll(msg)
	}
}

func handleKeyPress(msg *Message) {
	log.Println("Handling keypress")
	robotgo.KeyTap(msg.Key)
}

func handleMouseClick(msg *Message) {
	if msg.MKey == Left {
		robotgo.Click()
	} else if msg.MKey == Right {
		robotgo.Click("right")
	} else if msg.MKey == Middle {
		robotgo.Click("wheel")
	}
}

func handleMouseMove(msg *Message) {
	robotgo.MoveSmooth(msg.X, msg.Y)
}

func handleMouseScroll(msg *Message) {

}
