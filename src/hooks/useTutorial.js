import { useState, useEffect } from 'react';

export const useTutorial = (isAuthenticated = false, user = null) => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Check if user has seen tutorial before
    const tutorialSeen = localStorage.getItem(`omi-tutorial-completed-${user.id}`);
    const firstLogin = localStorage.getItem(`omi-first-login-${user.id}`);
    
    setHasSeenTutorial(!!tutorialSeen);
    
    if (!firstLogin) {
      setIsFirstLogin(true);
      setShouldShowTutorial(true);
      localStorage.setItem(`omi-first-login-${user.id}`, 'true');
    } else {
      setIsFirstLogin(false);
      setShouldShowTutorial(false);
    }
  }, [isAuthenticated, user]);

  const markTutorialComplete = () => {
    if (user) {
      localStorage.setItem(`omi-tutorial-completed-${user.id}`, 'true');
      setHasSeenTutorial(true);
      setShouldShowTutorial(false);
    }
  };

  const resetTutorial = () => {
    if (user) {
      localStorage.removeItem(`omi-tutorial-completed-${user.id}`);
      setHasSeenTutorial(false);
      setShouldShowTutorial(true);
    }
  };

  const forceShowTutorial = () => {
    setShouldShowTutorial(true);
  };

  return {
    hasSeenTutorial,
    isFirstLogin,
    shouldShowTutorial,
    markTutorialComplete,
    resetTutorial,
    forceShowTutorial
  };
}; 