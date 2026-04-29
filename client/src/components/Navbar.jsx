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
          <Link to="/" className="flex items-center gap-2 group transition-all">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-600 rounded-[12px] flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-all duration-300">
              <span className="text-white font-black text-xl italic tracking-tighter">I</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-lg font-black text-text-main tracking-tight">Indigo</span>
                <span className="text-lg font-bold text-primary tracking-tight">Connect</span>
              </div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60">Messenger</span>
            </div>
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
