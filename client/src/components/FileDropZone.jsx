import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, Image as ImageIcon } from 'lucide-react';

export default function FileDropZone({ onFileSelect, selectedFile, error }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Update preview when selected file changes
    React.useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSelect(e.target.files[0]);
        }
    };

    const validateAndSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            // In a real app we might lift this error up or show a toast
            alert('Please select an image file');
            return;
        }
        onFileSelect(file);
    };

    const clearFile = (e) => {
        e.stopPropagation(); // Prevent triggering click on parent
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative group cursor-pointer
                    border-2 border-dashed rounded-2xl p-8
                    transition-all duration-300 ease-out
                    flex flex-col items-center justify-center
                    min-h-[200px] overflow-hidden
                    ${isDragging
                        ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                        : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
                    }
                    ${error ? 'border-red-500/50 bg-red-500/5' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                />

                <AnimatePresence mode="wait">
                    {selectedFile && previewUrl ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full h-full flex flex-col items-center z-10"
                        >
                            <div className="relative group/preview">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-48 rounded-lg object-contain shadow-2xl shadow-indigo-500/20"
                                />
                                <button
                                    onClick={clearFile}
                                    className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-transform hover:scale-110 active:scale-95"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-300 flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
                                <FileImage size={14} className="text-indigo-400" />
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Click to replace</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center z-10"
                        >
                            <div className={`
                                w-20 h-20 rounded-2xl mb-6 flex items-center justify-center
                                transition-colors duration-300
                                ${isDragging ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800/80'}
                            `}>
                                <Upload size={32} className={isDragging ? 'animate-bounce' : ''} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">
                                {isDragging ? 'Drop Image Here' : 'Upload Evidence'}
                            </h3>
                            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                                Check content by dragging & dropping files or <span className="text-indigo-400 underline decoration-indigo-400/30 group-hover:decoration-indigo-400 transition-all">Browse</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-4 uppercase tracking-wider font-medium">
                                Supports PNG, JPG, WEBP (Max 5MB)
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Animated Background Mesh */}
                {!selectedFile && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
                    </div>
                )}
            </div>
        </div>
    );
}
