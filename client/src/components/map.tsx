import * as React from "react";

export interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ position: { lat: number; lng: number }; label?: string }>;
  circles?: Array<{ center: { lat: number; lng: number }; radius: number }>;
}

export function Map({ center, zoom, className, ...props }: MapProps) {
  return (
    <div
      className={className}
      {...props}
      style={{ minHeight: 200, backgroundColor: "#e5e7eb", borderRadius: 8, ...props.style }}
    >
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Map placeholder {center ? `(${center.lat.toFixed(2)}, ${center.lng.toFixed(2)})` : ""}
        {zoom ? ` • Zoom: ${zoom}` : ""}
      </div>
    </div>
  );
}
