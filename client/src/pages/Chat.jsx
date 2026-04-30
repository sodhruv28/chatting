import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/axios"
import socket from "../socket"
import { toast } from "sonner"
import VideoCall from "../components/VideoCall"

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
  const videoCallRef = useRef(null)
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
        toast.error("Connection issue: Failed to load chat history.");
      }
    }
    fetchData()

    socket.emit("chat:join", { friendId })
    socket.emit("chat:read-all", { friendId })

    const onMessage = (msg) => {
      if (String(msg.sender) === String(friendId)) {
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
    <div className="flex flex-col h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-surface/80 backdrop-blur-xl border-b border-[var(--border-color)] z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full">
            <i className="bi bi-chevron-left text-xl"></i>
          </button>
          <div>
            <h2 className="text-base font-semibold text-text-main tracking-tight">{friend?.username}</h2>
            <p className="text-[11px] font-medium flex items-center gap-1.5 text-text-muted">
              {otherTyping ? (
                 <span className="text-primary animate-pulse">typing...</span>
              ) : (
                <>
                   <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-[#dbd9e1]'}`}></span>
                   {isOnline ? 'Online now' : 'Offline'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => videoCallRef.current?.startCall()} className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full">
            <i className="bi bi-camera-video text-lg"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full">
            <i className="bi bi-telephone text-lg"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full">
            <i className="bi bi-info-circle text-lg"></i>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-hide">
        <div className="text-center my-6">
          <span className="px-4 py-1.5 bg-[#efedf5] dark:bg-[#303036] rounded-full text-[10px] font-bold text-text-muted uppercase tracking-wider">Today</span>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[75%] w-fit px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${m.self ? "bg-primary text-white rounded-[24px] rounded-br-sm" : "bg-surface dark:bg-[#303036] border border-[var(--border-color)] text-text-main rounded-[24px] rounded-bl-sm"}`}>
                <p className="break-words">{m.text}</p>
                <div className={`flex items-center gap-1.5 mt-1.5 ${m.self ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] font-bold ${m.self ? "text-white/70" : "text-text-muted/70"}`}>
                    {m.time}
                  </span>
                  {m.self && (
                    <i className={`bi bi-check2-all text-[14px] ${m.isRead ? "text-[#a5b4fc]" : "text-white/40"}`} />
                  )}
                </div>
            </div>
          </div>
        ))}
        {otherTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
             <div className="bg-[#efedf5] dark:bg-[#303036] px-5 py-3 rounded-[20px] rounded-bl-[4px] shadow-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-text-muted/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-text-muted/40 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-text-muted/40 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 bg-surface border-t border-[var(--border-color)]">
        <form onSubmit={sendMessage} className="flex items-center gap-3 max-w-2xl mx-auto">
          <button type="button" className="w-11 h-11 flex items-center justify-center text-text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-full">
            <i className="bi bi-plus-lg text-xl"></i>
          </button>
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="Message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              className="w-full px-6 py-3.5 bg-[#efedf5] dark:bg-[#303036] border-none rounded-full focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12 text-text-main placeholder:text-text-muted/50"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-primary transition-colors">
              <i className="bi bi-emoji-smile text-xl"></i>
            </button>
          </div>
          <button 
            type="submit"
            disabled={!message.trim()}
            className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
          >
            <i className="bi bi-send-fill text-lg"></i>
          </button>
        </form>
      </div>

      {/* Video Call Component at root to avoid stacking context issues */}
      <VideoCall ref={videoCallRef} friendId={friendId} friend={friend} />
    </div>
  )
}
