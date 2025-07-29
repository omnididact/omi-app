import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from '@/hooks/use-toast';

const InstallButton = ({ variant = "outline", size = "sm", className = "" }) => {
  const { isInstallable, isInstalled, platform, install, showIOSInstructions } = usePWAInstall();

  // Don't show if already installed or not installable
  if (isInstalled || (!isInstallable && platform !== 'ios')) {
    return null;
  }

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
  };

  const getButtonText = () => {
    switch (platform) {
      case 'ios':
        return 'Add to Home Screen';
      case 'android':
        return 'Install App';
      case 'desktop':
        return 'Install App';
      default:
        return 'Install';
    }
  };

  const getIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={className}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );
};

export default InstallButton; 