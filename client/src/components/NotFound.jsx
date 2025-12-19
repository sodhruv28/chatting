"use client"

import { useNavigate } from "react-router-dom"
import { Container, Card, Button } from "react-bootstrap"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <Container>
        <Card className="text-center shadow-lg border-0 p-5 fade-in" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <Card.Body>
            <div
              className="display-1 fw-bold mb-3"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              404
            </div>
            <h2 className="fw-bold mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">The page you are looking for doesn't exist or may have been moved.</p>

            <div className="d-flex gap-3 justify-content-center">
              <Button variant="primary" size="lg" onClick={() => navigate("/")}>
                <i className="bi bi-house me-2"></i>
                Go Home
              </Button>
              <Button variant="outline-secondary" size="lg" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>
                Go Back
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
