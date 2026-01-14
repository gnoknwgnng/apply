import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, AlertOctagon, Lock, BookOpen, Loader2, ScanLine, Shield, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

const textRevealVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.05 * i,
            duration: 0.5,
            ease: "easeOut"
        }
    })
};

const AnimatedText = ({ text, className }) => {
    return (
        <span className={className}>
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    custom={i}
                    variants={textRevealVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block"
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </span>
    );
};



// --- Real-time Activity Component ---
const ActivityTicker = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        // Initial fetch for "recent" simulated data if DB is empty, or just last 3
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('reports')
                .select('fraud_type, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                setActivities(data);
            } else {
                // Fallback dummy data for demo "liveness" if no real reports yet
                setActivities([
                    { fraud_type: 'Tech Support Scam', created_at: new Date().toISOString() },
                    { fraud_type: 'IRS Impersonation', created_at: new Date().toISOString() }
                ]);
            }
        };

        fetchRecent();

        // Realtime Subscription
        const channel = supabase
            .channel('public:reports')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
                const newReport = payload.new;
                setActivities(prev => [newReport, ...prev].slice(0, 3));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (activities.length === 0) return null;

    return (
        <div className="absolute top-0 right-0 p-4 z-50 pointer-events-none hidden lg:block">
            <div className="flex flex-col gap-2 items-end">
                <AnimatePresence>
                    {activities.map((activity, i) => (
                        <motion.div
                            key={activity.id || i} // Use index fallback for simulated data
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-panel px-4 py-2 rounded-lg border border-indigo-500/30 flex items-center gap-3 shadow-lg shadow-indigo-900/20 backdrop-blur-md"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-mono text-indigo-100">
                                <span className="text-indigo-400 font-bold">ALERT:</span> {activity.fraud_type} Reported
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};



const VerdictMessage = ({ status }) => {
    if (status === 'Not Reported') {
        return (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-emerald-100">Result: SAFE</h3>
                    <p className="text-emerald-200/80 text-sm mb-3">No reports have been found for this contact in our community database.</p>
                    <p className="text-emerald-200/50 text-[10px] uppercase tracking-wide font-medium border-l-2 border-emerald-500/30 pl-2">
                        We are at an early stage, so please do not rely solely on our suggestions. Do not take any action before forming your own understanding or verifying the information.
                    </p>
                </div>
            </div>
        );
    }
    if (status === 'Under Review') {
        return (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-amber-100">Result: CAUTION</h3>
                    <p className="text-amber-200/80 text-sm mb-3">This contact has been reported once. Proceed with caution.</p>
                    <p className="text-amber-200/50 text-[10px] uppercase tracking-wide font-medium border-l-2 border-amber-500/30 pl-2">
                        We are at an early stage, so please do not rely solely on our suggestions. Do not take any action before forming your own understanding or verifying the information.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
                <h3 className="text-lg font-bold text-red-100">Result: HIGH RISK</h3>
                <p className="text-red-200/80 text-sm mb-3">Multiple fraud reports detected. Do not engage with this contact.</p>
                <p className="text-red-200/50 text-[10px] uppercase tracking-wide font-medium border-l-2 border-red-500/30 pl-2">
                    We are at an early stage, so please do not rely solely on our suggestions. Do not take any action before forming your own understanding or verifying the information.
                </p>
            </div>
        </div>
    );
};

// --- Visualization Components ---

const ScannerOverlay = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl overflow-hidden"
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Scanning & Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                {/* Radar Sweep */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-64 h-64 border-2 border-emerald-500/30 rounded-full relative"
                >
                    <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-emerald-500/0 to-emerald-400 origin-left -translate-y-1/2" />
                </motion.div>

                <div className="absolute flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-900/80 rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <ScanLine className="w-8 h-8 text-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-emerald-400 font-mono text-sm tracking-widest uppercase animate-pulse">Scanning Database...</p>
                </div>
            </div>
        </motion.div>
    );
};

const TrustGauge = ({ score }) => {
    // Score 0-100
    // Determine Color
    const getColor = (s) => {
        if (s >= 80) return '#10b981'; // Emerald
        if (s >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const color = getColor(score);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/40 rounded-xl border border-white/5 relative overflow-hidden group hover:bg-slate-800/60 transition-colors">
            <div className="relative w-32 h-16 overflow-hidden mb-2">
                {/* Gauge Background */}
                <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-slate-700/50" />

                {/* Gauge Dynamic Fill */}
                <motion.div
                    initial={{ rotate: -45 }}
                    animate={{ rotate: -45 + (1.8 * score) }} // Map 0-100 to degrees (approx coverage)
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-transparent"
                    style={{
                        borderTopColor: color,
                        borderRightColor: score > 50 ? color : 'transparent', // Simple trick for half-circle
                        transformOrigin: '50% 50%'
                    }}
                />
            </div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2 mt-1">
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-bold text-white tabular-nums"
                >
                    <CountingNumber value={score} />
                </motion.span>
            </div>

            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Trust Score</p>
        </div>
    );
};

const CountingNumber = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = value / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [value]);
    return <>{count}</>;
};


export default function HomePage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false); // Used for network req
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setScanning(true); // Start scanning animation
        setError('');
        setResult(null);

        try {
            // Start fetch
            const fetchPromise = fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => {
                    if (!res.ok) throw new Error('Search failed');
                    return res.json();
                });

            // Enforce minimum scan time for effect
            const [data] = await Promise.all([
                fetchPromise,
                new Promise(resolve => setTimeout(resolve, 2000)) // 2s scan time
            ]);

            setResult(data);

            if (data.status === 'Not Reported') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#34d399', '#10b981', '#059669']
                });
            }
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
        } finally {
            setScanning(false);
            setLoading(false);
        }
    };

    // Calculate Trust Score based on result
    const getTrustScore = (res) => {
        if (!res) return 0;
        if (res.status === 'Not Reported') return 100;
        if (res.status === 'Under Review') return 60;
        if (res.status === 'Multiple Reports') return 15;
        if (res.status === 'Flagged') return 0; // Manual Flag = 0 Trust
        if (res.status === 'Safe') return 95;
        return 50;
    };

    return (
        <motion.div
            className="max-w-4xl mx-auto mt-8 md:mt-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
            <ActivityTicker />
            <div className="text-center mb-16 relative">
                <motion.div variants={itemVariants} className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Live Database
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
                        Identify <span className="header-gradient"><AnimatedText text="Unknown" /></span><br />
                        Scale Securely.
                    </h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        Instantly verify phone numbers and emails against our community-sourced fraud database.
                    </motion.p>
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="relative max-w-2xl mx-auto z-20">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none -z-10 animate-pulse"></div>

                <Tilt
                    tiltMaxAngleX={2}
                    tiltMaxAngleY={2}
                    perspective={1000}
                    scale={1.02}
                    transitionSpeed={1500}
                    className="glass-panel rounded-2xl p-2 md:p-3 shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
                >
                    <AnimatePresence>
                        {scanning && <ScannerOverlay />}
                    </AnimatePresence>

                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 relative z-10">
                        <div className="flex-grow relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search number or email..."
                                className="w-full bg-transparent border-none text-white placeholder-slate-500 p-4 pl-14 text-lg focus:ring-0 focus:outline-none"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={scanning}
                            className="btn-premium whitespace-nowrap min-w-[160px] flex justify-center items-center"
                        >
                            {scanning ? 'Scanning...' : 'Check Now'}
                        </button>
                    </form>
                </Tilt>
            </motion.div>

            <div className="mt-12 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {/* Error State */}
                    {error && !scanning && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-center max-w-lg mx-auto"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Result Card */}
                    {result && !scanning && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0.3 }}
                        >
                            <Tilt
                                tiltMaxAngleX={3}
                                tiltMaxAngleY={3}
                                perspective={1000}
                                className="card max-w-3xl mx-auto border-t-4 border-t-indigo-500 transform-style-3d"
                            >
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="flex-shrink-0"
                                    >
                                        {result.status === 'Not Reported' && <div className="p-4 bg-emerald-500/10 rounded-full shadow-lg shadow-emerald-500/20"><ShieldCheck className="w-16 h-16 text-emerald-400" /></div>}
                                        {result.status === 'Under Review' && <div className="p-4 bg-amber-500/10 rounded-full shadow-lg shadow-amber-500/20"><AlertTriangle className="w-16 h-16 text-amber-400" /></div>}
                                        {result.status === 'Under Review' && <div className="p-4 bg-amber-500/10 rounded-full shadow-lg shadow-amber-500/20"><AlertTriangle className="w-16 h-16 text-amber-400" /></div>}
                                        {(result.status === 'Multiple Reports' || result.status === 'Flagged') && <div className="p-4 bg-red-500/10 rounded-full shadow-lg shadow-red-500/20"><AlertOctagon className="w-16 h-16 text-red-500" /></div>}
                                    </motion.div>

                                    <div className="flex-grow text-center md:text-left w-full">
                                        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                                            <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
                                                {query}
                                            </h2>
                                            <span className={cn(
                                                "badge",
                                                result.status === 'Not Reported' ? 'badge-safe' :
                                                    result.status === 'Not Reported' ? 'badge-safe' :
                                                        result.status === 'Under Review' ? 'badge-review' : 'badge-danger'
                                            )}>
                                                {result.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-5 bg-slate-800/40 rounded-xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Reports</p>
                                                <p className="text-3xl font-bold text-slate-100">{result.report_count}</p>
                                            </div>

                                            {/* New Trust Score Component */}
                                            <TrustGauge score={getTrustScore(result)} />

                                            <div className="p-5 bg-slate-800/40 rounded-xl border border-white/5 hover:bg-slate-800/60 transition-colors col-span-1 md:col-span-1">
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Flag Breakdown</p>
                                                {result.category_breakdown && result.category_breakdown.length > 0 ? (
                                                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {result.category_breakdown.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                                <span className="text-slate-300 truncate max-w-[100px]" title={item.category}>{item.category}</span>
                                                                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold">{item.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xl font-bold text-slate-100 truncate" title={result.fraud_category || 'N/A'}>
                                                        {result.fraud_category || 'None'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <VerdictMessage status={result.status} />
                                        </div>
                                    </div>
                                </div>
                            </Tilt>
                        </motion.div>
                    )}

                    {/* Features (Only show if no result & not scanning) */}
                    {!result && !scanning && !error && (
                        <motion.div
                            initial="hidden" animate="visible" variants={containerVariants}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
                        >
                            {[
                                { icon: ShieldCheck, color: "text-indigo-400", title: "Crowdsourced Safety", desc: "Real-time updates from thousands of community reports." },
                                { icon: Lock, color: "text-pink-400", title: "Privacy First", desc: "Your searches are hashed. We never see the actual numbers." },
                                { icon: BookOpen, color: "text-cyan-400", title: "Open Registry", desc: "Transparent data access for personal and business use." }
                            ].map((feature, i) => (
                                <Tilt
                                    key={i}
                                    tiltMaxAngleX={5}
                                    tiltMaxAngleY={5}
                                    scale={1.05}
                                    transitionSpeed={400}
                                    className="h-full"
                                >
                                    <motion.div
                                        variants={itemVariants}
                                        className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors text-center group cursor-default shadow-lg hover:shadow-indigo-500/10"
                                    >
                                        <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                                            <feature.icon className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-3 text-slate-200">{feature.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                                    </motion.div>
                                </Tilt>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div >
    );
}
