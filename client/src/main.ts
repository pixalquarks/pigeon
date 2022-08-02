import firebase from 'firebase/compat/app';
import "firebase/compat/firestore";
import './style.css';

import firebaseConfig, { servers, displayMediaOptions } from './config';
import { Receiver, Sender } from './handlers';

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();

const videoElem: HTMLVideoElement = document.getElementById("video") as HTMLVideoElement;
const startElem = document.getElementById("start") as HTMLButtonElement;
const stopElem = document.getElementById("stop") as HTMLButtonElement;
const createCallElem = document.getElementById("createCall") as HTMLButtonElement;
const joinCallElem = document.getElementById("joinCall") as HTMLButtonElement;
// const leaveCallElem = document.getElementById("leaveCall") as HTMLButtonElement; 
const callInput = document.getElementById("callInput") as HTMLInputElement;


stopElem?.addEventListener("click", function(_evt) {
  stopCapture();
}, false);

function stopCapture() {
  if (!videoElem) return;
  (<MediaStream>videoElem.srcObject).getTracks().forEach(track => track.stop());
}

const pc = new RTCPeerConnection(servers);
let stream = new MediaStream();
let datachannel: RTCDataChannel | null = null;

if (startElem != null) {
  console.log("assign");
  startElem.onclick = async () => {
    console.log("clicked");
    try {
    stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    stream.getTracks().forEach(track => pc.addTrack(track, stream as MediaStream));
    videoElem.srcObject = stream;
    } catch(err) {
      console.error(err);
    }
  }
}

if (createCallElem != null) {
  createCallElem.onclick = async () => {
  const callDoc = db.collection("calls").doc();
  const offerCandidate = callDoc.collection('offerCandidates');
  const answerCandidate = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  pc.onicecandidate = event => {
    event.candidate && offerCandidate.add(event.candidate.toJSON());
  };

  const receiver = new Receiver();

  datachannel = pc.createDataChannel("keys");
  console.log(datachannel);

  datachannel.onmessage = receiver.handleMessageReceived;
  datachannel.onopen = () => {
    console.log("datachannel open");
  }

  datachannel.onerror = (err) => {
    console.error(err);
  }

  datachannel.onclose = () => {
    console.log("datachannel closed");
  }


  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  }

  await callDoc.set({ offer });

  callDoc.onSnapshot( snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  answerCandidate.onSnapshot( snapshot => {
    snapshot.docChanges().forEach(element => {
      if (element.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(element.doc.data()));
      }
    });
  })
}
}

if (joinCallElem != null) {
  joinCallElem.onclick = async () => {
  const callID = callInput.value;
  const callDoc = db.collection("calls").doc(callID);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = event => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  }

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach( track => {
      stream.addTrack(track);
    })
  }

  pc.ondatachannel = event => {
    console.log("Data Channel");
    const sender = new Sender(event.channel, videoElem);
    document.onkeydown = sender.handlekeydown;
    videoElem.onclick = sender.handleMouseClick;
    videoElem.onauxclick = sender.handleMouseClick;
  }

  videoElem.srcObject = stream;

  const callData = (await callDoc.get()).data();

  const offerDescription = callData?.offer;
  console.log(offerDescription);
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    sdp: answerDescription.sdp,
    type: answerDescription.type,
  }

  await callDoc.update({ answer });

  offerCandidates.onSnapshot( snapshot => {
    snapshot.docChanges().forEach(element => {
      if (element.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(element.doc.data()));
      }
    })
  })
}
}