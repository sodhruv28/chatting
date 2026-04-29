
import { RiVipCrown2Line } from "react-icons/ri";
import { RxDropdownMenu } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { BsChatDots } from "react-icons/bs";
import { MdOutlineVideoCameraFront } from "react-icons/md";
import { Navbar, Container, Nav, Button, Dropdown, DropdownButton, ButtonGroup } from "react-bootstrap"

export default function AppNavbar() {
    const navigate = useNavigate();

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
                </Navbar.Brand>
                <Nav className="ms-auto align-items-center gap-3">
                    <Button onClick={() => navigate("/")}>
                        <MdOutlineVideoCameraFront />
                    </Button>

                    <Button
                        variant="white"
                        size="sm"
                        onClick={() => navigate("/chats")}
                    >
                        <BsChatDots />
                    </Button>
                </Nav>
                <Navbar.Toggle aria-controls="navbar-nav" />

                <Navbar.Collapse id="navbar-nav">

                    <Nav className="ms-auto align-items-center gap-3">
                        <Button
                            variant="warning"
                            size="sm"
                            onClick={() => navigate("/subscribe")}
                        >
                            <RiVipCrown2Line />
                        </Button>
                        <Dropdown as="span">
                            <Dropdown.Toggle
                                variant="light"
                                size="sm"
                                className="rounded-circle border-0 p-2 shadow-sm"
                                id="main-dropdown"
                                style={{ width: "42px", height: "42px" }}
                            >
                                <RxDropdownMenu size={20} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow-lg mt-2" style={{ minWidth: "200px" }}>
                                <Dropdown.Item onClick={() => navigate("/")}>
                                    <i className="bi bi-house-door me-2"></i>Home
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate("/chats")}>
                                    <i className="bi bi-chat-dots me-2"></i>Chats
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate("/me")}>
                                    <i className="bi bi-person me-2"></i>Profile
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => navigate("/login")} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>Log in
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button size="sm" onClick={() => navigate("/login")}>
                            sing In
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}
