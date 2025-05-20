import { Instagram, Globe, AtSign, Twitter } from "lucide-react";
import React from "react";

export interface SocialLink {
  platform: string;
  url: string;
  iconType: string;
}

export interface FeaturedWork {
  id: string;
  src: string;
  alt: string;
}

export interface Artist {
  id: string;
  name: string;
  title: string;
  bio: string;
  longBio?: string;
  experience?: string;
  education?: string;
  awards?: string[];
  availability?: string;
  consultationProcess?: string;
  specialties: string[];
  imageSrc: string;
  socials: SocialLink[];
  featuredWorks?: FeaturedWork[];
}

export const artists: Artist[] = [
  {
    id: "Kelly Miller",
    name: "Kelly Miller",
    title: "Founder & Lead Artist",
    bio: "With over 15 years of experience, Alex specializes in geometric and surrealist designs that blend fine art techniques with traditional tattooing.",
    longBio: "Kelly's journey in the tattooing world began with formal art training at the Vancouver Institute of Art, followed by an apprenticeship under master tattoo artist Michael Chen. Her distinctive style merges classical fine art principles with contemporary tattoo techniques, creating pieces that are both timeless and boldly modern.",
    experience: "15+ years professional tattooing experience",
    education: "Vancouver Institute of Art, Apprenticeship with Michael Chen (2008-2010)",
    awards: ["Best Geometric Design - Pacific Tattoo Festival 2019", "Featured Artist - Ink Magazine 2021"],
    availability: "Tuesday-Saturday, by appointment only",
    consultationProcess: "Kelly offers personalized consultations to deeply understand your vision. Please bring any reference material that inspires you to your appointment.",
    specialties: ["Geometric", "Surrealism", "Watercolor"],
    imageSrc: "/artists/artist-kelly.jpeg",
    socials: [
      {
        platform: "Instagram",
        url: "https://instagram.com/kellymillertattoo",
        iconType: "instagram"
      },
      {
        platform: "Portfolio",
        url: "https://alexmercerart.com",
        iconType: "Globe"
      },
      {
        platform: "Email",
        url: "mailto:alex@bowenislandtattoo.com",
        iconType: "AtSign"
      }
    ],
    featuredWorks: [
      {
        id: "1",
        src: "/gallery-images/image1.jpeg",
        alt: "Geometric abstract design"
      },
      {
        id: "2",
        src: "/gallery-images/image2.jpeg",
        alt: "Surrealist portrait"
      },
      {
        id: "3",
        src: "/gallery-images/image3.jpeg",
        alt: "Watercolor nature piece"
      }
    ]
  },
  {
    id: "jamie-chen",
    name: "Jamie Chen",
    title: "Fine Line Specialist",
    bio: "Jamie brings delicate precision to every piece, creating minimalist designs with impeccable detail and clean execution.",
    specialties: ["Minimalist", "Blackwork", "Fine Line"],
    imageSrc: "/artists/artist2.jpg",
    socials: [
      {
        platform: "Instagram",
        url: "https://instagram.com/jamiechenink",
        iconType: "instagram"
      },
      {
        platform: "Twitter",
        url: "https://twitter.com/jamiechenink",
        iconType: "Twitter"
      },
      {
        platform: "Portfolio",
        url: "https://jamiechen.art",
        iconType: "Globe"
      }
    ]
  },
  {
    id: "morgan-lee",
    name: "Morgan Lee",
    title: "Neo-Traditional Artist",
    bio: "Morgan blends classic tattoo motifs with contemporary techniques, creating bold, colorful pieces with a distinctive personal flair.",
    specialties: ["Neo-Traditional", "Floral", "Portrait"],
    imageSrc: "/artists/artist3.jpg",
    socials: [
      {
        platform: "Instagram",
        url: "https://instagram.com/morganleeart",
        iconType: "instagram"
      },
      {
        platform: "Portfolio",
        url: "https://morganlee.tattoo",
        iconType: "Globe"
      },
      {
        platform: "Email",
        url: "mailto:morgan@bowenislandtattoo.com",
        iconType: "AtSign"
      }
    ]
  }
]; 