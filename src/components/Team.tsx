import React, { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import umerImage from '../assets/team/umer.jpeg';
import shahImage from '../assets/team/shah.jpeg';
import rameelImage from '../assets/team/rameel.jpeg';
import aliImage from '../assets/team/ali.jpeg';
import supervisorImage from '../assets/team/supervisor.jpeg';

export function Team() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const students = [
    {
      name: 'SYED MUHAMMAD UMER',
      role: 'Backend Developer + Team Lead',
      rollNo: 'Reg Id: BS(SE) 62993',
      specialty: 'Full Stack Engineer',
      image: umerImage,
    },
    {
      name: 'MUHAMMAD SHAHMIR IQBAL',
      role: 'Frontend Developer',
      rollNo: 'Reg Id: BS(SE) 62602',
      specialty: 'Frontend Engineer',
      image: shahImage,
    },
    {
      name: 'AHMED ALI GHORI',
      role: 'Frontend Developer',
      rollNo: 'Reg Id: BS(SE) 60117',
      specialty: 'NLP Engineer',
      image: aliImage,
    },
    {
      name: 'RAMEEL KHAN',
      role: 'Database Engineer',
      rollNo: 'Reg Id: BS(SE) 62603',
      specialty: 'UI/UX Designer',
      image: rameelImage,
    },
  ];

  const supervisor = {
    name: 'ABDUL WAHAB KHAN',
    title: 'MS, Computer Science',
    role: 'Project Supervisor',
    department: 'Department of FEST',
    image: supervisorImage,
  };

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl mb-4 text-[#0B3D2E]">FYP Team</h2>
          <p className="text-lg mb-2 text-[#C5A253] urdu-text">ٹیم</p>
          <p className="text-xl text-[#0B3D2E]/70 max-w-3xl mx-auto">
            Final Year Project • Computer Science
          </p>
        </div>

        <div
          className={`max-w-4xl mx-auto mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="relative bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] rounded-3xl p-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden shadow-xl ring-4 ring-[#C5A253] bg-[#0B3D2E]">
                <ImageWithFallback
                  src={supervisor.image}
                  alt={supervisor.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl mb-2 text-white">{supervisor.name}</h3>
                <p className="text-xl mb-1 text-[#C5A253]">{supervisor.title}</p>
                <p className="text-lg text-white/80 mb-2">{supervisor.role}</p>
                <p className="text-white/70">{supervisor.department}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {students.map((student, index) => (
            <div
              key={student.name}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-[#0B3D2E]/10 hover:border-[#1FAA59]/50 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${(index + 2) * 0.1}s` }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] rounded-t-2xl" />

              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-300 ring-2 ring-[#1FAA59]/20">
                <ImageWithFallback
                  src={student.image}
                  alt={student.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-xl mb-2 text-[#0B3D2E] text-center">{student.name}</h3>
              <p className="text-[#C5A253] mb-3 text-center">{student.role}</p>
              <p className="text-sm text-[#0B3D2E]/60 mb-3 text-center">{student.rollNo}</p>

              <div className="pt-4 border-t border-[#0B3D2E]/10">
                <p className="text-sm text-[#0B3D2E]/70 text-center">{student.specialty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
