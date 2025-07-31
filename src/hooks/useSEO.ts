import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

const DEFAULT_CONFIG = {
  title: 'IA Speaker - Conversaciones de Voz con Inteligencia Artificial Local',
  description: 'Aplicación web que simula llamadas telefónicas con IA de forma completamente local. Conversaciones naturales por voz con privacidad total y sin transmisión de datos externos.',
  keywords: 'inteligencia artificial, IA, conversación por voz, llamadas IA, asistente virtual local, speech synthesis, LM Studio, privacidad, AI local',
  image: 'https://ia-speaker.vercel.app/og-image.jpg',
  url: 'https://ia-speaker.vercel.app',
  type: 'website'
};

export const useSEO = (config: SEOConfig = {}) => {
  const seoConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    // Update document title
    if (seoConfig.title) {
      document.title = seoConfig.title;
    }

    // Helper function to update meta tags
    const updateMetaTag = (selector: string, content: string, attribute = 'name') => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.replace(/meta\[|\]|["']/g, '').split('=')[1]);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Update meta description
    if (seoConfig.description) {
      updateMetaTag('meta[name="description"]', seoConfig.description);
      updateMetaTag('meta[property="og:description"]', seoConfig.description, 'property');
      updateMetaTag('meta[name="twitter:description"]', seoConfig.description);
    }

    // Update keywords
    if (seoConfig.keywords) {
      updateMetaTag('meta[name="keywords"]', seoConfig.keywords);
    }

    // Update Open Graph tags
    if (seoConfig.title) {
      updateMetaTag('meta[property="og:title"]', seoConfig.title, 'property');
      updateMetaTag('meta[name="twitter:title"]', seoConfig.title);
    }

    if (seoConfig.image) {
      updateMetaTag('meta[property="og:image"]', seoConfig.image, 'property');
      updateMetaTag('meta[name="twitter:image"]', seoConfig.image);
    }

    if (seoConfig.url) {
      updateMetaTag('meta[property="og:url"]', seoConfig.url, 'property');
      
      // Update canonical URL
      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonicalLink) {
        canonicalLink.href = seoConfig.url;
      }
    }

    if (seoConfig.type) {
      updateMetaTag('meta[property="og:type"]', seoConfig.type, 'property');
    }

    // Update structured data
    if (seoConfig.structuredData) {
      let structuredDataScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (structuredDataScript) {
        structuredDataScript.textContent = JSON.stringify(seoConfig.structuredData);
      } else {
        structuredDataScript = document.createElement('script');
        structuredDataScript.type = 'application/ld+json';
        structuredDataScript.textContent = JSON.stringify(seoConfig.structuredData);
        document.head.appendChild(structuredDataScript);
      }
    }
  }, [seoConfig]);

  return {
    updateSEO: (newConfig: SEOConfig) => {
      // This could be used to dynamically update SEO
      Object.assign(seoConfig, newConfig);
    }
  };
};

export default useSEO;