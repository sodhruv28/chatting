// src/pages/Profile.jsx
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Modal } from "react-bootstrap";

export default function Profile() {
    const jwt = localStorage.getItem("jwt");
    const authHeader = { headers: { Authorization: `Bearer ${jwt}` } };

    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [blocked, setBlocked] = useState([]);
    const [saving, setSaving] = useState(false);
    // const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [form, setForm] = useState({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
    });

    useEffect(() => {
        if (!jwt) return;
        loadAll();
    }, [jwt]);

    const loadAll = async () => {
        try {
            const [meRes, friendsRes, blockedRes] = await Promise.all([
                axios.get("http://localhost:5000/api/users/me", authHeader),
                axios.get("http://localhost:5000/api/friends/list", authHeader),
                axios.get("http://localhost:5000/api/users/blocked", authHeader),
            ]);

            setUser(meRes.data);

            // ✅ use meRes *here*, not at top-level
            setForm((prev) => ({
                ...prev,
                username: meRes.data.username || "",
                email: meRes.data.email || "",
                currentPassword: "",
                newPassword: "",
            }));

            setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : []);
            setBlocked(Array.isArray(blockedRes.data) ? blockedRes.data : []);
        } catch (err) {
            console.error("Profile load error", err);
        }
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.patch(
                "http://localhost:5000/api/users/me",
                {
                    username: form.username,
                    currentPassword: form.currentPassword || undefined,
                    newPassword: form.newPassword || undefined,
                },
                authHeader
            );
            setUser(res.data);
            setForm((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
            }));
        } catch (err) {
            console.error("Save profile failed", err);
            alert(
                err.response?.data?.message || "Could not save profile / password."
            );
        } finally {
            setSaving(false);
        }
    };

    const removeFriend = async (id) => {
        if (!window.confirm("Remove this friend?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/friends/${id}`, authHeader);
            setFriends((prev) => prev.filter((f) => String(f._id) !== String(id)));
        } catch (err) {
            console.error("Remove friend failed", err);
        }
    };

    const blockUser = async (id) => {
        if (!window.confirm("Block this user? They will not be able to message you.")) return;
        try {
            await axios.post(
                `http://localhost:5000/api/users/block/${id}`,
                {},
                authHeader
            );
            const friend = friends.find((f) => String(f._id) === String(id));
            setBlocked((prev) => (friend ? [...prev, friend] : prev));
            setFriends((prev) => prev.filter((f) => String(f._id) !== String(id)));
        } catch (err) {
            console.error("Block user failed", err);
        }
    };

    const unblockUser = async (id) => {
        try {
            await axios.delete(
                `http://localhost:5000/api/users/block/${id}`,
                authHeader
            );
            setBlocked((prev) => prev.filter((u) => String(u._id) !== String(id)));
        } catch (err) {
            console.error("Unblock failed", err);
        }
    };

    // const deleteAccount = async () => {
    //     setDeleting(true);
    //     try {
    //         await axios.delete("http://localhost:5000/api/users/me", authHeader);
    //         localStorage.clear();
    //         window.location.href = "/register";
    //     } catch (err) {
    //         console.error("Delete account failed", err);
    //         alert("Could not delete account");
    //     } finally {
    //         setDeleting(false);
    //     }
    // };

    return (
        <>
            <Navbar />
            <Container className="mt-4">
                <Row>
                    {/* Profile info */}
                    <Col md={6} className="mb-3">
                        <Card className="shadow-sm border-0">
                            <Card.Header>
                                <strong>Profile</strong>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={saveProfile}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Display name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={form.username}
                                            onChange={(e) => handleChange("username", e.target.value)}
                                            placeholder="Your name"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Email (read only)</Form.Label>
                                        <Form.Control type="email" value={form.email} disabled />
                                    </Form.Group>

                                    <hr />

                                    <Form.Group className="mb-3">
                                        <Form.Label>Current password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={form.currentPassword}
                                            onChange={(e) => handleChange("currentPassword", e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>New password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={form.newPassword}
                                            onChange={(e) => handleChange("newPassword", e.target.value)}
                                            placeholder="At least 6 characters"
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                    </Form.Group>

                                    <Button type="submit" variant="primary" disabled={saving}>
                                        {saving ? "Saving..." : "Save changes"}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Danger zone */}
                        {/* <Card className="shadow-sm border-0 mt-3">
                            <Card.Header className="bg-danger text-white">
                                Danger zone
                            </Card.Header>
                            <Card.Body>
                                <p className="text-muted mb-2">
                                    Deleting your account will remove your profile, friend list and messages.
                                </p>
                                <Button
                                    variant="outline-danger"
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={deleting}
                                >
                                    Delete my account
                                </Button>
                            </Card.Body>
                        </Card> */}
                    </Col>

                    {/* Friends & blocked list */}
                    <Col md={6}>
                        <Card className="shadow-sm border-0 mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Friends</span>
                                <Badge bg="primary">{friends.length}</Badge>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {friends.length === 0 && (
                                    <ListGroup.Item className="text-muted">
                                        No friends yet.
                                    </ListGroup.Item>
                                )}
                                {friends.map((f) => (
                                    <ListGroup.Item
                                        key={f._id}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <div>
                                            <div className="fw-semibold">
                                                {f.username || f.email}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: 12 }}>
                                                {f.email}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => removeFriend(f._id)}
                                            >
                                                Remove
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-warning"
                                                onClick={() => blockUser(f._id)}
                                            >
                                                Block
                                            </Button>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>

                        <Card className="shadow-sm border-0">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Blocked users</span>
                                <Badge bg="secondary">{blocked.length}</Badge>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {blocked.length === 0 && (
                                    <ListGroup.Item className="text-muted">
                                        You have not blocked anyone.
                                    </ListGroup.Item>
                                )}
                                {blocked.map((u) => (
                                    <ListGroup.Item
                                        key={u._id}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <div>
                                            <div className="fw-semibold">
                                                {u.username || u.email}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: 12 }}>
                                                {u.email}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => unblockUser(u._id)}
                                        >
                                            Unblock
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>

                {/* Delete account confirmation */}
                <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete account</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        This action is permanent. All your chats and friendships will be removed.
                        Are you sure you want to continue?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        {/* <Button
                            variant="danger"
                            onClick={deleteAccount}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Yes, delete my account"}
                        </Button> */}
                    </Modal.Footer>
                </Modal>
            </Container>
        </>
    );
}
