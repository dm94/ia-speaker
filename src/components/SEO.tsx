import { useEffect, useMemo } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_SEO = {
  title: "IA Speaker - Conversaciones de Voz con Inteligencia Artificial Local",
  description:
    "Aplicación web que simula llamadas telefónicas con IA de forma completamente local. Conversaciones naturales por voz con privacidad total y sin transmisión de datos externos.",
  keywords:
    "inteligencia artificial, IA, conversación por voz, llamadas IA, asistente virtual local, speech synthesis, LM Studio, privacidad, AI local",
  image: "https://ia-speaker.vercel.app/og-image.jpg",
  url: "https://ia-speaker.vercel.app",
  type: "website",
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type,
}) => {
  const seoData = useMemo(() => ({
    title: title || DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    image: image || DEFAULT_SEO.image,
    url: url || DEFAULT_SEO.url,
    type: type || DEFAULT_SEO.type,
  }), [title, description, keywords, image, url, type]);

  useEffect(() => {
    // Update document title
    document.title = seoData.title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        if (property) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Update basic meta tags
    updateMetaTag("description", seoData.description);
    updateMetaTag("keywords", seoData.keywords);

    // Update Open Graph tags
    updateMetaTag("og:title", seoData.title, true);
    updateMetaTag("og:description", seoData.description, true);
    updateMetaTag("og:image", seoData.image, true);
    updateMetaTag("og:url", seoData.url, true);
    updateMetaTag("og:type", seoData.type, true);

    // Update Twitter Card tags
    updateMetaTag("twitter:title", seoData.title);
    updateMetaTag("twitter:description", seoData.description);
    updateMetaTag("twitter:image", seoData.image);

    // Update canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = seoData.url;
    } else {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      canonicalLink.href = seoData.url;
      document.head.appendChild(canonicalLink);
    }
  }, [seoData]);

  return null;
};

export default SEO;
