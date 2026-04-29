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

            const res = await axios.post(${import.meta.env.VITE_API_URL || "http://localhost:5000"})}
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
