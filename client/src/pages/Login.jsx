import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import api from "../api/axios"
import { auth } from "../firebase"
import { connectSocket } from "../socket";
import { useNavigate, Link } from "react-router-dom"

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
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      let msg = "Failed to login";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again later.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-sm text-white mb-6">
            <i className="bi bi-chat-left-quote-fill text-2xl"></i>
          </div>
          <h2 className="text-[28px] font-bold text-text-main tracking-tight mb-2">Welcome back</h2>
          <p className="text-text-muted text-sm">Please enter your details to sign in.</p>
        </div>

        <div className="bg-surface rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <i className="bi bi-exclamation-circle"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-background border border-slate-100 dark:border-slate-800 rounded-2xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-main"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-text-muted cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary bg-background" />
                Remember me
              </label>
              <a href="#" className="text-primary font-semibold hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
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
