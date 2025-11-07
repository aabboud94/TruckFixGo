import { useLocation } from "wouter";
import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

export default function SEOHead({ 
  title = "24/7 Roadside Help for Trucks | Emergency Mobile Truck Repair | TruckFixGo",
  description = "Get immediate roadside help for trucks nationwide. 24/7 emergency roadside assistance, mobile truck repair, tire service, fuel delivery. 15-minute response time. Call 1-800-TRUCK-FIX now!",
  canonical,
  noindex = false
}: SEOHeadProps) {
  const [location] = useLocation();
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical || `https://truckfixgo.com${location}`;
    
    // Update robots meta tag
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.setAttribute('name', 'robots');
      document.head.appendChild(robotsTag);
    }
    robotsTag.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonical || `https://truckfixgo.com${location}`);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }
  }, [title, description, canonical, location, noindex]);
  
  return null;
}