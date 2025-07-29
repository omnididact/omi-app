import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageCacheContext = createContext();

export const usePageCache = () => {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within a PageCacheProvider');
  }
  return context;
};

export const PageCacheProvider = ({ children }) => {
  const [cachedPages, setCachedPages] = useState({});
  const [isPreloading, setIsPreloading] = useState({});
  const location = useLocation();

  const preloadPage = async (pageName) => {
    if (cachedPages[pageName] || isPreloading[pageName]) return;
    
    setIsPreloading(prev => ({ ...prev, [pageName]: true }));
    
    try {
      let PageComponent;
      switch (pageName) {
        case 'Record':
          PageComponent = (await import('../pages/Record')).default;
          break;
        case 'Todo':
          PageComponent = (await import('../pages/Todo')).default;
          break;
        case 'Memory':
          PageComponent = (await import('../pages/Memory')).default;
          break;
        case 'Goals':
          PageComponent = (await import('../pages/Goals')).default;
          break;
        case 'Insights':
          PageComponent = (await import('../pages/Insights')).default;
          break;
        case 'Settings':
          PageComponent = (await import('../pages/Settings')).default;
          break;
        default:
          return;
      }
      
      setCachedPages(prev => ({ ...prev, [pageName]: PageComponent }));
    } catch (error) {
      console.error(`Failed to preload ${pageName}:`, error);
    } finally {
      setIsPreloading(prev => ({ ...prev, [pageName]: false }));
    }
  };

  const getPageComponent = (pageName) => {
    return cachedPages[pageName];
  };

  // Preload adjacent pages based on current page
  useEffect(() => {
    const currentPath = location.pathname;
    const pageOrder = ['/Record', '/Todo', '/Memory', '/Goals'];
    const currentIndex = pageOrder.findIndex(path => currentPath.includes(path.slice(1)));
    
    if (currentIndex !== -1) {
      // Preload next and previous pages
      const nextIndex = (currentIndex + 1) % pageOrder.length;
      const prevIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
      
      const nextPage = pageOrder[nextIndex].slice(1);
      const prevPage = pageOrder[prevIndex].slice(1);
      
      setTimeout(() => {
        preloadPage(nextPage);
        preloadPage(prevPage);
      }, 100);
    }
    
    // Preload Insights and Settings as they're accessed from header
    setTimeout(() => {
      preloadPage('Insights');
      preloadPage('Settings');
    }, 500);
  }, [location.pathname]);

  return (
    <PageCacheContext.Provider value={{ preloadPage, getPageComponent, cachedPages }}>
      {children}
    </PageCacheContext.Provider>
  );
};