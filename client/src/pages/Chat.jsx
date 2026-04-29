import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios"
import socket from "../socket"
import Navbar from "../components/Navbar"

export default function Chat() {
  const { friendId } = useParams()
  const [friend, setFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [isOnline, setIsOnline] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, mRes] = await Promise.all([
          api.get(`/users/${friendId}`),
          api.get(`/chats/history/${friendId}`)
        ])
        setFriend(fRes.data)
        setMessages(mRes.data.map(m => ({
          id: m._id,
          text: m.message,
          self: m.sender === user._id,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: m.isRead
        })))
        setIsOnline(fRes.data.isOnline)
      } catch (err) {
        console.error("Failed to fetch chat data:", err)
      }
    }
    fetchData()

    socket.emit("chat:join", { friendId })

    const onMessage = (msg) => {
      if (msg.sender === friendId) {
        setMessages(prev => [...prev, {
          id: msg._id,
          text: msg.message,
          self: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        }])
        socket.emit("chat:read-all", { friendId })
      }
    }

    const onReadStatus = ({ from }) => {
      if (from === friendId) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    }

    const onUserStatus = ({ userId, isOnline }) => {
      if (userId === friendId) setIsOnline(isOnline)
    }

    const onTyping = ({ from, isTyping }) => {
      if (from === friendId) setOtherTyping(isTyping)
    }

    socket.on("chat:receive-message", onMessage)
    socket.on("chat:read-status", onReadStatus)
    socket.on("user:status", onUserStatus)
    socket.on("chat:typing", onTyping)

    return () => {
      socket.emit("chat:leave", { friendId })
      socket.off("chat:receive-message", onMessage)
      socket.off("chat:read-status", onReadStatus)
      socket.off("user:status", onUserStatus)
      socket.off("chat:typing", onTyping)
    }
  }, [friendId, user._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherTyping])

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      socket.emit("chat:typing", { to: friendId, isTyping: true })
    }
    
    if (window.typingTimeout) clearTimeout(window.typingTimeout);
    
    window.typingTimeout = setTimeout(() => {
        setIsTyping(false)
        socket.emit("chat:typing", { to: friendId, isTyping: false })
    }, 3000)
  }

  const sendMessage = (e) => {
    e?.preventDefault()
    if (!message.trim()) return
    
    const tempId = Date.now().toString()
    const newMsg = {
      id: tempId,
      text: message,
      self: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    }

    setMessages(prev => [...prev, newMsg])
    socket.emit("chat:send-message", { receiver: friendId, message: message.trim() })
    setMessage("")
    setIsTyping(false)
    socket.emit("chat:typing", { to: friendId, isTyping: false })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <i className="bi bi-arrow-left text-xl"></i>
          </button>
          
          <div className="relative">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white font-bold shadow-sm">
              {friend?.username?.[0]?.toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>

          <div>
            <h2 className="font-bold text-text-main leading-tight">{friend?.username}</h2>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              {otherTyping ? (
                <span className="text-primary animate-pulse italic">typing...</span>
              ) : (
                <>
                   <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                   {isOnline ? 'Online now' : 'Offline'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <i className="bi bi-camera-video fs-5"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <i className="bi bi-telephone fs-5"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <i className="bi bi-three-dots-vertical fs-5"></i>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <div className="text-center my-4">
          <span className="px-4 py-1.5 bg-surface border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Today</span>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[75%] group`}>
              <div className={`px-4 py-3 shadow-sm ${
                m.self 
                ? "bg-primary text-white rounded-[24px] rounded-br-none" 
                : "bg-surface text-text-main border border-slate-50 dark:border-slate-800 rounded-[24px] rounded-bl-none"
              }`}>
                <p className="text-[15px] leading-relaxed">{m.text}</p>
                <div className={`flex items-center gap-1 mt-1.5 ${m.self ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] font-medium tracking-tighter ${m.self ? "text-white/60" : "text-slate-400"}`}>
                    {m.time}
                  </span>
                  {m.self && (
                    <i className={`bi bi-check2-all text-[14px] ${m.isRead ? "text-indigo-200" : "text-white/40"}`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {otherTyping && (
          <div className="flex justify-start">
             <div className="bg-surface border border-slate-50 dark:border-slate-800 px-4 py-3 rounded-[24px] rounded-bl-none shadow-sm flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <button type="button" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <i className="bi bi-mic text-xl"></i>
          </button>
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all pr-12 dark:text-white"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
              <i className="bi bi-paperclip text-xl"></i>
            </button>
          </div>
          <button 
            type="submit"
            className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  )
}
