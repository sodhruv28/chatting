import { useCall } from "../context/CallContext";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import socket from "../socket";
import "../styles/modern.css"
import { Container, Card, Form, Button, Badge, Modal } from "react-bootstrap";

export default function Chat() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const canCall = location.state?.canCall ?? true;
  const autoAccept = location.state?.autoAccept ?? false;

  const jwt = localStorage.getItem("jwt");
  const currentUserId = localStorage.getItem("userId");
  useEffect(() => {
    if (socket.connected) return;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    socket.auth = { token };
    socket.connect();
  }, []);
  const { incomingCall, setIncomingCall } = useCall();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const [micOn, setMicOn] = useState(true);
  const [hasRemote, setHasRemote] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [speakerId, setSpeakerId] = useState("");

  const [inCall, setInCall] = useState(false);
  const [pendingStream, setPendingStream] = useState(null);

  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const authHeader = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  };

  // block alert
  useEffect(() => {
    const onBlocked = ({ to }) => {
      if (String(to) === String(friendId)) {
        alert("You can't send messages to this user.");
      }
    };
    socket.on("message-blocked", onBlocked);
    return () => socket.off("message-blocked", onBlocked);
  }, [friendId]);

  // audio output list
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      setSpeakers(outputs);
    });
  }, []);

  const changeSpeaker = async (id) => {
    if (!remoteVideoRef.current?.setSinkId) {
      alert("Speaker selection not supported");
      return;
    }
    await remoteVideoRef.current.setSinkId(id);
    setSpeakerId(id);
  };

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // load friend data
  useEffect(() => {
    if (!jwt || !friendId) return;
    axios
      .get(`http://localhost:5000/api/users/${friendId}`, authHeader)
      .then((res) => setFriend(res.data))
      .catch(console.error);
  }, [friendId, jwt]);

  // load online status (initial)
  useEffect(() => {
    if (!jwt || !friendId) return;
    const loadStatus = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/status/${friendId}`,
          authHeader
        );
        setIsOnline(res.data.isOnline);
      } catch (err) {
        console.error("Status API error", err);
      }
    };
    loadStatus();
  }, [friendId, jwt]);

  // load chat history once
  useEffect(() => {
    if (!jwt || !currentUserId || !friendId) return;

    const loadHistory = async () => {
      const res = await axios.get(
        `http://localhost:5000/api/chats/history/${friendId}`,
        authHeader
      );
      setMessages(
        res.data.map((msg) => ({
          id: msg._id,
          text: msg.message,
          self: String(msg.sender) === String(currentUserId),
          time: new Date(msg.createdAt).toLocaleTimeString(),
          isRead: msg.isRead,
        }))
      );
    };

    loadHistory().catch(console.error);
  }, [friendId, jwt, currentUserId]);


  useEffect(() => {
    if (!friendId || !currentUserId || !jwt) return;
    if (messages.length === 0) return;

    const markMessagesRead = async () => {
      try {
        await axios.patch(
          `http://localhost:5000/api/chats/mark-read/${friendId}`,
          {},
          authHeader
        );
        // locally mark friend’s messages as read too (for your own Chat UI)
        setMessages((prev) =>
          prev.map((m) =>
            !m.self ? { ...m, isRead: true } : m
          )
        );
      } catch (err) {
        console.error("Mark read failed", err);
      }
    };

    const t = setTimeout(markMessagesRead, 800);
    return () => clearTimeout(t);
  }, [friendId, currentUserId, jwt, messages.length]);



  // realtime chat + online events
  useEffect(() => {
    if (!currentUserId || !friendId) return;
    if (!socket.connected) {
      console.log("Chat: socket not connected yet, skipping listeners");
      return;
    }

    socket.emit("join-chat", { friendId });

    const onReceiveMessage = (data) => {
      setMessages((prev) => {
        // replace temp message if it was mine
        const tempIndex = prev.findIndex(
          (m) => m.self && m.id.startsWith("tmp-")
        );

        if (tempIndex !== -1 && String(data.sender) === String(currentUserId)) {
          const updated = [...prev];
          updated[tempIndex] = {
            id: data._id,
            text: data.message,
            self: true,
            time: new Date(data.createdAt).toLocaleTimeString(),
            isRead: data.isRead,
          };
          return updated;
        }

        // otherwise it's incoming
        return [
          ...prev,
          {
            id: data._id,
            text: data.message,
            self: false,
            time: new Date(data.createdAt).toLocaleTimeString(),
            isRead: data.isRead,
          },
        ];
      });
    };


    const onMessagesRead = ({ by }) => {
      if (String(by) !== String(friendId)) return;

      setMessages((prev) =>
        prev.map((m) => (m.self ? { ...m, isRead: true } : m))
      );
    };


    const onUserOnline = ({ userId }) => {
      if (String(userId) === String(friendId)) setIsOnline(true);
    };

    const onUserOffline = ({ userId }) => {
      if (String(userId) === String(friendId)) setIsOnline(false);
    };

    socket.on("receive-message", onReceiveMessage);
    socket.on("messages:read", onMessagesRead);
    socket.on("user-online", onUserOnline);
    socket.on("user-offline", onUserOffline);

    return () => {
      socket.off("receive-message", onReceiveMessage);
      socket.off("messages:read", onMessagesRead);
      socket.off("user-online", onUserOnline);
      socket.off("user-offline", onUserOffline);
    };
  }, [friendId, currentUserId, socket.connected]);


  // WebRTC signal handlers
  useEffect(() => {
    if (!currentUserId) return;

    const onAnswered = async ({ from, answer }) => {
      if (String(from) !== String(friendId)) return;
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      setInCall(true);
    };

    const onIce = async ({ from, candidate }) => {
      if (String(from) !== String(friendId)) return;
      await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onEnded = () => {
      cleanupCall(false);
    };

    socket.on("call:answered", onAnswered);
    socket.on("call:ice-candidate", onIce);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:answered", onAnswered);
      socket.off("call:ice-candidate", onIce);
      socket.off("call:ended", onEnded);
    };
  }, [friendId, currentUserId]);

  const createPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (!remoteVideoRef.current) return;

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => { });
      }

      const alreadyAdded = remoteStreamRef.current
        .getTracks()
        .some((t) => t.id === event.track.id);

      if (!alreadyAdded) {
        remoteStreamRef.current.addTrack(event.track);
      }

      if (event.track.kind === "video") {
        setHasRemote(true);
      }
    };

    peerRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setPendingStream(stream);
      setInCall(true);
    } catch (err) {
      console.error("getUserMedia failed", err);
      alert("Could not access camera/mic. Check permissions.");
    }
  };

  useEffect(() => {
    if (!inCall || !pendingStream || !friendId) return;
    if (!localVideoRef.current) return;

    const stream = pendingStream;
    setPendingStream(null);

    localVideoRef.current.srcObject = stream;
    localVideoRef.current.play().catch(() => { });

    const pc = createPeerConnection(friendId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    (async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call:offer", { to: friendId, offer });
    })();
  }, [inCall, pendingStream, friendId]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    const { from, offer } = incomingCall;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => { });
    }

    const pc = createPeerConnection(from);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { to: from, answer });

    setIncomingCall(null);
    setInCall(true);
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("call:end", { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!autoAccept) return;
    if (!incomingCall) return;
    if (String(incomingCall.from) !== String(friendId)) return;
    acceptCall();
  }, [autoAccept, incomingCall, friendId]);

  const cleanupCall = (emitEnd = true) => {
    setInCall(false);
    setHasRemote(false);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (emitEnd) {
      socket.emit("call:end", { to: friendId });
    }
  };

  const endCall = () => cleanupCall(true);

  const sendMessage = () => {
    if (!message.trim()) return;

    const tempId = `tmp-${Date.now()}`;

    // optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: message.trim(),
        self: true,
        time: new Date().toLocaleTimeString(),
        isRead: false,
      },
    ]);

    socket.emit("send-message", {
      receiver: friendId,
      message: message.trim(),
    });

    setMessage("");
  };

  return (
    <>
      <Navbar />
      <Container fluid className="p-4" style={{ maxWidth: "1200px" }}>
        <Card className="shadow-sm border-0 fade-in" style={{ height: "calc(100vh - 120px)" }}>
          <Card.Header className="bg-white border-bottom p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="rounded-circle"
                  style={{ width: "40px", height: "40px" }}
                >
                  <i className="bi bi-arrow-left"></i>
                </Button>

                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "45px",
                    height: "45px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {(friend?.username || friend?.email)?.[0]?.toUpperCase()}
                </div>

                <div>
                  <h6 className="mb-0 fw-semibold">{friend?.username || friend?.email}</h6>
                  <small className="text-muted">
                    {isOnline ? (
                      <>
                        <Badge bg="success" pill className="me-1">
                          •
                        </Badge>
                        Online
                      </>
                    ) : (
                      <>
                        <Badge bg="secondary" pill className="me-1">
                          •
                        </Badge>
                        Offline
                      </>
                    )}
                  </small>
                </div>
              </div>

              {!inCall && canCall && (
                <Button variant="primary" size="sm" onClick={startCall} className="d-flex align-items-center gap-2">
                  <i className="bi bi-camera-video"></i>
                  Video Call
                </Button>
              )}
            </div>
          </Card.Header>

          <Modal show={!!incomingCall && !inCall} centered>
            <Modal.Header>
              <Modal.Title>Incoming Video Call</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-3"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {(friend?.username || friend?.email)?.[0]?.toUpperCase()}
              </div>
              <h5 className="fw-semibold">{friend?.username || friend?.email}</h5>
              <p className="text-muted">is calling you...</p>
            </Modal.Body>
            <Modal.Footer className="justify-content-center gap-3">
              <Button variant="danger" onClick={rejectCall} size="lg">
                <i className="bi bi-telephone-x me-2"></i>
                Decline
              </Button>
              <Button variant="success" onClick={acceptCall} size="lg">
                <i className="bi bi-telephone me-2"></i>
                Accept
              </Button>
            </Modal.Footer>
          </Modal>

          {inCall && (
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark" style={{ zIndex: 1000 }}>
              <div className="position-relative w-100 h-100">
                <video
                  ref={hasRemote ? remoteVideoRef : localVideoRef}
                  autoPlay
                  playsInline
                  muted={!hasRemote}
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                />
                {hasRemote && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="position-absolute shadow-lg rounded"
                    style={{
                      top: "20px",
                      right: "20px",
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  className="position-absolute start-50 translate-middle-x d-flex gap-3 align-items-center p-3 rounded-pill"
                  style={{
                    bottom: "30px",
                    background: "rgba(0,0,0,0.7)",
                  }}
                >
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm">
                      <i className="bi bi-speaker"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {speakers.map((s) => (
                        <Dropdown.Item
                          key={s.deviceId}
                          onClick={() => changeSpeaker(s.deviceId)}
                          active={s.deviceId === speakerId}
                        >
                          {s.label || "Speaker"}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  <Button
                    variant={micOn ? "light" : "danger"}
                    onClick={toggleMic}
                    className="rounded-circle"
                    style={{ width: "45px", height: "45px" }}
                  >
                    <i className={`bi bi-mic${micOn ? "" : "-mute"}`}></i>
                  </Button>

                  <Button
                    variant="danger"
                    onClick={endCall}
                    className="rounded-circle"
                    style={{ width: "45px", height: "45px" }}
                  >
                    <i className="bi bi-telephone-x"></i>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Card.Body className="d-flex flex-column p-0" style={{ height: "calc(100% - 140px)" }}>
            <div className="flex-grow-1 overflow-auto p-4" style={{ background: "#f8f9fa" }}>
              {messages.map((m) => (
                <div key={m.id} className={`d-flex mb-3 ${m.self ? "justify-content-end" : "justify-content-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-3 shadow-sm ${m.self ? "text-white" : "bg-white text-dark"}`}
                    style={{
                      maxWidth: "70%",
                      background: m.self ? "#609672ff" : "#ffffff",
                    }}
                  >
                    <p className="mb-1">{m.text}</p>
                    <small className={m.self ? "text-white-50" : "text-muted"} style={{ fontSize: "0.7rem" }}>
                      {m.time}
                    </small>
                    {m.self && (
                      <i
                        className={`bi bi-check2-all ms-1 ${m.isRead ? "text-info" : "text-white-50"}`}
                        style={{ fontSize: "0.9rem" }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-top bg-white">
              <Form.Group className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  size="lg"
                />
                <Button variant="primary" onClick={sendMessage} size="lg" className="px-4">
                  <i className="bi bi-send-fill"></i>
                </Button>
              </Form.Group>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}
