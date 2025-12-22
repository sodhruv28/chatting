import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";
import { useCall } from "../context/CallContext";
import "../styles/modern.css"
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
    const me = localStorage.getItem("userId");
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
    const [lastMessages, setLastMessages] = useState({});
    const { incomingCall, setIncomingCall } = useCall();
    const [unreadCounts, setUnreadCounts] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [lastStatus, setLastStatus] = useState({});


    useEffect(() => {
        if (!jwt) navigate("/login");
    }, [jwt]);

    useEffect(() => {
        if (!jwt) return;
        loadAll();
    }, [jwt]);

    useEffect(() => {
        if (!jwt) return;
        const onReceived = (data) => {
            setRequests((prev) =>
                prev.some((r) => r._id === data._id) ? prev : [...prev, data]
            );
        };
        const onAccepted = ({ otherUser, request }) => {
            setRequests((prev) => prev.filter((r) => r._id !== request._id));
            if (otherUser) {
                setFriends((prev) =>
                    prev.some((f) => f._id === otherUser._id)
                        ? prev
                        : [...prev, otherUser]
                );
            }
        };
        socket.on("friend-request:received", onReceived);
        socket.on("friend-request:accepted", onAccepted);
        return () => {
            socket.off("friend-request:received", onReceived);
            socket.off("friend-request:accepted", onAccepted);
        };
    }, [jwt]);

    useEffect(() => {
        const onTyping = ({ from }) => {
            setTypingUsers(prev => ({ ...prev, [from]: true }));

            setTimeout(() => {
                setTypingUsers(prev => {
                    const copy = { ...prev };
                    delete copy[from];
                    return copy;
                });
            }, 2000);
        };

        socket.on("typing", onTyping);
        return () => socket.off("typing", onTyping);
    }, []);

    useEffect(() => {
        const onMessagesRead = ({ by }) => {
            setLastStatus((prev) => ({
                ...prev,
                [by]: {
                    status: "read",
                    sender: me,
                },
            }));
        };

        socket.on("messages:read", onMessagesRead);
        return () => socket.off("messages:read", onMessagesRead);
    }, []);

    const loadAll = async () => {
        try {
            await Promise.all([
                fetchRequests(),
                fetchFriends(),
                fetchUnreadCounts(),
                fetchLastMessages(),
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return "";
        const d = new Date(time);
        return d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
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

    const fetchUnreadCounts = async () => {
        const res = await axios.get(
            "http://localhost:5000/api/chats/unread-counts",
            authHeader
        );
        const map = {};
        res.data.forEach((row) => {
            map[row.friendId] = row.count;
        });
        setUnreadCounts(map);
    };

    const fetchLastMessages = async () => {
        const res = await axios.get(
            "http://localhost:5000/api/chats/last-messages",
            authHeader
        );
        const map = {};
        res.data.forEach((row) => {
            map[row._id] = {
                text: row.lastMessage,
                time: row.lastMessageAt,
            };
        });
        setLastMessages(map);
    };

    useEffect(() => {
        const onReceiveMessage = (data) => {
            const me = localStorage.getItem("userId");

            const friendId =
                String(data.sender) === String(me)
                    ? data.receiver
                    : data.sender;

            setLastMessages((prev) => ({
                ...prev,
                [friendId]: {
                    text: data.message,
                    time: data.createdAt,
                    sender: data.sender,
                },
            }));
            if (String(data.sender) !== String(me)) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [friendId]: (prev[friendId] || 0) + 1,
                }));
            }
            if (String(data.sender) === String(me)) {
                setLastStatus((prev) => ({
                    ...prev,
                    [friendId]: data.isRead ? "read" : "delivered",
                }));
            }
        };

        socket.on("receive-message", onReceiveMessage);
        return () => socket.off("receive-message", onReceiveMessage);
    }, []);


    useEffect(() => {
        if (!friends.length) return;

        setFriends((prev) =>
            [...prev].sort((a, b) => {
                const t1 = lastMessages[a._id]?.time
                    ? new Date(lastMessages[a._id].time).getTime()
                    : 0;
                const t2 = lastMessages[b._id]?.time
                    ? new Date(lastMessages[b._id].time).getTime()
                    : 0;
                return t2 - t1; // newest chat first
            })
        );
    }, [lastMessages]);

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
            <Container fluid className="py-4" style={{ minHeight: "calc(100vh - 80px)" }}>
                <Row className="g-4">
                    <Col lg={7}>
                        <Card className="shadow-sm border-0 mb-4 fade-in">
                            <Card.Body className="p-4">
                                <div className="mb-4">
                                    <h3 className="fw-bold mb-1">Find Friends</h3>
                                    <p className="text-muted mb-3">Search for users by email and connect with them</p>


                                    <Form.Group className="mb-3">
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="email"
                                                placeholder="Search users by email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                                size="lg"
                                            />
                                            <Button variant="primary" onClick={handleSearch} size="lg" className="px-4">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </div>
                                    </Form.Group>


                                    {searchError && <Alert variant="danger">{searchError}</Alert>}


                                    {searchedUser && (
                                        <Card className="border shadow-sm">
                                            <Card.Body className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        }}
                                                    >
                                                        {(searchedUser.username || searchedUser.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-1 fw-semibold">{searchedUser.username || searchedUser.email}</h6>
                                                        <p className="text-muted mb-1 small">{searchedUser.email}</p>
                                                        {searchStatus === "friends" && <Badge bg="success">Friends</Badge>}
                                                        {searchStatus === "request_sent" && <Badge bg="warning">Request Sent</Badge>}
                                                    </div>
                                                </div>


                                                {searchStatus === "friends" && (
                                                    <Button variant="primary" onClick={() => openChat(searchedUser._id)}>
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


                                    <Modal show={!!incomingCall} centered backdrop="static">
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
                                                {(incomingCall?.caller?.username || incomingCall?.caller?.email)?.[0]?.toUpperCase()}
                                            </div>


                                            <h5 className="fw-semibold">{incomingCall?.caller?.username || incomingCall?.caller?.email}</h5>


                                            <p className="text-muted">is calling you...</p>
                                        </Modal.Body>


                                        <Modal.Footer className="justify-content-center gap-3">
                                            <Button variant="danger" size="lg" onClick={rejectCallGlobal}>
                                                <i className="bi bi-telephone-x me-2"></i>
                                                Decline
                                            </Button>
                                            <Button variant="success" size="lg" onClick={acceptCall}>
                                                <i className="bi bi-telephone me-2"></i>
                                                Accept
                                            </Button>
                                        </Modal.Footer>
                                    </Modal>


                                    <ListGroup variant="flush">
                                        {requests.map((r) => (
                                            <ListGroup.Item key={r._id} className="px-0 border-bottom">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                                            style={{
                                                                width: "45px",
                                                                height: "45px",
                                                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                            }}
                                                        >
                                                            {(r.sender?.username || r.sender?.email)[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-1 fw-semibold">{r.sender?.username || r.sender?.email}</h6>
                                                            <p className="text-muted mb-0 small">{r.sender?.email}</p>
                                                        </div>
                                                    </div>


                                                    <div className="d-flex gap-2">
                                                        <Button variant="success" size="sm" onClick={() => acceptRequest(r._id)}>
                                                            <i className="bi bi-check-lg"></i>
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => rejectRequest(r._id)}>
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
                                        <i className="bi bi-check2-all text-primary chat-tick"></i>
                                        No friends yet. Send a request from the search above.
                                    </Alert>
                                )}
                                <ListGroup variant="flush">
                                    {friends.map((f) => {
                                        const count = unreadCounts[f._id] || 0;
                                        const last = lastMessages[f._id];

                                        return (
                                            <ListGroup.Item
                                                key={f._id}
                                                action
                                                onClick={() => openChat(f._id)}
                                                className={`px-0 border-bottom ${count > 0 ? "friend-move" : ""}`}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className="d-flex align-items-center justify-content-between">

                                                    {/* LEFT SIDE */}
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
                                                            <h6 className={`mb-1 ${count > 0 ? "fw-bold text-dark" : "fw-semibold"}`}>
                                                                {f.username || f.email}
                                                            </h6>
                                                            <div className="d-flex align-items-center gap-1">
                                                                {last && last.sender === me && (
                                                                    lastStatus[f._id] === "read" ? (
                                                                        <i className="bi bi-check2-all text-info" style={{ fontSize: "0.9rem" }} />
                                                                    ) : (
                                                                        <i className="bi bi-check2 text-muted" style={{ fontSize: "0.9rem" }} />
                                                                    )
                                                                )}

                                                                <span className="text-muted small text-truncate" style={{ maxWidth: "220px" }}>
                                                                    {typingUsers[f._id]
                                                                        ? "typing…"
                                                                        : last?.text || f.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT SIDE */}
                                                    <div className="d-flex flex-column align-items-end gap-1">
                                                        {last?.time && (
                                                            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                                {formatTime(last.time)}
                                                            </small>
                                                        )}

                                                        {count > 0 && (
                                                            <Badge bg="danger" pill>
                                                                {count}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}