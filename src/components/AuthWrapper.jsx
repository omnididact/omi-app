import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setError(null);
      const currentUser = await User.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('User not authenticated:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to initiate login. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading OMI..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  OMI
                </h1>
                <p className="mt-2 text-gray-600">
                  Capture, process, and act on your thoughts with AI guidance
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome Back</h2>
                <p className="text-gray-600 mb-6">Sign in to access your thoughts and continue your journey.</p>
                
                <button
                  onClick={handleLogin}
                  disabled={!!error}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Sign In with Google
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="text-2xl mb-1">🎤</div>
                  <p className="text-xs text-gray-600">Voice Capture</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="text-2xl mb-1">🧠</div>
                  <p className="text-xs text-gray-600">AI Processing</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-xs text-gray-600">Action Steps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}