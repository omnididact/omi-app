
import React from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mic, Zap, MessageCircle, BarChart3, LogOut, Settings, Trophy } from "lucide-react";
import { User } from "@/api/entities";
import AuthWrapper from "../components/AuthWrapper";
import SeamlessLink from "../components/SeamlessLink";
import { PageCacheProvider } from "../components/PageCache";

const navigationItems = [
  {
    title: "Capture",
    url: createPageUrl("Record"),
    icon: Mic,
  },
  {
    title: "Actions",
    url: createPageUrl("Todo"),
    icon: Zap,
  },
  {
    title: "Thoughts",
    url: createPageUrl("Memory"),
    icon: MessageCircle,
  },
  {
    title: "Goals",
    url: createPageUrl("Goals"),
    icon: Trophy,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthWrapper>
      <PageCacheProvider>
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
          {/* Header - Optimized for mobile */}
          <header className="bg-white border-b border-gray-200 shadow-sm safe-top">
            <div className="px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    OMI
                  </h1>
                </div>
                
                {/* Header Actions - Touch-optimized */}
                <div className="flex items-center gap-1">
                  <SeamlessLink
                    to={createPageUrl("Insights")}
                    className="p-3 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-manipulation"
                    title="Insights"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </SeamlessLink>
                  <SeamlessLink
                    to={createPageUrl("Settings")}
                    className="p-3 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-manipulation"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </SeamlessLink>
                  <button
                    onClick={handleLogout}
                    className="p-3 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-manipulation"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Full viewport height management */}
          <main className="pb-20 sm:pb-24 min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)]">
            {children}
          </main>

          {/* Bottom Navigation - iOS Safari safe area */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-bottom">
            <div className="px-2 py-2 pb-safe">
              <div className="flex justify-around items-center max-w-lg mx-auto">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SeamlessLink
                      key={item.title}
                      to={item.url}
                      className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 touch-manipulation ${
                        isActive
                          ? "bg-blue-500 text-white shadow-md scale-105"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95"
                      }`}
                    >
                      <item.icon className={`w-6 h-6 sm:w-5 sm:h-5 flex-shrink-0`} />
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isActive ? "font-semibold" : ""
                      }`}>
                        {item.title}
                      </span>
                    </SeamlessLink>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </PageCacheProvider>
    </AuthWrapper>
  );
}
