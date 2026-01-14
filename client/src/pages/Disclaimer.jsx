import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertOctagon, Info } from 'lucide-react';

export default function DisclaimerPage() {
    const [formData, setFormData] = useState({ contact: '', reason: '' });
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/removal-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setStatus('success');
                setFormData({ contact: '', reason: '' });
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Info className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold">Legal Disclaimer</h1>
                    </div>

                    <div className="space-y-8 text-slate-400 leading-relaxed">
                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4">
                            <AlertOctagon className="flex-shrink-0 mt-1 text-amber-500" />
                            <div>
                                <h3 className="text-amber-200 font-semibold mb-1">Community Driven Data</h3>
                                <p className="text-sm text-amber-200/70">
                                    SafeContact Directory is a platform for public awareness. We do not independently verify every report. Data is provided "as is" and should be used with discretion.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold text-lg mb-2">1. Purpose</h3>
                            <p>
                                This platform aims to help users identify potential scam or fraud contacts based on crowd-sourced reports. It is not an official government database and does not claim legal authority.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold text-lg mb-2">2. Liability</h3>
                            <p>
                                We are not responsible for the accuracy of reports submitted by users. We do not accept liability for any actions taken, financial or otherwise, based on this information.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold text-lg mb-2">3. Privacy Logic</h3>
                            <p>
                                All contact numbers and emails are stored as cryptographic hashes (SHA-256) to protect privacy. We do not display raw contact information publicly unless it has been repeatedly flagged as fraudulent by multiple unique sources.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                    className="card sticky top-24 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/5"
                >
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        Request Removal
                    </h2>
                    <p className="text-slate-400 mb-8 text-sm">
                        If you believe your contact information has been reported incorrectly, please submit a formal removal request here.
                    </p>

                    {status === 'success' ? (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center">
                            <p className="font-semibold">Request Received</p>
                            <p className="text-sm mt-2 opacity-80">Our moderation team will review your request within 24-48 hours.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number / Email</label>
                                <input
                                    type="text"
                                    className="input-premium py-3 text-base"
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    required
                                    placeholder="Value to remove..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Removal</label>
                                <textarea
                                    className="input-premium min-h-[120px] py-3 text-base resize-none"
                                    placeholder="Explain why this report is incorrect..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-premium w-full flex items-center justify-center gap-2">
                                Submit Request <Send className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
