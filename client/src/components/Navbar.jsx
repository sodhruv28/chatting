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
    <nav className="sticky top-0 z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {me && (
            <Link to="/me" className="group">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-transform group-active:scale-95">
                {me.username[0].toUpperCase()}
              </div>
            </Link>
          )}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-xl font-black text-primary tracking-tighter">
            INDIGO
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <i className="bi bi-box-arrow-right text-2xl"></i>
          </button>
        </div>
      </div>
    </nav>
  )
}
