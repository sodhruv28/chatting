import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import api from "../api/axios"
import { auth } from "../firebase"
import { connectSocket } from "../socket";
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const firebaseToken = await userCred.user.getIdToken();

      const res = await api.post("/auth/login", { firebaseToken });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      connectSocket(res.data.token);
      toast.success("Welcome back! You've successfully logged in.");
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      let msg = "Failed to login. Please try again.";
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again later.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-3xl mb-6 border border-primary/20">
            <i className="bi bi-chat-left-quote-fill text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Welcome back</h2>
          <p className="text-text-muted font-medium">Enter your details to access your account.</p>
        </div>

        <div className="bg-surface rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[13px] font-semibold rounded-2xl border border-red-100 dark:border-red-900/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <i className="bi bi-exclamation-circle text-lg"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
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

            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-text-muted cursor-pointer font-medium">
                <input type="checkbox" className="w-4 h-4 rounded-lg border-[var(--border-color)] text-primary focus:ring-primary bg-[#efedf5] dark:bg-[#303036]" />
                Remember me
              </label>
              <a href="#" className="text-primary font-bold hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[14px] text-text-muted font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 text-xs text-slate-400 font-medium uppercase tracking-widest">
          <span className="cursor-pointer hover:text-slate-600">Privacy</span>
          <span className="text-slate-200">|</span>
          <span className="cursor-pointer hover:text-slate-600">Terms</span>
        </div>
      </div>
    </div>
  )
}
