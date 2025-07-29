import { useState, useEffect } from 'react';

export const useTutorial = () => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial before
    const tutorialSeen = localStorage.getItem('omi-tutorial-completed');
    const firstVisit = localStorage.getItem('omi-first-visit');
    
    setHasSeenTutorial(!!tutorialSeen);
    
    if (!firstVisit) {
      setIsFirstVisit(true);
      localStorage.setItem('omi-first-visit', 'true');
    }
  }, []);

  const markTutorialComplete = () => {
    localStorage.setItem('omi-tutorial-completed', 'true');
    setHasSeenTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem('omi-tutorial-completed');
    setHasSeenTutorial(false);
  };

  const shouldShowTutorial = () => {
    return !hasSeenTutorial && isFirstVisit;
  };

  return {
    hasSeenTutorial,
    isFirstVisit,
    markTutorialComplete,
    resetTutorial,
    shouldShowTutorial
  };
}; 