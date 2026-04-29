import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <div className="w-full max-w-md bg-surface rounded-[40px] shadow-[var(--card-shadow)] border border-[var(--border-color)] p-12 animate-in zoom-in duration-500">
        <div className="text-8xl font-bold text-primary mb-6 tracking-tighter opacity-10">
          404
        </div>
        <h2 className="text-2xl font-bold text-text-main mb-4 tracking-tight">Lost in the Clouds?</h2>
        <p className="text-text-muted mb-10 leading-relaxed font-medium">
          The page you're looking for has floated away or never existed. Let's get you back to safety.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate("/")}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
          >
            <i className="bi bi-house-fill mr-2"></i>
            Take Me Home
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-[#efedf5] dark:bg-[#303036] text-text-muted font-bold rounded-2xl border-none hover:opacity-80 transition-all"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
