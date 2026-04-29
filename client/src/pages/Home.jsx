import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import socket from "../socket"
import Navbar from "../components/Navbar"

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
            alert("Request sent!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send request");
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
        } catch (err) {
            alert("Failed to accept request");
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
            
            <main className="container mx-auto px-4 py-8 pb-32">
                {activeTab === "chats" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Messages</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                <i className="bi bi-search text-xl"></i>
                            </button>
                        </div>

                        <div className="relative mb-8">
                            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-surface border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-text-main"
                            />
                        </div>

                        <div className="space-y-1">
                             {filteredFriends.map((friend) => (
                                <div
                                    key={friend._id}
                                    onClick={() => {
                                        setFriends(prev => prev.map(f => f._id === friend._id ? { ...f, unread: false } : f));
                                        navigate(`/chat/${friend._id}`);
                                    }}
                                    className="group flex items-center gap-4 p-4 rounded-3xl hover:bg-surface hover:shadow-md dark:hover:bg-slate-800/30 transition-all cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-primary font-bold text-xl rounded-2xl flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-slate-800">
                                            {friend.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div 
                                            className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-background rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}
                                        />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{friend.username}</h3>
                                            <span className="text-xs text-slate-400 font-medium tracking-tighter">
                                                {friend.lastMessageAt ? new Date(friend.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                                {typingUsers[friend._id] ? (
                                                    <span className="text-primary font-medium animate-pulse">typing...</span>
                                                ) : (
                                                    "Start a conversation..."
                                                )}
                                            </p>
                                            {friend.unread && (
                                                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in duration-300">
                                                    1
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredFriends.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="bi bi-chat-dots text-3xl text-slate-300"></i>
                                    </div>
                                    <p className="text-slate-400 font-medium">No conversations found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "calls" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Calls</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                <i className="bi bi-telephone-plus text-xl"></i>
                            </button>
                        </div>
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="bi bi-telephone-x text-3xl text-slate-300"></i>
                            </div>
                            <p className="text-slate-400 font-medium">No recent calls</p>
                        </div>
                    </div>
                )}

                {activeTab === "people" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-text-main tracking-tight">People</h1>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                <i className="bi bi-person-plus text-xl"></i>
                            </button>
                        </div>

                        <div className="mb-8">
                            <div className="flex bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <button 
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${requestSegment === 'received' ? 'bg-surface text-primary shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                                    onClick={() => setRequestSegment("received")}
                                >
                                    Received
                                </button>
                                <button 
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${requestSegment === 'sent' ? 'bg-surface text-primary shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                                    onClick={() => setRequestSegment("sent")}
                                >
                                    Sent
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {requestSegment === 'received' ? (
                                receivedRequests.map(req => (
                                    <div key={req._id} className="bg-surface p-5 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center">
                                                {req.sender?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main">{req.sender?.username || "Unknown User"}</h4>
                                                <p className="text-xs text-slate-400 font-medium">14 mutual friends</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAcceptRequest(req._id)}
                                                className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/10"
                                            >
                                                Accept
                                            </button>
                                            <button className="flex-1 py-3 bg-background text-text-main text-sm font-bold rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                sentRequests.map(req => (
                                    <div key={req._id} className="bg-surface p-5 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-primary font-bold rounded-2xl flex items-center justify-center">
                                                {req.receiver?.username?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main">{req.receiver?.username || "Unknown User"}</h4>
                                                <p className="text-xs text-slate-400 font-medium">Pending response</p>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 text-sm font-bold rounded-2xl border border-slate-100 dark:border-slate-800 cursor-not-allowed">
                                            Cancel Request
                                        </button>
                                    </div>
                                ))
                            )}

                            {((requestSegment === 'received' && receivedRequests.length === 0) || 
                              (requestSegment === 'sent' && sentRequests.length === 0)) && (
                                <div className="text-center py-10 text-slate-400 font-medium">
                                    No {requestSegment} requests
                                </div>
                            )}
                        </div>

                        <div className="mt-12">
                            <h3 className="text-xl font-black text-text-main mb-6">Find New Friends</h3>
                            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="Username or email"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-grow px-5 py-4 bg-surface border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-text-main"
                                />
                                <button type="submit" className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-primary/20 transition-all">
                                    Search
                                </button>
                            </form>
                            
                            {searchError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {searchError}
                                </div>
                            )}
                            
                            {searchedUser && (
                                <div className="bg-surface p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-primary font-bold rounded-2xl flex items-center justify-center">
                                            {searchedUser.username[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-main text-sm">{searchedUser.username}</p>
                                            <p className="text-xs text-slate-400">{searchedUser.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={sendFriendRequest}
                                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
                        </div>

                        {/* Profile Section */}
                        <div className="bg-surface p-6 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 mb-8 flex items-center gap-4">
                            <div className="w-20 h-20 bg-primary text-white text-3xl font-black rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
                                {me?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">{me?.username}</h2>
                                <p className="text-slate-400 font-medium">{me?.email}</p>
                                <button onClick={() => navigate('/me')} className="mt-2 text-sm font-bold text-primary hover:underline flex items-center gap-1 text-left">
                                    Edit Profile <i className="bi bi-chevron-right text-[10px]"></i>
                                </button>
                            </div>
                        </div>

                        {/* Settings Options */}
                        <div className="space-y-3">
                            <div className="bg-surface p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-2xl flex items-center justify-center">
                                        <i className="bi bi-bell-fill"></i>
                                    </div>
                                    <span className="font-bold text-text-main">Notifications</span>
                                </div>
                                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative p-1 transition-colors">
                                    <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${theme === 'dark' ? 'translate-x-6 bg-primary' : 'bg-white'}`}></div>
                                </div>
                            </div>

                            <div className="bg-surface p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center">
                                        <i className="bi bi-shield-lock-fill"></i>
                                    </div>
                                    <span className="font-bold text-text-main">Privacy & Security</span>
                                </div>
                                <i className="bi bi-chevron-right text-slate-300"></i>
                            </div>

                            <div 
                                onClick={toggleTheme}
                                className="bg-surface p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-teal-50 dark:bg-teal-900/30 text-teal-500 rounded-2xl flex items-center justify-center">
                                        <i className={`bi bi-${theme === 'light' ? 'sun' : 'moon-stars'}-fill`}></i>
                                    </div>
                                    <span className="font-bold text-text-main">Appearance</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{theme}</span>
                            </div>

                            <div className="bg-surface p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                        <i className="bi bi-question-circle-fill"></i>
                                    </div>
                                    <span className="font-bold text-text-main">Help & Support</span>
                                </div>
                                <i className="bi bi-chevron-right text-slate-300"></i>
                            </div>

                            <button 
                                onClick={logout}
                                className="w-full mt-8 p-5 bg-red-50 text-red-600 font-black rounded-[24px] border border-red-100 flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                <i className="bi bi-box-arrow-right text-xl"></i>
                                Logout Account
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-around items-center z-50 rounded-t-[32px] shadow-2xl shadow-slate-900/10">
                <button 
                    onClick={() => setActiveTab("chats")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chats' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className={`bi bi-chat-fill text-2xl`}></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Chats</span>
                </button>
                <button 
                    onClick={() => setActiveTab("calls")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calls' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="bi bi-telephone text-2xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Calls</span>
                </button>
                <button 
                    onClick={() => setActiveTab("people")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'people' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="bi bi-people text-2xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">People</span>
                </button>
                <button 
                    onClick={() => setActiveTab("settings")}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="bi bi-gear text-2xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                </button>
            </nav>
        </div>
    )
}