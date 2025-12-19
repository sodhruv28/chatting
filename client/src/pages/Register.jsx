"use client"

import { useState } from "react"
import axios from "axios"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap"

export default function Register() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseToken = await userCred.user.getIdToken()

            const res = await axios.post("http://localhost:5000/api/auth/firebase-login", { firebaseToken })

            localStorage.setItem("jwt", res.data.token)
            navigate("/login")
        } catch (err) {
            console.error(err)
            setError(err.message || "Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={5}>
                        <Card className="shadow-lg border-0 fade-in">
                            <Card.Body className="p-5">
                                <div className="text-center mb-4">
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        }}
                                    >
                                        <i className="bi bi-person-plus-fill text-white fs-1"></i>
                                    </div>
                                    <h2 className="fw-bold mb-2">Create Account</h2>
                                    <p className="text-muted">Join us and start chatting with friends</p>
                                </div>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleRegister}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            size="lg"
                                            autoComplete="email"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="At least 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            size="lg"
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <Form.Text className="text-muted">Password must be at least 6 characters long</Form.Text>
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100 py-3 fw-semibold"
                                        size="lg"
                                        disabled={loading}
                                    >
                                        {loading ? "Creating account..." : "Create Account"}
                                    </Button>
                                </Form>

                                <div className="text-center mt-4">
                                    <p className="text-muted mb-0">
                                        Already have an account?{" "}
                                        <Button
                                            variant="link"
                                            className="p-0 text-decoration-none fw-semibold"
                                            onClick={() => navigate("/login")}
                                        >
                                            Sign In
                                        </Button>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
