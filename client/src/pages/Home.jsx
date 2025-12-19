// src/pages/Home.jsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";
import { useCall } from "../context/CallContext";
import {
  Container,
  Row,
  Col,
  Modal,
  Card,
  Form,
  Button,
  Badge,
  ListGroup,
  Spinner,
  Alert,
} from "react-bootstrap";

export default function Home() {
  const navigate = useNavigate();

  const jwt = localStorage.getItem("jwt");
  const authHeader = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const { incomingCall, setIncomingCall } = useCall();

  // auth redirect
  useEffect(() => {
    if (!jwt) navigate("/login");
  }, [jwt, navigate]);

  // initial data
  useEffect(() => {
    if (!jwt) return;
    loadAll();
  }, [jwt]);

  const loadAll = async () => {
    try {
      await Promise.all([fetchRequests(), fetchFriends()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/friends/requests",
      authHeader
    );
    setRequests(Array.isArray(res.data) ? res.data : []);
  };

  const fetchFriends = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/friends/list",
      authHeader
    );
    setFriends(Array.isArray(res.data) ? res.data : []);
  };

  // friend request socket events
  useEffect(() => {
    if (!jwt) return;

    const onReceived = (data) => {
      setRequests((prev) => {
        if (prev.find((r) => r?._id === data?._id)) return prev;
        return [...prev, data];
      });
    };

    const onAccepted = ({ otherUser, request }) => {
      setRequests((prev) => prev.filter((r) => r?._id !== request?._id));
      if (otherUser) {
        setFriends((prev) => {
          if (prev.find((f) => String(f._id) === String(otherUser._id))) {
            return prev;
          }
          return [...prev, otherUser];
        });
      }
    };

    const onRejected = ({ _id }) => {
      setRequests((prev) => prev.filter((r) => r?._id !== _id));
    };

    socket.on("friend-request:received", onReceived);
    socket.on("friend-request:accepted", onAccepted);
    socket.on("friend-request:rejected", onRejected);

    return () => {
      socket.off("friend-request:received", onReceived);
      socket.off("friend-request:accepted", onAccepted);
      socket.off("friend-request:rejected", onRejected);
    };
  }, [jwt]);

  // search
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/search?query=${encodeURIComponent(
          q
        )}`,
        authHeader
      );

      const user = res.data.user;
      const me = localStorage.getItem("userId");

      if (String(user._id) === String(me)) {
        setSearchedUser(null);
        setSearchStatus(null);
        setSearchError("You cannot send a request to yourself.");
        return;
      }

      const alreadyFriend = friends.some(
        (f) => String(f._id) === String(user._id)
      );

      let status = res.data.status || "none";
      if (alreadyFriend) status = "friends";

      setSearchedUser(user);
      setSearchStatus(status);
      setSearchError("");
    } catch (err) {
      console.error(err);
      setSearchedUser(null);
      setSearchStatus(null);
      setSearchError("User not found");
    }
  };

  const sendRequest = async () => {
    if (!searchedUser?._id) return;
    try {
      await axios.post(
        "http://localhost:5000/api/friends/send",
        { receiverId: searchedUser._id },
        authHeader
      );
      setSearchStatus("request_sent");
    } catch (err) {
      console.error(err);
      alert("Failed to send request");
    }
  };

  const acceptRequest = async (id) => {
    const req = requests.find((r) => r?._id === id);
    await axios.put(
      `http://localhost:5000/api/friends/accept/${id}`,
      {},
      authHeader
    );
    setRequests((prev) => prev.filter((r) => r?._id !== id));

    if (req) {
      const me = localStorage.getItem("userId");
      const other =
        String(req.sender._id) === String(me) ? req.receiver : req.sender;
      setFriends((prev) => [...prev, other]);
    }
  };

  const rejectRequest = async (id) => {
    await axios.put(
      `http://localhost:5000/api/friends/reject/${id}`,
      {},
      authHeader
    );
    setRequests((prev) => prev.filter((r) => r?._id !== id));
  };

  const openChat = (userId) => {
    navigate(`/chat/${userId}`, { state: { canCall: true } });
  };

  // incoming call from CallContext
  const acceptCall = () => {
    if (!incomingCall) return;
    const { from } = incomingCall;
    navigate(`/chat/${from}`, {
      state: { canCall: true, autoAccept: true },
    });
  };

  const rejectCallGlobal = () => {
    if (!incomingCall) return;
    socket.emit("call:end", { to: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    <>
      <AppNavbar />
      <Container
        fluid
        className="py-4"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <Row className="g-4">
          {/* Left Panel - Search & Requests */}
          <Col lg={7}>
            <Card className="shadow-sm border-0 mb-4 fade-in">
              <Card.Body className="p-4">
                <div className="mb-4">
                  <h3 className="fw-bold mb-1">Find Friends</h3>
                  <p className="text-muted mb-3">
                    Search for users by email and connect with them
                  </p>

                  <Form.Group className="mb-3">
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="email"
                        placeholder="Search users by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearch()
                        }
                        size="lg"
                      />
                      <Button
                        variant="primary"
                        onClick={handleSearch}
                        size="lg"
                        className="px-4"
                      >
                        <i className="bi bi-search"></i>
                      </Button>
                    </div>
                  </Form.Group>

                  {searchError && (
                    <Alert variant="danger">{searchError}</Alert>
                  )}

                  {searchedUser && (
                    <Card className="border shadow-sm">
                      <Card.Body className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: "50px",
                              height: "50px",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            {(searchedUser.username || searchedUser.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <h6 className="mb-1 fw-semibold">
                              {searchedUser.username || searchedUser.email}
                            </h6>
                            <p className="text-muted mb-1 small">
                              {searchedUser.email}
                            </p>
                            {searchStatus === "friends" && (
                              <Badge bg="success">Friends</Badge>
                            )}
                            {searchStatus === "request_sent" && (
                              <Badge bg="warning">Request Sent</Badge>
                            )}
                          </div>
                        </div>

                        {searchStatus === "friends" && (
                          <Button
                            variant="primary"
                            onClick={() => openChat(searchedUser._id)}
                          >
                            <i className="bi bi-chat-fill me-2"></i>
                            Chat
                          </Button>
                        )}

                        {searchStatus === "none" && (
                          <Button variant="primary" onClick={sendRequest}>
                            <i className="bi bi-person-plus me-2"></i>
                            Send Request
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  )}
                </div>

                <hr />

                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="fw-bold mb-0">Friend Requests</h5>
                    <Badge bg="primary" pill>
                      {requests.length}
                    </Badge>
                  </div>

                  {requests.length === 0 && (
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No pending requests
                    </Alert>
                  )}

                  {/* Incoming call modal */}
                  <Modal show={!!incomingCall} centered backdrop="static">
                    <Modal.Header>
                      <Modal.Title>Incoming Video Call</Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="text-center">
                      <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-3"
                        style={{
                          width: "80px",
                          height: "80px",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        }}
                      >
                        {(incomingCall?.caller?.username ||
                          incomingCall?.caller?.email)?.[0]?.toUpperCase()}
                      </div>

                      <h5 className="fw-semibold">
                        {incomingCall?.caller?.username ||
                          incomingCall?.caller?.email}
                      </h5>

                      <p className="text-muted">is calling you...</p>
                    </Modal.Body>

                    <Modal.Footer className="justify-content-center gap-3">
                      <Button variant="danger" onClick={rejectCallGlobal}>
                        Decline
                      </Button>
                      <Button variant="success" onClick={acceptCall}>
                        Accept
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  <ListGroup variant="flush">
                    {requests.map((r) => (
                      <ListGroup.Item
                        key={r._id}
                        className="px-0 border-bottom"
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: "45px",
                                height: "45px",
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              }}
                            >
                              {(r.sender?.username ||
                                r.sender?.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <h6 className="mb-1 fw-semibold">
                                {r.sender?.username || r.sender?.email}
                              </h6>
                              <p className="text-muted mb-0 small">
                                {r.sender?.email}
                              </p>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => acceptRequest(r._id)}
                            >
                              <i className="bi bi-check-lg"></i>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => rejectRequest(r._id)}
                            >
                              <i className="bi bi-x-lg"></i>
                            </Button>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Panel - Friends List */}
          <Col lg={5}>
            <Card className="shadow-sm border-0 fade-in">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-chat-dots me-2"></i>
                    Conversations
                  </h5>
                  <Badge bg="secondary" pill>
                    {friends.length}
                  </Badge>
                </div>

                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Loading friends...</p>
                  </div>
                )}

                {!loading && friends.length === 0 && (
                  <Alert variant="info" className="text-center">
                    <i className="bi bi-people fs-1 d-block mb-2"></i>
                    No friends yet. Send a request from the search above.
                  </Alert>
                )}

                <ListGroup variant="flush">
                  {friends.map((f) => (
                    <ListGroup.Item
                      key={f._id}
                      action
                      onClick={() => openChat(f._id)}
                      className="px-0 border-bottom cursor-pointer"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: "50px",
                              height: "50px",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            {(f.username || f.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <h6 className="mb-1 fw-semibold">
                              {f.username || f.email}
                            </h6>
                            <p className="text-muted mb-0 small">
                              {f.email}
                            </p>
                          </div>
                        </div>

                        <i className="bi bi-chevron-right text-muted"></i>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
