import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import "../App.css";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({ friendId, friend }) {
  const [inCall, setInCall] = useState(false);
  const [incomingFrom, setIncomingFrom] = useState(null);

  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const me = localStorage.getItem("userId");

  useEffect(() => {
    const onIncoming = async ({ from, offer }) => {
      setIncomingFrom(from);
      await startPeer(false, offer, from);
    };

    const onAnswered = async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);
      setInCall(true);
    };

    const onIce = async ({ candidate }) => {
      if (candidate) await pcRef.current?.addIceCandidate(candidate);
    };

    const onEnded = () => endCall();

    socket.on("call:incoming", onIncoming);
    socket.on("call:answered", onAnswered);
    socket.on("call:ice-candidate", onIce);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:answered", onAnswered);
      socket.off("call:ice-candidate", onIce);
      socket.off("call:ended", onEnded);
    };
  }, []);

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeer = (to) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) =>
      e.candidate &&
      socket.emit("call:ice-candidate", { to, candidate: e.candidate });

    pc.ontrack = (e) => (remoteVideoRef.current.srcObject = e.streams[0]);

    pcRef.current = pc;
    return pc;
  };

  const startPeer = async (isCaller, offer, to) => {
    const stream = await getMedia();
    const pc = createPeer(to);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call:offer", { to, offer });
    } else {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call:answer", { to, answer });
      setInCall(true);
    }
  };

  const startCall = () => startPeer(true, null, friendId);

  const endCall = () => {
    setInCall(false);
    setIncomingFrom(null);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  return (
    <>
      {!inCall && !incomingFrom && (
        <button className="btn btn-primary btn-sm" onClick={startCall}>
          📹 Call
        </button>
      )}
      {incomingFrom && !inCall && (
        <div className="incoming-call-banner">
          <span>
            Incoming call from {friend?.username || friend?.email}
          </span>
          <div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => startPeer(false, null, incomingFrom)}
            >
              Accept
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={endCall}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {inCall && (
        <div className="call-container">
          <div className="video-row">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-remote"
            />
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-local"
            />
          </div>

          <div className="call-actions">
            <button
              className="btn btn-danger btn-sm"
              onClick={endCall}
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
}
