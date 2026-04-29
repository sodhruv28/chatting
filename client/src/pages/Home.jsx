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
            ${import.meta.env.VITE_API_URL || "http://localhost:5000"} pill>
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