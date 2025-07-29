import Layout from "./Layout.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load components for better performance
const Record = lazy(() => import("./Record"));
const Cards = lazy(() => import("./Cards"));
const Todo = lazy(() => import("./Todo"));
const Memory = lazy(() => import("./Memory"));
const Insights = lazy(() => import("./Insights"));
const Index = lazy(() => import("./Index"));
const Settings = lazy(() => import("./Settings"));
const Goals = lazy(() => import("./Goals"));

const PAGES = {
    
    Record: Record,
    
    Cards: Cards,
    
    Todo: Todo,
    
    Memory: Memory,
    
    Insights: Insights,
    
    Index: Index,
    
    Settings: Settings,
    
    Goals: Goals,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner size="lg" text="Loading..." />
                </div>
            }>
                <Routes>            
                    
                        <Route path="/" element={<Record />} />
                    
                    
                    <Route path="/Record" element={<Record />} />
                    
                    <Route path="/Cards" element={<Cards />} />
                    
                    <Route path="/Todo" element={<Todo />} />
                    
                    <Route path="/Memory" element={<Memory />} />
                    
                    <Route path="/Insights" element={<Insights />} />
                    
                    <Route path="/Index" element={<Index />} />
                    
                    <Route path="/Settings" element={<Settings />} />
                    
                    <Route path="/Goals" element={<Goals />} />
                    
                </Routes>
            </Suspense>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}