import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  // Remove all loading states - we handle everything with page cache now
  const startLoading = () => {
    // No-op - pages transition instantly
  };

  const stopLoading = () => {
    // No-op - pages transition instantly
  };

  return (
    <LoadingContext.Provider value={{ isPageLoading: false, startLoading, stopLoading, loadingMessage: '' }}>
      {children}
    </LoadingContext.Provider>
  );
};