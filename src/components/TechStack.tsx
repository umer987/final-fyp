import React, { useEffect, useRef, useState } from 'react';
import { Code2, Server, Database, Mic, Brain, Cloud } from 'lucide-react';

export function TechStack() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const technologies = [
    {
      category: 'Frontend',
      icon: Code2,
      color: '#1FAA59',
      tech: ['React.js', 'Tailwind CSS', 'TypeScript']
    },
    {
      category: 'Backend',
      icon: Server,
      color: '#0B3D2E',
      tech: ['Node.js', 'Express.js', 'RESTful API']
    },
    {
      category: 'Database',
      icon: Database,
      color: '#C5A253',
      tech: ['MongoDB', 'PostgreSQL', 'Vector DB']
    },
    {
      category: 'AI & NLP',
      icon: Brain,
      color: '#1FAA59',
      tech: ['HuggingFace', 'Transformers', 'Urdu NLP']
    },
    {
      category: 'Speech',
      icon: Mic,
      color: '#0B3D2E',
      tech: ['Whisper AI', 'Speech-to-Text', 'Audio Processing']
    },
    {
      category: 'Deployment',
      icon: Cloud,
      color: '#C5A253',
      tech: ['Render', 'Firebase', 'CI/CD']
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-[#0B3D2E]">
            Technology Stack
          </h2>
          <p className="text-lg mb-2 text-[#C5A253] urdu-text">
            ٹیکنالوجی اسٹیک
          </p>
          <p className="text-xl text-[#0B3D2E]/70 max-w-3xl mx-auto">
            Built with cutting-edge technologies for optimal performance
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {technologies.map((item, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-[#1FAA59]/20 ${
                isVisible ? 'animate-scale-in' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div 
                className="w-16 h-16 mb-6 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon className="w-8 h-8" style={{ color: item.color }} />
              </div>

              {/* Category */}
              <h3 className="text-2xl mb-4 text-[#0B3D2E]">
                {item.category}
              </h3>

              {/* Technologies */}
              <div className="space-y-2">
                {item.tech.map((tech, techIndex) => (
                  <div
                    key={techIndex}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-[#0B3D2E]/80">{tech}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Accent */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: item.color }}
              ></div>
            </div>
          ))}
        </div>

        {/* Additional Tech Badges */}
        <div className={`mt-12 flex flex-wrap justify-center gap-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          {['REST API', 'JWT Auth', 'Docker', 'Git', 'Postman'].map((badge, index) => (
            <div
              key={index}
              className="px-6 py-3 bg-white rounded-full border-2 border-[#0B3D2E]/10 hover:border-[#1FAA59]/50 transition-all duration-300 hover:shadow-md"
            >
              <span className="text-[#0B3D2E]">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}