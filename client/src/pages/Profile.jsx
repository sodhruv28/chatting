import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Modal } from "react-bootstrap";
import {
    getAuth,
    deleteUser,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";


export default function Profile() {
    const jwt = localStorage.getItem("jwt");
    const authHeader = { headers: { Authorization: `Bearer ${jwt}` } };

    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [blocked, setBlocked] = useState([]);
    const [saving, setSaving] = useState(false);
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
                axios.get(${import.meta.env.VITE_API_URL || "http://localhost:5000"}
                            onClick={deleteAccount}
                        >
                            Yes, delete my account
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </>
    );
}
