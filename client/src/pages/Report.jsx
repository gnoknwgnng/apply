import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Tilt from 'react-parallax-tilt';
import FileDropZone from '../components/FileDropZone';

export default function ReportPage() {
    const [formData, setFormData] = useState({
        contact: '',
        type: 'phone', // Default
        fraud_type: '',
        description: '',
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.contact || !formData.fraud_type) {
            toast.error('Please fill in required fields marked with *');
            return;
        }
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('contact', formData.contact);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('fraud_type', formData.fraud_type);
            formDataToSend.append('description', formData.description);
            if (file) {
                formDataToSend.append('proof', file);
            }

            const res = await fetch('/api/report', {
                method: 'POST',
                body: formDataToSend
            });
            if (!res.ok) throw new Error('Submission failed');

            toast.success('Report submitted successfully', {
                description: 'Thank you for helping keep the community safe.'
            });
            setFormData({ contact: '', type: 'phone', fraud_type: '', description: '' });
            setFile(null);
            setSubmitted(true);
        } catch (err) {
            toast.error('Failed to submit report', {
                description: 'Please try again later or check your connection.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <div className="mb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl mb-6 shadow-lg shadow-red-500/20">
                        <ShieldAlert className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Report Suspicious Activity</h1>
                    <p className="text-slate-400 text-lg max-w-lg mx-auto">Help protect others by reporting numbers, emails, or UPI IDs associated with scams.</p>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            >
                {submitted ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} className="card inline-block p-12 bg-slate-900/40 border border-emerald-500/30">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                            >
                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-4 text-white">Thank You!</h2>
                            <p className="text-slate-400 max-w-sm mb-8">
                                Your report has been submitted successfully.
                                Together, we are making the community safer.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all"
                            >
                                Submit Another Report
                            </button>
                        </Tilt>
                    </motion.div>
                ) : (
                    <Tilt
                        tiltMaxAngleX={0.5}
                        tiltMaxAngleY={0.5}
                        perspective={2000}
                        className="card shadow-2xl shadow-indigo-500/5 bg-slate-900/40"
                    >
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider ml-1">Contact Value *</label>
                                    <input
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="input-premium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider ml-1">Contact Type</label>
                                    <div className="relative">
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="input-premium appearance-none cursor-pointer"
                                        >
                                            <option value="phone">Phone Number</option>
                                            <option value="email">Email Address</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider ml-1">Fraud Category *</label>
                                <div className="relative">
                                    <select
                                        name="fraud_type"
                                        value={formData.fraud_type}
                                        onChange={handleChange}
                                        className="input-premium appearance-none cursor-pointer"
                                    >
                                        <option value="">Select a category...</option>
                                        <option value="Scam Call">Scam Call / Spam</option>
                                        <option value="Phishing">Phishing Link</option>
                                        <option value="Financial Fraud">Financial / UPI Fraud</option>
                                        <option value="Fake Job">Fake Job Offer</option>
                                        <option value="Impersonation">Impersonation</option>
                                        <option value="Harrassment">Harassment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider ml-1">Evidence (Optional)</label>
                                <FileDropZone
                                    onFileSelect={setFile}
                                    selectedFile={file}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider ml-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe what happened..."
                                    className="input-premium min-h-[140px] resize-y"
                                    maxLength={300}
                                />
                                <div className="text-right text-xs text-slate-500 mt-1">
                                    {formData.description.length}/300
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-premium py-4 text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 mt-8"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Report'}
                            </button>
                        </form>
                    </Tilt>
                )}
            </motion.div>
        </div>
    );
}
