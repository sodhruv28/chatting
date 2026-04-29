import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import socket from "../socket"
import Navbar from "../components/Navbar"
import { toast } from "sonner"

export default function Home() {
    const [friends, setFriends] = useState([])
    const [me, setMe] = useState(null)
    const [receivedRequests, setReceivedRequests] = useState([])
    const [sentRequests, setSentRequests] = useState([])
    const [typingUsers, setTypingUsers] = useState({})
    const token = localStorage.getItem("token");
    
    const [activeTab, setActiveTab] = useState("chats")
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")
    const [requestSegment, setRequestSegment] = useState("received")
    const [friendSearch, setFriendSearch] = useState("")
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedUser, setSearchedUser] = useState(null);
    const [searchError, setSearchError] = useState("");

    const navigate = useNavigate()

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        const fetchData = async () => {
            try {
                const [fRes, rRes, sRes, meRes] = await Promise.all([
                    api.get("/friends"),
                    api.get("/friends/requests"),
                    api.get("/friends/requests/sent"),
                    api.get("/users/me")
                ]);
                setFriends(fRes.data);
                setReceivedRequests(rRes.data);
                setSentRequests(sRes.data);
                setMe(meRes.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, [token, navigate]);

    useEffect(() => {
        const onUserStatus = ({ userId, isOnline }) => {
            setFriends(prev => prev.map(f => 
                String(f._id) === String(userId) ? { ...f, isOnline } : f
            ));
        };
        socket.on("user:status", onUserStatus);
        return () => socket.off("user:status", onUserStatus);
    }, []);

    useEffect(() => {
        const onTyping = ({ from, isTyping }) => {
            setTypingUsers(prev => isTyping ? { ...prev, [from]: true } : { ...prev, [from]: false });
        };
        const onFriendRequest = (req) => {
            setReceivedRequests(prev => [req, ...prev]);
        };
        const onFriendAccepted = (payload) => {
            const friend = String(payload.sender._id) === String(me?._id) ? payload.receiver : payload.sender;
            setFriends(prev => {
                const exists = prev.some(f => String(f._id) === String(friend._id));
                return exists ? prev : [friend, ...prev];
            });
            setSentRequests(prev => prev.filter(r => String(r.receiver) !== String(friend._id) && String(r.receiver._id) !== String(friend._id)));
        };
        const onNotification = (payload) => {
            setFriends(prev => prev.map(f => {
                if (String(f._id) === String(payload.sender)) {
                    return { ...f, lastMessageAt: payload.createdAt, unread: true };
                }
                return f;
            }));
        };

        socket.on("chat:typing", onTyping);
        socket.on("friend-request:received", onFriendRequest);
        socket.on("friend-request:accepted", onFriendAccepted);
        socket.on("chat:notification", onNotification);

        return () => {
            socket.off("chat:typing", onTyping);
            socket.off("friend-request:received", onFriendRequest);
            socket.off("friend-request:accepted", onFriendAccepted);
            socket.off("chat:notification", onNotification);
        };
    }, [me?._id]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError("");
        setSearchedUser(null);
        if (!searchQuery.trim()) return;
        try {
            const res = await api.get(`/users/search?q=${searchQuery}`);
            setSearchedUser(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setSearchError("User not found");
            } else {
                setSearchError("Search failed");
            }
        }
    };

    const sendFriendRequest = async () => {
        try {
            const res = await api.post("/friends/request", { receiverId: searchedUser._id });
            setSentRequests(prev => [...prev, res.data.request]);
            setSearchedUser(null);
            setSearchQuery("");
            toast.success("Friend request sent successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send request");
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const res = await api.post("/friends/accept", { requestId });
            setReceivedRequests(prev => prev.filter(r => r._id !== requestId));
            // res.data should contain the new friend info
            const newFriend = res.data.friend || friends.find(f => f._id === res.data.friendId);
            if (newFriend) setFriends(prev => [...prev, newFriend]);
            else {
                // Refresh friends if data missing
                const fRes = await api.get("/friends");
                setFriends(fRes.data);
            }
            toast.success("Friend request accepted!");
        } catch {
            toast.error("Failed to accept request");
        }
    };

    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.reload();
    }

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        const newTheme = isDark ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }

    const filteredFriends = friends.filter(f => 
        f.username.toLowerCase().includes(friendSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8 pb-32 max-w-2xl">
                {activeTab === "chats" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-semibold text-text-main tracking-tight">Messages</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                                <i className="bi bi-search text-xl"></i>
                            </button>
                        </div>

                        <div className="relative mb-8">
                            <i className="bi bi-search absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/60"></i>
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                className="w-full pl-13 pr-5 py-4 bg-surface border border-[var(--border-color)] rounded-2xl shadow-[var(--card-shadow)] focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-text-main"
                            />
                        </div>

                        <div className="space-y-2">
                             {filteredFriends.map((friend) => (
                                <div
                                    key={friend._id}
                                    onClick={() => {
                                        setFriends(prev => prev.map(f => f._id === friend._id ? { ...f, unread: false } : f));
                                        navigate(`/chat/${friend._id}`);
                                    }}
                                    className="chat-item animate-in fade-in slide-in-from-right-2 duration-300"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 bg-[#efedf5] dark:bg-[#303036] text-primary font-semibold text-xl rounded-2xl flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                                            {friend.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div 
                                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-surface rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-[#dbd9e1]'}`}
                                        />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="font-semibold text-text-main truncate">{friend.username}</h3>
                                            <span className="text-[11px] text-text-muted font-medium tracking-tight">
                                                {friend.lastMessageAt ? new Date(friend.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[13px] text-text-muted truncate max-w-[200px]">
                                                {typingUsers[friend._id] ? (
                                                    <span className="text-primary font-medium animate-pulse">typing...</span>
                                                ) : (
                                                    "Start a conversation..."
                                                )}
                                            </p>
                                            {friend.unread && (
                                                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in duration-300">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredFriends.length === 0 && (
                                <div className="text-center py-24">
                                    <div className="w-20 h-20 bg-[#efedf5] dark:bg-[#303036] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <i className="bi bi-chat-dots text-3xl text-[#dbd9e1]"></i>
                                    </div>
                                    <p className="text-text-muted font-medium">No conversations found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "calls" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-text-main tracking-tight">Calls</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                                <i className="bi bi-telephone-plus text-xl"></i>
                            </button>
                        </div>
                        <div className="text-center py-32">
                            <div className="w-24 h-24 bg-[#efedf5] dark:bg-[#303036] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--border-color)]">
                                <i className="bi bi-telephone-x text-4xl text-[#dbd9e1]"></i>
                            </div>
                            <p className="text-text-muted font-bold italic opacity-60 tracking-tight text-lg">No recent calls</p>
                        </div>
                    </div>
                )}

                {activeTab === "people" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-text-main tracking-tight">People</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                                <i className="bi bi-person-plus text-xl"></i>
                            </button>
                        </div>
 
                        <div className="mb-8">
                            <div className="flex bg-[#efedf5] dark:bg-[#303036] p-1 rounded-2xl border border-[var(--border-color)]">
                                <button 
                                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${requestSegment === 'received' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                                    onClick={() => setRequestSegment("received")}
                                >
                                    Received
                                </button>
                                <button 
                                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${requestSegment === 'sent' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                                    onClick={() => setRequestSegment("sent")}
                                >
                                    Sent
                                </button>
                            </div>
                        </div>
 
                        <div className="grid gap-4">
                            {requestSegment === 'received' ? (
                                receivedRequests.map(req => (
                                    <div key={req._id} className="bg-surface p-6 rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-primary text-white text-xl font-black rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
                                                {req.sender?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-text-main text-lg leading-tight">{req.sender?.username || "Unknown User"}</h4>
                                                <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Wants to be your friend</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleAcceptRequest(req._id)}
                                                className="flex-1 py-4 bg-primary text-white text-[13px] font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
                                            >
                                                Accept
                                            </button>
                                            <button className="flex-1 py-4 bg-background text-text-main text-[13px] font-black rounded-2xl border border-[var(--border-color)] hover:bg-[#efedf5] dark:hover:bg-[#303036] transition-all active:scale-[0.98]">
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                sentRequests.map(req => (
                                    <div key={req._id} className="bg-surface p-6 rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-[#efedf5] dark:bg-[#303036] text-text-muted text-xl font-black rounded-2xl flex items-center justify-center">
                                                {req.receiver?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-text-main text-lg leading-tight">{req.receiver?.username || "Unknown User"}</h4>
                                                <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Pending response</p>
                                            </div>
                                        </div>
                                        <button className="w-full py-4 bg-background text-text-muted text-[13px] font-black rounded-2xl border border-dashed border-[var(--border-color)] cursor-not-allowed">
                                            Cancel Request
                                        </button>
                                    </div>
                                ))
                            )}
 
                            {((requestSegment === 'received' && receivedRequests.length === 0) || 
                              (requestSegment === 'sent' && sentRequests.length === 0)) && (
                                <div className="text-center py-20 text-text-muted font-bold italic opacity-40">
                                    <i className="bi bi-people text-4xl block mb-2"></i>
                                    No {requestSegment} requests
                                </div>
                            )}
                        </div>
 
                        <div className="mt-14 pt-10 border-t border-[var(--border-color)]">
                            <h3 className="text-2xl font-black text-text-main mb-6 tracking-tight">Find New People</h3>
                            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                                <div className="relative flex-grow">
                                    <i className="bi bi-person absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/60"></i>
                                    <input
                                        type="text"
                                        placeholder="Username or email"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-13 pr-5 py-5 bg-surface border border-[var(--border-color)] rounded-[28px] shadow-[var(--card-shadow)] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-text-main font-medium"
                                    />
                                </div>
                                <button type="submit" className="px-10 py-5 bg-primary text-white font-black rounded-[28px] hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                                    Search
                                </button>
                            </form>
                            
                            {searchError && (
                                <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-3xl border border-red-100 dark:border-red-900/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <i className="bi bi-exclamation-circle text-lg"></i>
                                    {searchError}
                                </div>
                            )}
                            
                            {searchedUser && (
                                <div className="bg-surface p-6 rounded-[32px] border border-primary/20 shadow-[var(--card-shadow)] flex items-center justify-between animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-primary/10 text-primary text-2xl font-black rounded-[24px] flex items-center justify-center border-2 border-primary/5">
                                            {searchedUser.username[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-text-main text-lg leading-tight">{searchedUser.username}</p>
                                            <p className="text-[13px] text-text-muted font-medium">{searchedUser.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={sendFriendRequest}
                                        className="px-8 py-3 bg-primary text-white text-[13px] font-black rounded-2xl hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Add Friend
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-text-main tracking-tight">Settings</h1>
                        </div>
 
                        {/* Profile Section */}
                        <div className="bg-surface p-6 rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] mb-8 flex items-center gap-5 transition-all">
                            <div className="w-20 h-20 bg-primary text-white text-3xl font-black rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/20 border-4 border-white/10">
                                {me?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-grow">
                                <h2 className="text-2xl font-black text-text-main leading-tight tracking-tight">{me?.username}</h2>
                                <p className="text-text-muted font-medium text-sm">{me?.email}</p>
                                <button onClick={() => navigate('/me')} className="mt-2 text-[13px] font-bold text-primary hover:opacity-80 flex items-center gap-1.5 transition-all">
                                    Edit Profile <i className="bi bi-chevron-right text-[10px]"></i>
                                </button>
                            </div>
                        </div>
 
                        {/* Settings Options */}
                        <div className="space-y-3">
                            <div className="bg-surface p-5 rounded-[28px] border border-[var(--border-color)] flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl">
                                        <i className="bi bi-bell-fill"></i>
                                    </div>
                                    <span className="font-bold text-text-main">Notifications</span>
                                </div>
                                <div className="w-12 h-7 bg-[#dbd9e1] dark:bg-[#303036] rounded-full relative p-1 transition-colors">
                                    <div className="w-5 h-5 bg-primary rounded-full shadow-md translate-x-5"></div>
                                </div>
                            </div>
 
                            <div className="bg-surface p-5 rounded-[28px] border border-[var(--border-color)] flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-100/50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center text-xl">
                                        <i className="bi bi-shield-lock-fill"></i>
                                    </div>
                                    <span className="font-bold text-text-main">Privacy & Security</span>
                                </div>
                                <i className="bi bi-chevron-right text-text-muted/40 text-sm"></i>
                            </div>
 
                            <div 
                                onClick={toggleTheme}
                                className="bg-surface p-5 rounded-[28px] border border-[var(--border-color)] flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-teal-100/50 dark:bg-teal-900/30 text-teal-500 rounded-2xl flex items-center justify-center text-xl">
                                        <i className={`bi bi-${theme === 'light' ? 'sun' : 'moon-stars'}-fill`}></i>
                                    </div>
                                    <span className="font-bold text-text-main">Appearance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{theme}</span>
                                    <i className="bi bi-chevron-right text-text-muted/40 text-[10px]"></i>
                                </div>
                            </div>
 
                            <button 
                                onClick={logout}
                                className="w-full mt-10 p-5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-[28px] flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white shadow-lg shadow-red-500/5 transition-all active:scale-[0.98]"
                            >
                                <i className="bi bi-box-arrow-right text-xl"></i>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-[var(--border-color)] px-6 py-5 flex justify-around items-center z-50 rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                <button 
                    onClick={() => setActiveTab("chats")}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'chats' ? 'text-primary scale-110' : 'text-text-muted hover:text-text-main'}`}
                >
                    <i className={`bi bi-chat-${activeTab === 'chats' ? 'fill' : 'dots'} text-2xl`}></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Chats</span>
                </button>
                <button 
                    onClick={() => setActiveTab("people")}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'people' ? 'text-primary scale-110' : 'text-text-muted hover:text-text-main'}`}
                >
                    <i className={`bi bi-people${activeTab === 'people' ? '-fill' : ''} text-2xl`}></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">People</span>
                </button>
                <button 
                    onClick={() => setActiveTab("settings")}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-primary scale-110' : 'text-text-muted hover:text-text-main'}`}
                >
                    <i className={`bi bi-gear${activeTab === 'settings' ? '-fill' : ''} text-2xl`}></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
                </button>
            </nav>
        </div>
    )
}