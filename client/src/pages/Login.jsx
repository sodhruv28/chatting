import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import axios from "axios"
import { auth } from "../firebase"
import { connectSocket } from "../socket";
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await userCred.user.getIdToken();

      const res = await axios.post(
        ${import.meta.env.VITE_API_URL || "http://localhost:5000"})}
                    >
                      Create Account
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
