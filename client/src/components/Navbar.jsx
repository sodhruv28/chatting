import { useState, useEffect } from "react"
import api from "../api/axios"
import { useNavigate, Link } from "react-router-dom"
import { disconnectSocket } from "../socket"

export default function Navbar() {
  const [me, setMe] = useState(null)
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const currentUserId = user._id;
  const navigate = useNavigate()

  useEffect(() => {
    if (!token || !currentUserId) return
    const loadMe = async () => {
      try {
        const res = await api.get(`/users/${currentUserId}`)
        setMe(res.data)
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    loadMe()
  }, [token, currentUserId])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    disconnectSocket()
    navigate("/login")
  }

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-[var(--border-color)] py-5">
      <div className="container mx-auto px-4 max-w-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          {me && (
            <Link to="/me" className="group">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold border border-primary/20 transition-all group-hover:scale-105 active:scale-95">
                {me.username[0].toUpperCase()}
              </div>
            </Link>
          )}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-xl font-bold text-text-main tracking-tight flex items-center gap-1">
            <span>Indigo</span>
            <span className="text-primary font-normal">Connect</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
          >
            <i className="bi bi-box-arrow-right text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  )
}
