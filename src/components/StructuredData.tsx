"use client"

interface StructuredDataProps {
  type?: 'homepage' | 'tattooRequest' | 'artist';
  pageTitle?: string;
  pageDescription?: string;
}

export function StructuredData({ type = 'homepage', pageTitle, pageDescription }: StructuredDataProps) {
  
  // Base business data
  const businessData = {
    "@context": "https://schema.org",
    "@type": ["TattooArtist", "LocalBusiness", "HealthAndBeautyBusiness"],
    "name": "Bowen Island Tattoo Studio",
    "alternateName": "Bowen Island Tattoo",
    "description": "Premium custom tattoo studio on Bowen Island near Vancouver, BC. Master artist Kelly Miller specializes in Victorian Gothic, wildlife realism & custom designs.",
    "url": "https://bowenislandtattoo.com",
    "logo": "https://bowenislandtattoo.com/images/bowen-logo.svg",
    "image": [
      "https://bowenislandtattoo.com/images/og-bowen-tattoo-main.jpg",
      "https://bowenislandtattoo.com/images/shop-pic2.png",
      "https://bowenislandtattoo.com/artists/artist-kelly.jpg"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bowen Island",
      "addressRegion": "BC",
      "addressCountry": "CA",
      "postalCode": "V0N 1G0"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "49.3827",
      "longitude": "-123.3639"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Vancouver",
        "addressRegion": "BC",
        "addressCountry": "CA"
      },
      {
        "@type": "City", 
        "name": "West Vancouver",
        "addressRegion": "BC",
        "addressCountry": "CA"
      },
      {
        "@type": "City",
        "name": "North Vancouver", 
        "addressRegion": "BC",
        "addressCountry": "CA"
      },
      {
        "@type": "Place",
        "name": "Bowen Island",
        "addressRegion": "BC", 
        "addressCountry": "CA"
      }
    ],
    "serviceType": "Custom Tattoo Art",
    "priceRange": "$$$$",
    "currenciesAccepted": "CAD",
    "paymentAccepted": "Cash, Credit Card, Debit Card",
    "openingHours": "Mo-Su by appointment only",
    "telephone": "+1-604-XXX-XXXX", // Replace with actual number
    "email": "info@bowenislandtattoo.com", // Replace with actual email
    "founder": {
      "@type": "Person",
      "name": "Kelly Miller",
      "jobTitle": "Master Tattoo Artist",
      "image": "https://bowenislandtattoo.com/artists/artist-kelly.jpg",
      "description": "Master tattoo artist with over 15 years of experience specializing in Victorian Gothic, wildlife realism, and custom design tattoos.",
      "knowsAbout": [
        "Tattoo Art",
        "Victorian Gothic Design",
        "Wildlife Realism",
        "Custom Tattoo Design",
        "Geometric Tattoos",
        "Watercolor Techniques"
      ]
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Tattoo Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Tattoo Design",
            "description": "Personalized tattoo designs created specifically for each client"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Wildlife Realism Tattoos",
            "description": "Photorealistic animal portraits and wildlife scenes"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Victorian Gothic Tattoos", 
            "description": "Gothic-inspired designs with Victorian elegance"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Consultation Services",
            "description": "Private consultation to discuss design ideas and planning"
          }
        }
      ]
    },
    "amenityFeature": [
      "Private Studio Environment",
      "By Appointment Only",
      "Island Location",
      "Premium Equipment",
      "Sterile Environment",
      "Custom Design Services"
    ],
    "knowsAbout": [
      "Tattoo Art",
      "Custom Design",
      "Victorian Gothic",
      "Wildlife Realism", 
      "Minimalism",
      "Geometric Patterns"
    ]
  };

  // Artist-specific structured data
  const artistData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Kelly Miller",
    "jobTitle": "Master Tattoo Artist",
    "description": "Master tattoo artist with over 15 years of experience, founder of Bowen Island Tattoo Studio specializing in Victorian Gothic and wildlife realism.",
    "image": "https://bowenislandtattoo.com/artists/artist-kelly.jpg",
    "url": "https://bowenislandtattoo.com",
    "worksFor": {
      "@type": "Organization",
      "name": "Bowen Island Tattoo Studio"
    },
    "alumniOf": "Vancouver Institute of Art",
    "knowsAbout": [
      "Tattoo Art",
      "Victorian Gothic Design", 
      "Wildlife Realism",
      "Custom Tattoo Design",
      "Geometric Tattoos",
      "Watercolor Techniques",
      "Surrealist Portraits"
    ],
    "award": "Featured in Ink Magazine",
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Tattoo Artist",
      "experienceRequirements": "15+ years professional tattooing"
    }
  };

  // Website/Organization data
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Bowen Island Tattoo Studio",
    "url": "https://bowenislandtattoo.com",
    "description": "Premium custom tattoo studio website featuring artist portfolio, booking system, and information about services.",
    "inLanguage": "en-CA",
    "isPartOf": {
      "@type": "Organization",
      "name": "Bowen Island Tattoo Studio"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bowenislandtattoo.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  let schemaData = [businessData, websiteData];

  if (type === 'artist') {
    schemaData.push(artistData);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData)
      }}
    />
  );
} 