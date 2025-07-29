import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = "default", text = "Loading..." }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ${
        size === 'sm' ? 'p-2' : size === 'lg' ? 'p-4' : size === 'xl' ? 'p-6' : 'p-3'
      }`}>
        <Loader2 className={`${sizeClasses[size]} text-white animate-spin`} />
      </div>
      {text && (
        <p className="text-gray-600 font-medium text-sm">{text}</p>
      )}
    </motion.div>
  );
}