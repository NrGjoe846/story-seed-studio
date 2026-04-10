import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { StatsSection } from "./StatsSection";
import { supabase, getSafeImageUrl } from '@/integrations/supabase/client';

export const HeroSection = () => {
  const [images, setImages] = useState<{ src: string, alt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, students: 0 });

  const fallbackImages = [
    {
      src: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
      alt: 'Children reading together in a cozy library',
    },
    {
      src: 'https://images.unsplash.com/photo-1507730997172-2dad04b44614?q=80&w=1200&auto=format&fit=crop',
      alt: 'Classic library with high bookshelves and warm lighting',
    },
    {
      src: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
      alt: 'Handwriting in a notebook, creative process',
    },
    {
      src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
      alt: 'Diverse group of people sharing stories',
    },
    {
      src: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop',
      alt: 'Antique books stacked on a wooden table',
    },
    {
      src: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop',
      alt: 'Close up of art supplies and creativity',
    },
    {
      src: 'https://images.unsplash.com/photo-1502945015378-0e284ca1c5be?q=80&w=1200&auto=format&fit=crop',
      alt: 'Modern studio workspace for storytellers',
    },
  ];

  useEffect(() => {
    // 2. Fetch Gallery Images from Supabase
    const fetchGalleryImages = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_images')
          .select('title, image_url, event_images')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Collect all unique images from main image and event highlights
          const allImageUrls: { src: string, alt: string }[] = [];

          data.forEach(item => {
            if (item.image_url) {
              allImageUrls.push({
                src: getSafeImageUrl(item.image_url),
                alt: item.title || 'Gallery image'
              });
            }
            if (item.event_images && Array.isArray(item.event_images)) {
              item.event_images.forEach(img => {
                allImageUrls.push({
                  src: getSafeImageUrl(img),
                  alt: item.title || 'Event highlights'
                });
              });
            }
          });

          // Mix and pick 7 images
          const shuffled = allImageUrls.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 7);

          // If we have fewer than 7, pad with fallbacks
          if (selected.length < 7) {
            const padded = [...selected, ...fallbackImages.slice(selected.length)];
            setImages(padded);
          } else {
            setImages(selected);
          }
        } else {
          setImages(fallbackImages);
        }
      } catch (err) {
        console.error('Error fetching images for hero:', err);
        setImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    };

    // 3. Fetch Impact Statistics
    const fetchStats = async () => {
      try {
        const { count: schoolRegCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        
        const { count: clgRegCount } = await supabase
          .from('clg_registrations')
          .select('*', { count: 'exact', head: true });

        const { data: institutions } = await supabase
          .from('profiles')
          .select('institution')
          .not('institution', 'is', null);

        const { data: colleges } = await supabase
          .from('clg_registrations')
          .select('college_name')
          .not('college_name', 'is', null);

        const uniqueInstitutions = new Set([
          ...(institutions?.map(i => i.institution) || []),
          ...(colleges?.map(c => c.college_name) || [])
        ]);

        setStats({
          students: (schoolRegCount || 0) + (clgRegCount || 0),
          schools: uniqueInstitutions.size
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchGalleryImages();
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen w-full selection:bg-black selection:text-white">
      {/* Intro Section */}
      <div
        className="relative flex h-screen items-start justify-center px-4 overflow-hidden bg-cover bg-[center_top]"
        style={{ backgroundImage: "url('/assets/Untitled design (10).png')" }}
      >
        <div className="relative z-10 max-w-4xl text-center pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif italic font-light tracking-tight text-slate-900 leading-[1.1] mb-8 drop-shadow-sm">
              Every Story <br />
              <span className="text-slate-700">Starts with a Seed.</span>
            </h1>

          </motion.div>
        </div>
      </div>

      {/* Impact Statistics Section */}
      <StatsSection schoolsCount={stats.schools} studentsCount={stats.students} />

      {/* Main Parallax Effect with Dynamic Images */}
      <section className="relative z-0">
        <ZoomParallax images={images} />
      </section>

      {/* Transition Section to next content */}
      <div className="h-[20vh] bg-white flex items-center justify-center">
        <div className="h-[1px] w-32 bg-slate-200" />
      </div>
    </main>
  );
};