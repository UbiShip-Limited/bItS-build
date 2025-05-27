"use client"

import React from 'react';
import Head from 'next/head';
import TattooRequestForm from '../../components/forms/TattooRequestForm';
import Layout from '../../components/layout/Layout';

const TattooRequestPage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Request a Tattoo | Bowen Island Tattoo Shop</title>
        <meta name="description" content="Request a custom tattoo design from Bowen Island Tattoo Shop. Our artists specialize in various styles and will create a unique design for you." />
      </Head>
      
      <div className="py-12 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="font-heading text-4xl md:text-5xl mb-4 text-obsidian">Request a Tattoo</h1>
          <p className="text-slate max-w-2xl mx-auto">
            Our artists will review your request and contact you to discuss details, pricing, and scheduling. We look forward to bringing your vision to life.
          </p>
        </div>
        
        <TattooRequestForm />
      </div>
    </Layout>
  );
};

export default TattooRequestPage; 