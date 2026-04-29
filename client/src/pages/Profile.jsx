import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import {
    getAuth,
    deleteUser
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const token = localStorage.getItem("token");
    const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
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
            alert("Profile updated successfully");
            loadAll();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
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
            navigate("/login");
        } catch {
            alert("Failed to delete account. You might need to re-login first.");
        }
    };

    const handleUnblock = async (userId) => {
        try {
            await api.delete(`/users/block/${userId}`);
            loadAll();
        } catch {
            alert("Failed to unblock user");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fe]">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9fe]">
            <Navbar />
            <main className="container mx-auto px-4 py-10 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-slate-500 font-medium">Manage your profile and privacy</p>
                </div>

                <div className="grid gap-8">
                    {/* Profile Card */}
                    <section className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Personal Information</h2>
                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>}
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ms-2">Username</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ms-2">Email address</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        disabled
                                        className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter ms-2 mt-1 block">Email cannot be changed</span>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving Changes..." : "Save Changes"}
                            </button>
                        </form>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Blocked Users */}
                        <section className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Privacy</h2>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Blocked Users</h3>
                            
                            <div className="space-y-3">
                                {blocked.length === 0 ? (
                                    <p className="text-slate-400 text-sm font-medium py-4">No users are currently blocked.</p>
                                ) : (
                                    blocked.map(u => (
                                        <div key={u._id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="font-bold text-slate-700">{u.username}</span>
                                            <button 
                                                onClick={() => handleUnblock(u._id)}
                                                className="px-4 py-2 text-xs font-bold text-primary hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="bg-white rounded-[32px] shadow-sm border border-red-100 p-8">
                            <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>
                            <p className="text-slate-500 text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                Delete My Account
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Delete Account?</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Are you absolutely sure? All your messages, contacts, and personal data will be <span className="text-red-600 font-bold">permanently erased</span>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={deleteAccount}
                                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                            >
                                Yes, Delete Permanently
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
