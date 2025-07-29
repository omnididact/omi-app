import React, { Suspense } from 'react';
import { usePageCache } from './PageCache';

const LazyPage = ({ pageName, fallback = null }) => {
  const { getPageComponent } = usePageCache();
  const PageComponent = getPageComponent(pageName);

  if (PageComponent) {
    return <PageComponent />;
  }

  // If page isn't cached yet, load it dynamically
  const LazyComponent = React.lazy(() => {
    switch (pageName) {
      case 'Record':
        return import('../pages/Record');
      case 'Todo':
        return import('../pages/Todo');
      case 'Memory':
        return import('../pages/Memory');
      case 'Goals':
        return import('../pages/Goals');
      case 'Insights':
        return import('../pages/Insights');
      case 'Settings':
        return import('../pages/Settings');
      default:
        return Promise.reject(new Error(`Unknown page: ${pageName}`));
    }
  });

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

export default LazyPage;