import React from 'react';
import { Link } from 'react-router-dom';
import { usePageCache } from './PageCache';

const SeamlessLink = ({ to, children, className, ...props }) => {
  const { preloadPage } = usePageCache();

  const handleMouseEnter = () => {
    // Preload on hover for instant navigation
    const pageName = to.split('/').pop() || to.split('/')[1];
    if (pageName) {
      preloadPage(pageName);
    }
  };

  const handleClick = (e) => {
    // Allow normal Link behavior without any loading states
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Link 
      to={to} 
      className={className} 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter} // For mobile touch
      {...props}
    >
      {children}
    </Link>
  );
};

export default SeamlessLink;