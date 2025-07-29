
import React from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mic, Zap, MessageCircle, BarChart3, LogOut, Settings, Trophy } from "lucide-react";
import { User } from "@/api/entities";
import AuthWrapper from "./components/AuthWrapper";
import SeamlessLink from "./components/SeamlessLink";
import { PageCacheProvider } from "./components/PageCache";

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
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  OMI
                </h1>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <SeamlessLink
                  to={createPageUrl("Insights")}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Insights"
                >
                  <BarChart3 className="w-5 h-5" />
                </SeamlessLink>
                <SeamlessLink
                  to={createPageUrl("Settings")}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </SeamlessLink>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="pb-20 min-h-[calc(100vh-140px)]">
            {children}
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 shadow-lg">
            <div className="flex justify-around items-center max-w-md mx-auto">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SeamlessLink
                    key={item.title}
                    to={item.url}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0`} />
                    <span className={`text-xs font-medium text-center`}>
                      {item.title}
                    </span>
                  </SeamlessLink>
                );
              })}
            </div>
          </nav>
        </div>
      </PageCacheProvider>
    </AuthWrapper>
  );
}
