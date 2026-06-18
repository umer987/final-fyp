import React from 'react';
import { Award, MapPin, MessageCircle, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DEFAULT_LAWYER_IMAGE } from '../constants/lawyerImages';
import type { RecommendedLawyer } from '../lib/api';

interface RecommendedLawyersProps {
  lawyers: RecommendedLawyer[];
  compact?: boolean;
}

export function RecommendedLawyers({ lawyers, compact = false }: RecommendedLawyersProps) {
  if (!lawyers.length) return null;

  return (
    <div className={`mt-4 ${compact ? '' : 'pt-4 border-t border-[#0B3D2E]/10'}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[#0B3D2E] urdu-text">متعلقہ وکیل</h4>
        <p className="text-xs text-[#0B3D2E]/60">Recommended lawyers for your question</p>
      </div>

      <div className="flex flex-col gap-3">
        {lawyers.map((lawyer) => {
          const expertise = lawyer.expertise?.length
            ? lawyer.expertise
            : (lawyer.specialization || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
          const whatsappHref =
            lawyer.whatsappLink ||
            `https://wa.me/${(lawyer.phoneNumber || '').replace(/\D/g, '')}`;

          return (
            <div
              key={lawyer.id}
              className="flex gap-3 p-3 rounded-xl bg-[#F8F9FA] border border-[#0B3D2E]/10 hover:border-[#1FAA59]/40 transition-colors"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow">
                <ImageWithFallback
                  src={lawyer.image || DEFAULT_LAWYER_IMAGE}
                  alt={lawyer.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#0B3D2E] truncate">{lawyer.name}</p>
                    {lawyer.nameUrdu && (
                      <p className="text-xs text-[#0B3D2E]/70 urdu-text truncate">{lawyer.nameUrdu}</p>
                    )}
                  </div>
                  {lawyer.verified && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5ED] text-[#0B3D2E] flex-shrink-0">
                      <Award className="w-3 h-3 text-[#1FAA59]" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-[#0B3D2E]/60">
                  <MapPin className="w-3 h-3 text-[#1FAA59]" />
                  <span className="truncate">{lawyer.city}</span>
                  {(lawyer.rating ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <Star className="w-3 h-3 fill-[#C5A253] text-[#C5A253]" />
                      <span>{lawyer.rating}</span>
                    </>
                  )}
                </div>

                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {expertise.slice(0, 2).map((exp) => (
                      <span
                        key={exp}
                        className="px-2 py-0.5 bg-white text-[#0B3D2E] text-[10px] rounded-full border border-[#0B3D2E]/10"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
