"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Extract max-w-* classes from className if provided
  const maxWidthRegex = /\b(max-w-[a-z0-9\[\]%-]+|sm:max-w-[a-z0-9\[\]%-]+)/gi;
  const hasCustomMaxWidth = className && maxWidthRegex.test(className);
  
  // Default max-width only if no custom max-width is provided
  const defaultMaxWidth = hasCustomMaxWidth ? "" : "sm:max-w-lg";
  
  // Prevent body scrolling when dialog is open on mobile
  React.useEffect(() => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    if (isMobile) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;
      
      // Lock body scroll on mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, []);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Mobile-first positioning: Full screen on mobile, centered modal on desktop
          "fixed z-50 bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          
          // Mobile: Full viewport approach (no scrolling needed)
          "inset-0",
          "flex flex-col",
          "rounded-none",
          
          // Desktop: Centered modal with scrolling
          "sm:inset-auto",
          "sm:left-[50%] sm:top-[50%]",
          "sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:grid sm:gap-4",
          "sm:border",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
          "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
          
          // Width handling
          "w-full sm:w-full",
          defaultMaxWidth,
          
          // Height handling - full height on mobile, max-height on desktop
          "h-full sm:h-auto",
          "sm:max-h-[90vh]",
          
          // Overflow handling - only on desktop
          "overflow-hidden",
          "[&>*:not(.absolute)]:overflow-y-auto [&>*:not(.absolute)]:sm:overflow-y-auto",
          
          // Padding
          "p-4 sm:p-6",
          
          // Border radius - none on mobile, rounded on desktop
          "sm:rounded-lg",
          
          // Safe area padding for mobile devices with notch
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "pt-[max(1rem,env(safe-area-inset-top))]",
          
          className
        )}
        {...props}
      >
        {/* Scrollable content wrapper for mobile */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden sm:overflow-visible overscroll-contain">
          {children}
        </div>
        <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-6 w-6 sm:h-4 sm:w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl md:text-lg font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base md:text-sm text-muted-foreground leading-relaxed md:leading-normal", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
