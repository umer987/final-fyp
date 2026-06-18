import React, { useEffect, useRef, useState } from 'react';
import { Target, Scale, Users, GraduationCap } from 'lucide-react';

export function SDGMapping() {
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

  const sdgs = [
    {
      number: '4',
      title: 'Quality Education',
      titleUrdu: 'معیاری تعلیم',
      description: 'Providing accessible legal education to Urdu-speaking communities',
      icon: GraduationCap,
      color: '#C5192D'
    },
    {
      number: '10',
      title: 'Reduced Inequalities',
      titleUrdu: 'عدم مساوات میں کمی',
      description: 'Bridging the legal knowledge gap for underserved populations',
      icon: Users,
      color: '#DD1367'
    },
    {
      number: '16',
      title: 'Peace, Justice & Institutions',
      titleUrdu: 'امن، انصاف اور ادارے',
      description: 'Promoting access to justice and legal awareness for all',
      icon: Scale,
      color: '#00689D'
    },
    {
      number: '9',
      title: 'Industry & Innovation',
      titleUrdu: 'صنعت اور جدت',
      description: 'Leveraging AI and technology for legal innovation',
      icon: Target,
      color: '#FD6925'
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-[#E8F5ED] to-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-[#0B3D2E]">
            UN SDG Alignment
          </h2>
          <p className="text-lg mb-2 text-[#C5A253] urdu-text">
            اقوام متحدہ کے پائیدار ترقی کے اہداف
          </p>
          <p className="text-xl text-[#0B3D2E]/70 max-w-3xl mx-auto">
            Contributing to global sustainable development goals
          </p>
        </div>

        {/* SDG Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {sdgs.map((sdg, index) => (
            <div
              key={index}
              className={`group relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: sdg.color }}></div>
                </div>

                {/* SDG Number Badge */}
                <div 
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300"
                  style={{ backgroundColor: sdg.color }}
                >
                  <span className="text-white text-2xl">{sdg.number}</span>
                </div>

                {/* Icon */}
                <div 
                  className="w-16 h-16 mb-6 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${sdg.color}15` }}
                >
                  <sdg.icon className="w-8 h-8" style={{ color: sdg.color }} />
                </div>

                {/* Title */}
                <h3 className="text-xl mb-2 text-[#0B3D2E]">
                  {sdg.title}
                </h3>
                <p className="text-lg mb-4 text-[#C5A253] urdu-text">
                  {sdg.titleUrdu}
                </p>

                {/* Description */}
                <p className="text-[#0B3D2E]/70 leading-relaxed">
                  {sdg.description}
                </p>

                {/* Bottom Accent */}
                <div 
                  className="absolute bottom-0 left-0 w-0 h-1.5 transition-all duration-500 group-hover:w-full rounded-b-3xl"
                  style={{ backgroundColor: sdg.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <div className="inline-block bg-white rounded-2xl px-10 py-6 shadow-lg border-2 border-[#1FAA59]/20">
            <p className="text-[#0B3D2E] text-lg">
              <span className="text-[#1FAA59]">Voice2Law</span> is committed to making a positive impact on society through technology and innovation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}