import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (24 hours)
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Handle install prompt for non-iOS devices
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
      
      // Track installation
      if (typeof gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'engagement',
          event_label: 'PWA Installation'
        });
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if iOS and Safari (installable but needs manual steps)
    if (isIOSDevice && !isStandalone) {
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      if (isSafari) {
        setIsInstallable(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we can't trigger install programmatically
      // Just show instructions
      return;
    }

    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);
      
      // Track the outcome
      if (typeof gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_install_prompt_response', {
          event_category: 'engagement',
          event_label: outcome
        });
      }

      if (outcome === 'accepted') {
        setIsInstalled(true);
      } else {
        handleDismiss();
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    // Track dismissal
    if (typeof gtag !== 'undefined') {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        event_category: 'engagement',
        event_label: 'PWA Install Prompt Dismissed'
      });
    }
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50",
      "md:left-auto md:right-6 md:w-96",
      "animate-in slide-in-from-bottom-5 duration-500"
    )}>
      <Card className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-2xl border-0">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
          onClick={handleDismiss}
          data-testid="button-dismiss-install"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="p-6 pr-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                Install TruckFixGo App
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Get the full app experience with offline access and push notifications
              </p>

              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-xs opacity-80">
                    Tap the share button <span className="inline-block w-4 h-4 align-text-bottom">⬆️</span> then "Add to Home Screen"
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={handleDismiss}
                      data-testid="button-maybe-later"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-white text-primary hover:bg-white/90"
                      onClick={handleDismiss}
                      data-testid="button-got-it"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Got It
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleDismiss}
                    data-testid="button-not-now"
                  >
                    Not Now
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-white text-primary hover:bg-white/90"
                    onClick={handleInstall}
                    data-testid="button-install"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Benefits list */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span className="opacity-90">Offline Access</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span className="opacity-90">Push Alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span className="opacity-90">Home Screen</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}