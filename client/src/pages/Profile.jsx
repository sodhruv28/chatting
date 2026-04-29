import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import {
    getAuth,
    deleteUser
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [blocked, setBlocked] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        username: "",
        email: "",
    });

    const loadAll = useCallback(async () => {
        try {
            const [meRes, blockedRes] = await Promise.all([
                api.get("/users/me"),
                api.get("/users/blocked")
            ]);
            setBlocked(blockedRes.data);
            setForm({
                username: meRes.data.username,
                email: meRes.data.email
            });
        } catch (err) {
            console.error("Failed to load profile data:", err);
            setError("Failed to load profile information");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        loadAll();
    }, [token, loadAll, navigate]);


    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await api.patch("/users/me", { username: form.username });
            toast.success("Profile updated successfully");
            loadAll();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update profile";
            toast.error(msg);
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const deleteAccount = async () => {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        try {
            await api.delete("/users/me");
            await deleteUser(firebaseUser);
            localStorage.clear();
            toast.success("Your account has been permanently deleted.");
            navigate("/login");
        } catch {
            toast.error("Security check: Please re-login before deleting your account.");
        }
    };

    const handleUnblock = async (userId) => {
        try {
            await api.delete(`/users/block/${userId}`);
            toast.success("User unblocked");
            loadAll();
        } catch {
            toast.error("Failed to unblock user");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8 pb-32 max-w-2xl">
                <div className="flex items-center gap-4 mb-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center bg-surface border border-[var(--border-color)] text-text-main rounded-2xl hover:bg-[#efedf5] dark:hover:bg-[#303036] transition-all"
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-text-main tracking-tight">Edit Profile</h1>
                        <p className="text-[13px] text-text-muted font-medium">Update your public identity</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Profile Card */}
                    <section className="bg-surface rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 bg-primary/10 text-primary text-4xl font-black rounded-[32px] flex items-center justify-center border-2 border-primary/20 mb-4">
                                {form.username?.[0]?.toUpperCase()}
                            </div>
                            <h2 className="text-lg font-bold text-text-main">Your Avatar</h2>
                            <p className="text-[11px] text-text-muted font-medium">Generated from your username</p>
                        </div>

                        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl text-[13px] font-bold border border-red-100 dark:border-red-900/20 flex items-center gap-2">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>}
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-text-muted mb-2 ml-1 uppercase tracking-widest">Username</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        className="w-full px-5 py-4 bg-[#efedf5] dark:bg-[#303036] border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none transition-all text-text-main font-bold"
                                        placeholder="Choose a cool username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-text-muted mb-2 ml-1 uppercase tracking-widest">Email address</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        disabled
                                        className="w-full px-5 py-4 bg-[#efedf5]/30 dark:bg-[#303036]/30 border-none rounded-2xl text-text-muted/50 cursor-not-allowed font-medium"
                                    />
                                    <span className="text-[10px] text-text-muted font-bold ml-1 mt-2 block opacity-60">Verified email cannot be changed</span>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving Changes..." : "Update Profile"}
                            </button>
                        </form>
                    </section>

                    <div className="grid gap-8">
                        {/* Blocked Users */}
                        <section className="bg-surface rounded-[32px] shadow-[var(--card-shadow)] border border-[var(--border-color)] p-8">
                            <h2 className="text-lg font-bold text-text-main mb-6">Privacy</h2>
                            <h3 className="text-[13px] font-bold text-text-muted mb-4 uppercase tracking-wider">Blocked Users</h3>
                            
                            <div className="space-y-3">
                                {blocked.map(u => (
                                    <div key={u._id} className="flex items-center justify-between p-4 bg-[#efedf5] dark:bg-[#303036] rounded-2xl">
                                        <span className="font-semibold text-text-main">{u.username}</span>
                                        <button 
                                            onClick={() => handleUnblock(u._id)}
                                            className="text-[13px] font-bold text-primary hover:underline"
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                ))}
                                {blocked.length === 0 && <p className="text-text-muted text-[13px] font-medium italic">No users blocked</p>}
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="bg-surface rounded-[32px] shadow-[var(--card-shadow)] border border-red-100 dark:border-red-900/20 p-8">
                            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                            <p className="text-[13px] text-text-muted font-medium mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            
                            {!showDeleteModal ? (
                                <button 
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-8 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                                >
                                    Delete My Account
                                </button>
                            ) : (
                                <div className="flex flex-col gap-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 animate-in zoom-in duration-300">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">Are you absolutely sure?</p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={deleteAccount}
                                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                                        >
                                            Yes, Delete
                                        </button>
                                        <button 
                                            onClick={() => setShowDeleteModal(false)}
                                            className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
