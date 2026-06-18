import React from 'react';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { HowItWorks } from '../components/HowItWorks';
import { Features } from '../components/Features';
import { TechStack } from '../components/TechStack';
import { Team } from '../components/Team';
import { SDGMapping } from '../components/SDGMapping';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <HowItWorks />
      <Features />
      <TechStack />
      <Team />
      <SDGMapping />
      <Footer />
    </>
  );
}