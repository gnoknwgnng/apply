import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Eye, EyeOff, CheckCircle, Lock, RefreshCw, BarChart3, AlertOctagon, ShieldCheck, FileText, Image as ImageIcon, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [reports, setReports] = useState([]);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, flagged, review
    const [search, setSearch] = useState('');
    const [revealedContacts, setRevealedContacts] = useState({}); // Map of contactId -> decryptedString

    const login = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchReports();
            toast.success("Welcome back, Admin");
        } else {
            setError('Invalid password');
            toast.error("Access Denied");
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports', {
                headers: { 'x-admin-secret': 'admin123' }
            });
            const data = await res.json();
            setReports(data);
        } catch (err) {
            toast.error("Failed to load reports");
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`/api/admin/contacts/${id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': 'admin123'
                },
                body: JSON.stringify({ status })
            });
            toast.success(`Contact marked as ${status}`);
            fetchReports();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const deleteReport = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await fetch(`/api/admin/reports/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-secret': 'admin123' }
            });
            toast.success("Report deleted");
            fetchReports();
        } catch (err) {
            toast.error("Failed to delete report");
        }
    };

    // Stats derivation
    const totalReports = reports.length;
    const flaggedContacts = reports.filter(r => r.contact_status === 'flagged').length;
    const underReview = reports.filter(r => r.contact_status === 'under_review').length;


    const toggleReveal = async (contactId) => {
        // If already revealed, hide it
        if (revealedContacts[contactId]) {
            setRevealedContacts(prev => {
                const next = { ...prev };
                delete next[contactId];
                return next;
            });
            return;
        }

        // Fetch decrypted
        try {
            const res = await fetch(`/api/admin/contacts/${contactId}/reveal`, {
                method: 'POST',
                headers: { 'x-admin-secret': 'admin123' }
            });
            const data = await res.json();

            if (data.contact) {
                setRevealedContacts(prev => ({ ...prev, [contactId]: data.contact }));
            } else {
                toast.error(data.message || 'Cannot decrypt (Old record?)');
            }
        } catch (err) {
            console.error('Failed to reveal', err);
            toast.error('Failed to reveal contact');
        }
    };

    // Filter Logic
    const filteredReports = reports.filter(r => {
        const matchesSearch = r.hashed_contact?.toLowerCase().includes(search.toLowerCase()) ||
            r.fraud_type?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ? true :
            filter === 'flagged' ? r.contact_status === 'flagged' :
                filter === 'review' ? r.contact_status === 'under_review' : true;
        return matchesSearch && matchesFilter;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="card w-full max-w-md text-center border-t-4 border-t-indigo-500"
                >
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-8">Admin Access</h2>
                    <form onSubmit={login}>
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            className="input-premium mb-4 text-center tracking-widest"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
                        <button type="submit" className="btn-premium w-full">Dashboard Login</button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-slate-400">Overview of community reports and threats.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search hash or type..."
                            className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchReports} className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    label="Total Reports"
                    value={totalReports}
                    icon={BarChart3}
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    border="border-indigo-500/20"
                />
                <StatCard
                    label="Needs Review"
                    value={underReview}
                    icon={AlertOctagon}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
                <StatCard
                    label="Flagged Threats"
                    value={flaggedContacts}
                    icon={ShieldCheck}
                    color="text-red-400"
                    bg="bg-red-500/10"
                    border="border-red-500/20"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                {['all', 'review', 'flagged'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${filter === f
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden p-0 border border-slate-800/50"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                            <tr>
                                <th className="p-5">Reported</th>
                                <th className="p-5">Contact Hash</th>
                                <th className="p-5">Category</th>
                                <th className="p-5">Evidence</th>
                                <th className="p-5">Count</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            <AnimatePresence>
                                {filteredReports.map((report) => (
                                    <motion.tr
                                        key={report.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-white/[0.02] transition-colors group relative"
                                    >
                                        <td className="p-5 text-sm text-slate-400">
                                            {new Date(report.created_at).toLocaleDateString()}
                                            <div className="text-xs text-slate-600">
                                                {new Date(report.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                {revealedContacts[report.contact_id] ? (
                                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded text-xs">
                                                        {revealedContacts[report.contact_id]}
                                                    </span>
                                                ) : (
                                                    <code className="bg-black/20 px-2 py-1 rounded text-xs text-indigo-200 font-mono border border-white/5" title={report.hashed_contact}>
                                                        {report.hashed_contact?.substring(0, 8)}...
                                                    </code>
                                                )}

                                                <button
                                                    onClick={() => toggleReveal(report.contact_id)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                                                    title={revealedContacts[report.contact_id] ? "Hide" : "Reveal Original Contact"}
                                                >
                                                    {revealedContacts[report.contact_id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-slate-700/30 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/5 whitespace-nowrap">
                                                {report.fraud_type}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            {report.proof_path ? (
                                                <a
                                                    href={report.proof_path.startsWith('http') ? report.proof_path : `http://localhost:3001${report.proof_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" /> Evidence
                                                </a>
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">No Attachment</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${report.report_count > 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(report.report_count * 10, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">{report.report_count}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {report.contact_status === 'safe' && <span className="badge badge-safe flex w-min items-center gap-1"><CheckCircle size={12} /> Safe</span>}
                                            {report.contact_status === 'under_review' && <span className="badge badge-review flex w-min items-center gap-1"><AlertOctagon size={12} /> Review</span>}
                                            {report.contact_status === 'flagged' && <span className="badge badge-danger flex w-min items-center gap-1"><ShieldCheck size={12} /> Flagged</span>}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                {report.contact_status !== 'flagged' && (
                                                    <button
                                                        onClick={() => updateStatus(report.contact_id, 'flagged')}
                                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors border border-white/5"
                                                        title="Flag as Suspicious"
                                                    >
                                                        <EyeOff size={16} />
                                                    </button>
                                                )}
                                                {report.contact_status !== 'safe' && (
                                                    <button
                                                        onClick={() => updateStatus(report.contact_id, 'safe')}
                                                        className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors border border-white/5"
                                                        title="Mark as Safe"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteReport(report.id)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5"
                                                    title="Delete Report"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500">
                                        No reports found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, border }) {
    return (
        <div className={`card p-6 flex items-center justify-between group border ${border} hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden`}>
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${bg} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

            <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
                    <span className="text-xs text-slate-500 font-medium">Unique entries</span>
                </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center relative z-10 shadow-lg`}>
                <Icon className={`w-7 h-7 ${color}`} />
            </div>
        </div>
    )
}
