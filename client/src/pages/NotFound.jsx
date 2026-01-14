import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="relative"
            >
                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
                <h1 className="text-9xl font-black text-white/5 relative z-10">404</h1>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="p-4 bg-slate-800/80 rounded-full border border-white/10 mb-4 backdrop-blur-md">
                        <AlertCircle className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 whitespace-nowrap">Page Not Found</h2>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-slate-400 max-w-md mx-auto mb-8 text-lg"
            >
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Link to="/" className="btn-premium inline-flex items-center gap-2">
                    <Home className="w-5 h-5" /> Back Home
                </Link>
            </motion.div>
        </div>
    );
}
