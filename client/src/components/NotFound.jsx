import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fe] p-6 text-center">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-sm border border-slate-100 p-12 animate-in zoom-in duration-500">
        <div className="text-8xl font-black text-primary mb-6 tracking-tighter opacity-20">
          404
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Lost in the Clouds?</h2>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">
          The page you're looking for has floated away or never existed. Let's get you back to safety.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate("/")}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <i className="bi bi-house-fill mr-2"></i>
            Take Me Home
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
