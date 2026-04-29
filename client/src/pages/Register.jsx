import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/axios"
import { connectSocket } from "../socket";
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"

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
            toast.success("Welcome! Your account has been created successfully.");
            navigate("/");
            
        } catch (err) {
            console.error("Registration error:", err);
            let msg = "Failed to register. Please try again.";
            
            if (err.code === "auth/email-already-in-use") {
                msg = "This email is already in use.";
            } else if (err.code === "auth/weak-password") {
                msg = "Password should be at least 6 characters.";
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }
            
            toast.error(msg);
            setError(msg);
        } finally {
            setLoading(false)
        }
    }

    return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-3xl mb-6 border border-primary/20">
            <i className="bi bi-chat-left-dots-fill text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Create Account</h2>
          <p className="text-text-muted font-medium">Join Indigo Connect today.</p>
        </div>

        <div className="bg-surface rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[13px] font-semibold rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <i className="bi bi-exclamation-circle text-lg"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1">Username</label>
              <input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-[#efedf5] dark:bg-[#303036] border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-main placeholder:text-text-muted/40"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1">Email address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-[#efedf5] dark:bg-[#303036] border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-main placeholder:text-text-muted/40"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-[#efedf5] dark:bg-[#303036] border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-main placeholder:text-text-muted/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[14px] text-text-muted font-medium">
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
