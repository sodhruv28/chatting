"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import socket from "../socket"
import { Navbar, Container, Nav, Button } from "react-bootstrap"

export default function AppNavbar() {
  const [me, setMe] = useState(null)
  const jwt = localStorage.getItem("jwt")
  const currentUserId = localStorage.getItem("userId")
  const navigate = useNavigate()

  const authHeader = {
    headers: { Authorization: `Bearer ${jwt}` },
  }

  useEffect(() => {
    if (!jwt || !currentUserId) return

    const loadMe = async () => {
      const res = await axios.get(`http://localhost:5000/api/users/${currentUserId}`, authHeader)
      setMe(res.data)
    }
    loadMe().catch(console.error)
  }, [jwt, currentUserId])

  const logout = () => {
    localStorage.removeItem("jwt")
    localStorage.removeItem("userId")
    localStorage.removeItem("userEmail")
    socket.disconnect()
    navigate("/login")
  }

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm border-bottom">
      <Container fluid>
        <Navbar.Brand
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
          className="fw-bold d-flex align-items-center gap-2"
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-circle text-white"
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <i className="bi bi-chat-dots-fill"></i>
          </div>
          <span style={{ color: "#4f46e5" }}>ChatApp</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center gap-3">
            {me && (

              <a href="/me">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "35px",
                    height: "35px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {(me.username || me.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="fw-semibold small">{me.username || "User"}</div>
                  <div className="text-muted" style={{ fontSize: "0.7rem", maxWidth: "150px" }}>
                    {me.email}
                  </div>
                </div>
              </div>
              </a>
            )}
            <Button variant="outline-danger" size="sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
