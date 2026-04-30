import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import socket from "../socket";
import { toast } from "sonner";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall({ friendId, friend }) {
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const onIncoming = ({ from, offer, caller }) => {
      setIncomingCall({ from, offer, caller });
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
      
      // Stop tracks on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      toast.error("Could not access camera or microphone. Please check your permissions and devices.");
      return null;
    }
  };

  const createPeer = (to) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) =>
      e.candidate &&
      socket.emit("call:ice-candidate", { to, candidate: e.candidate });

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startPeer = async (isCaller, offer, to) => {
    const stream = await getMedia();
    if (!stream) {
      endCall();
      return;
    }
    setInCall(true);
    const pc = createPeer(to);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    if (isCaller) {
      const offerDesc = await pc.createOffer();
      await pc.setLocalDescription(offerDesc);
      socket.emit("call:offer", { to, offer: offerDesc });
    } else {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call:answer", { to, answer });
    }
  };

  const startCall = () => {
    startPeer(true, null, friendId);
  };

  const acceptCall = () => {
    if (incomingCall) {
      startPeer(false, incomingCall.offer, incomingCall.from);
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (inCall && pcRef.current) {
      socket.emit("call:end", { to: friendId });
    }
    setInCall(false);
    setIncomingCall(null);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("call:end", { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  return (
    <>
      {!inCall && !incomingCall && (
        <button 
          onClick={startCall}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full"
        >
          <i className="bi bi-camera-video text-lg"></i>
        </button>
      )}

      {incomingCall && !inCall && createPortal(
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] bg-surface/95 backdrop-blur-xl border border-primary/30 p-5 rounded-[24px] shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center text-2xl mb-2 animate-pulse">
              <i className="bi bi-telephone-inbound-fill"></i>
            </div>
            <h3 className="text-lg font-black text-text-main">Incoming Video Call</h3>
            <p className="text-sm font-medium text-text-muted">
              {incomingCall.caller?.username || friend?.username || "Unknown User"} is calling you
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              className="flex-1 py-3 bg-red-500/10 text-red-500 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98]"
              onClick={rejectCall}
            >
              Decline
            </button>
            <button
              className="flex-1 py-3 bg-green-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 hover:scale-105 transition-all active:scale-[0.98]"
              onClick={acceptCall}
            >
              Accept
            </button>
          </div>
        </div>,
        document.body
      )}

      {inCall && createPortal(
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent">
            <div>
              <h2 className="text-xl font-black text-text-main">Video Call</h2>
              <p className="text-sm font-medium text-text-muted animate-pulse">In progress...</p>
            </div>
            <button 
              onClick={endCall}
              className="w-12 h-12 bg-surface border border-[var(--border-color)] rounded-full flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
            >
              <i className="bi bi-arrows-angle-contract"></i>
            </button>
          </div>

          <div className="flex-1 relative p-4 pb-24">
            <div className="w-full h-full rounded-[32px] overflow-hidden bg-black/50 border border-[var(--border-color)] relative shadow-2xl">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              <div className="absolute bottom-6 right-6 w-32 h-48 bg-surface rounded-2xl overflow-hidden border-2 border-[var(--border-color)] shadow-2xl z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-6 bg-gradient-to-t from-background to-transparent">
            <button className="w-14 h-14 bg-surface border border-[var(--border-color)] text-text-main rounded-full flex items-center justify-center text-xl hover:bg-[#efedf5] dark:hover:bg-[#303036] shadow-lg transition-all active:scale-95">
              <i className="bi bi-mic-fill"></i>
            </button>
            <button 
              onClick={endCall}
              className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
            >
              <i className="bi bi-telephone-x-fill"></i>
            </button>
            <button className="w-14 h-14 bg-surface border border-[var(--border-color)] text-text-main rounded-full flex items-center justify-center text-xl hover:bg-[#efedf5] dark:hover:bg-[#303036] shadow-lg transition-all active:scale-95">
              <i className="bi bi-camera-video-fill"></i>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
