import { useEffect } from "react"
import { connectSocket } from "./socket"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import UserReg from "./pages/Register.jsx"
import Home from "./pages/Home.jsx"
import UserLogin from "./pages/Login.jsx"
import NotFound from "./components/NotFound.jsx"
import Chat from "./pages/Chat.jsx"
import Me from "./pages/Profile.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"

import { Toaster } from "sonner"

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      connectSocket(token)
    }

    // Theme initialization
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<UserReg />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <Me />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:friendId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
