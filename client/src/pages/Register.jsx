import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/axios"
import { connectSocket } from "../socket";
import { useNavigate, Link } from "react-router-dom"

export default function Register() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const trimmedEmail = email.trim();
            const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
            const firebaseToken = await userCred.user.getIdToken()

            const res = await api.post("/auth/register", { 
                username, 
                email, 
                firebaseToken 
            });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            connectSocket(res.data.token);
            navigate("/");
            
        } catch (err) {
            console.error("Registration error:", err);
            let msg = "Failed to register";
            if (err.code === "auth/email-already-in-use") {
                msg = "This email is already in use.";
            } else if (err.code === "auth/weak-password") {
                msg = "Password should be at least 6 characters.";
            }
            setError(msg);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-sm text-white mb-6">
                        <i className="bi bi-chat-left-dots-fill text-2xl"></i>
                    </div>
                    <h2 className="text-[28px] font-bold text-text-main tracking-tight mb-2">Indigo Connect</h2>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-widest opacity-70">Join the community</p>
                </div>

                <div className="bg-surface rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-4 bg-background border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-main"
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-background border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-main"
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Create Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-background border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-main"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary font-bold hover:underline">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
