import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { isInstallable, isInstalled, platform, install, showIOSInstructions } = usePWAInstall();

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      return;
    }

    // Show prompt for iOS after user interaction
    if (platform === 'ios' && !hasInteracted) {
      const timer = setTimeout(() => {
        if (!localStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, 5000); // 5 seconds delay

      return () => clearTimeout(timer);
    }

    // Show prompt for Android/Desktop when installable
    if (isInstallable) {
      setShowPrompt(true);
    }
  }, [isInstallable, isInstalled, platform, hasInteracted]);

  // Track user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('scroll', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, []);

  const handleInstall = async () => {
    try {
      if (platform === 'ios') {
        const instructions = showIOSInstructions();
        toast({
          title: "Install OMI on your iPhone",
          description: instructions.instructions.join(' • '),
          duration: 8000,
        });
      } else {
        const result = await install();
        if (result.success) {
          toast({
            title: "App installed!",
            description: "You can now access OMI from your home screen.",
          });
        }
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation failed",
        description: "Please try installing manually from your browser menu.",
        variant: "destructive",
      });
    }
    
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-6 w-6" />;
      case 'desktop':
        return <Monitor className="h-6 w-6" />;
      default:
        return <Download className="h-6 w-6" />;
    }
  };

  const getPlatformTitle = () => {
    switch (platform) {
      case 'ios':
        return 'Install OMI on your iPhone';
      case 'android':
        return 'Install OMI on your Android device';
      case 'desktop':
        return 'Install OMI on your computer';
      default:
        return 'Install OMI';
    }
  };

  const getPlatformDescription = () => {
    switch (platform) {
      case 'ios':
        return 'Add OMI to your home screen for quick access to voice recording and thought organization.';
      case 'android':
        return 'Install OMI as an app for a better experience with voice recording and AI-powered insights.';
      case 'desktop':
        return 'Install OMI as a desktop app for quick access and offline functionality.';
      default:
        return 'Install OMI for the best experience with voice recording and AI-powered insights.';
    }
  };

  const getActionButtonText = () => {
    switch (platform) {
      case 'ios':
        return 'Show Instructions';
      default:
        return 'Install App';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getPlatformIcon()}
              <CardTitle className="text-lg">{getPlatformTitle()}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4 text-sm">
            {getPlatformDescription()}
          </CardDescription>
          
          <div className="flex space-x-2">
            <Button onClick={handleInstall} className="flex-1">
              {getActionButtonText()}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt; 