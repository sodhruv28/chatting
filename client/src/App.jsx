"use client"

import "bootstrap/dist/css/bootstrap.min.css"
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
import "./styles/modern.css"

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("jwt")
    if (token) {
      connectSocket()
    }
  }, [])

  return (
    <BrowserRouter>
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
