'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform, animate } from 'framer-motion';

interface CountUpProps {
  from: number;
  to: number;
  label: string;
  suffix?: string;
}

const CountUp = ({ from, to, label, suffix = "" }: CountUpProps) => {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(from, to, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (value) => setCount(Math.floor(value)),
      });
      return () => controls.stop();
    }
  }, [from, to, isInView]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-serif italic text-slate-900 mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400">
        {label}
      </div>
    </div>
  );
};

export const StatsSection = ({ schoolsCount = 15, studentsCount = 1200 }) => {
  // Use provided stats or defaults if db is empty
  const stats = [
    { label: "Schools Completed", value: Math.max(schoolsCount, 2), suffix: "+" },
    { label: "Students Registered", value: Math.max(studentsCount, 150), suffix: "+" },
  ];

  const logos = [
    { name: "School Logo 1", src: "/assets/Untitled design (11).png" },
    { name: "School Logo 2", src: "/assets/Untitled design (12).png" },
  ];

  return (
    <div className="py-24 bg-white border-y border-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-300">
            Trusted by Leading Institutions
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
          {/* Schools Completed */}
          <div className="flex-shrink-0">
            <CountUp
              from={0}
              to={stats[0].value}
              label={stats[0].label}
              suffix={stats[0].suffix}
            />
          </div>

          {/* Large Fixed Logos in the middle */}
          <div className="flex-shrink-0 flex justify-center">
            <div className="relative h-28 flex justify-center items-center gap-8 md:gap-16">
              {logos.map((logo, i) => (
                <div key={i} className="flex-shrink-0">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-20 md:h-24 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Students Registered */}
          <div className="flex-shrink-0">
            <CountUp
              from={0}
              to={stats[1].value}
              label={stats[1].label}
              suffix={stats[1].suffix}
            />
          </div>
        </div>
      </div>

      {/* Subtle decorative background detail */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -z-10" />
    </div>
  );
};
