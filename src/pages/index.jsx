import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Brain } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to the 'Record' page, replacing the current history entry
    navigate(createPageUrl('Record'), { replace: true });
  }, [navigate]);

  // Render a loading state to provide visual feedback during the brief redirect.
  // This is shown if the redirect takes a moment.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 font-medium">Loading OMI...</p>
      </div>
    </div>
  );
}