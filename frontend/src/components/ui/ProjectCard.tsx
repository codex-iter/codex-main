import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Github, Users, X, Sparkles, FolderOpen, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "../../data/projects";
import TiltCard from "../animations/TiltCard";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

export function ProjectCard({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!project.images || project.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % project.images!.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [project.images]);

  const hasImages = project.images && project.images.length > 0;
  const currentImage = hasImages ? project.images![currentImageIndex] : undefined;

  return (
    <TiltCard
      maxTilt={isOpen ? 0 : 12}
      liftY={isOpen ? 0 : 8}
      className="group border-4 border-slate-900 bg-white brutalist-shadow hover:shadow-[10px_10px_0px_0px_#03045E] transition-all overflow-hidden relative h-full cursor-pointer flex flex-col justify-between"
    >
      {/* Category Badge */}
      <div className="absolute top-0 right-0 border-l-4 border-b-4 border-slate-900 bg-primary px-3 py-1 font-black text-xs uppercase tracking-wider text-white z-20">
        {project.category}
      </div>

      {/* Cover Image */}
      <div 
        className={`relative h-48 w-full overflow-hidden border-b-4 border-slate-900 bg-slate-900 ${hasImages ? 'cursor-zoom-in group/image' : ''}`}
        onClick={(e) => {
          if (hasImages) {
            e.stopPropagation();
            setIsImageEnlarged(true);
          }
        }}
      >
        <AnimatePresence initial={false}>
          {hasImages ? (
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={currentImage}
                alt={`${project.title} preview`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
          ) : (
            <div className="flex absolute inset-0 items-center justify-center bg-slate-800 text-white font-black z-0">
              {project.title}
            </div>
          )}
        </AnimatePresence>

        {hasImages && (
          <div className="absolute inset-0 bg-slate-950/0 group-hover/image:bg-slate-950/30 transition-colors flex items-center justify-center z-10 pointer-events-none">
             <div className="opacity-0 group-hover/image:opacity-100 bg-primary text-white px-4 py-2 transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300 border-2 border-slate-900 flex items-center gap-2 font-black uppercase text-xs shadow-[4px_4px_0px_0px_#0f172a]">
                <ZoomIn size={16} strokeWidth={3} />
                Expand
             </div>
          </div>
        )}
        
        {/* Slideshow Progress Dots */}
        {project.images && project.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {project.images.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === currentImageIndex ? 'bg-primary scale-125' : 'bg-white/50'}`} 
              />
            ))}
          </div>
        )}
        <div className="absolute inset-0  pointer-events-none z-10" />
      </div>

      {/* Card Front Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="mb-2 text-2xl font-black uppercase text-slate-900 group-hover:text-primary transition-colors break-words">
            {project.title}
          </h3>
          <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-2 mb-4">
            {project.shortDescription || project.description}
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="border-2 border-slate-900 bg-[#E0F7FA] px-2 py-0.5 text-xs font-bold text-slate-900"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="border-2 border-slate-900 bg-slate-100 hover:bg-primary hover:text-white px-2 py-0.5 text-xs font-bold text-slate-900 transition-colors cursor-pointer"
                    aria-label={`Show ${project.technologies.length - 4} more technologies`}
                  >
                    +{project.technologies.length - 4}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  onClick={(e) => e.stopPropagation()}
                  className="z-50 border-2 border-slate-900 bg-white p-3 brutalist-shadow max-w-[280px] sm:max-w-xs"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Additional Technologies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.slice(4).map((tech) => (
                      <span
                        key={tech}
                        className="border-2 border-slate-900 bg-[#E0F7FA] px-2 py-0.5 text-xs font-bold text-slate-900"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Click Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-slate-900 bg-slate-900 py-2.5 text-xs font-black uppercase tracking-wider text-white brutalist-shadow-sm hover:bg-primary transition-colors"
        >
          <FolderOpen size={16} />
          Click To View
        </button>
      </div>

      {/* Sliding Door Overlay / Reveal Layer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col bg-white text-black p-6 justify-between overflow-hidden"
          >
            {/* Sliding Left & Right Door Curtain effect enclosed in clipping container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                exit={{ x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 w-1/2 bg-slate-900 border-r-2 border-primary flex items-center justify-end pr-4"
              >
                <div className="w-2 h-12 bg-primary rounded-full" />
              </motion.div>

              <motion.div
                initial={{ x: 0 }}
                animate={{ x: "100%" }}
                exit={{ x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 right-0 w-1/2 bg-slate-900 border-l-2 border-primary flex items-center justify-start pl-4"
              >
                <div className="w-2 h-12 bg-primary rounded-full" />
              </motion.div>
            </div>

            {/* Inner Content Revealed Behind Doors */}
            <div className="relative z-30 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-800">
                  <div className="flex items-center gap-2 text-slate-950 font-black uppercase text-xs">
                    <Sparkles size={16} />
                    <span>Project Specs</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 border-2 border-white bg-red-600 px-2.5 py-1 text-xs font-black uppercase text-white hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <X size={14} strokeWidth={3} />
                    Close
                  </button>
                </div>

                <h3 className="text-2xl font-black uppercase text-primary mb-2">
                  {project.title}
                </h3>
                <div className="mb-4">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                  {project.description && project.description.length > 120 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 text-[11px] font-black uppercase text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5 tracking-wider"
                        >
                          Read more &rarr;
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        onClick={(e) => e.stopPropagation()}
                        className="z-50 border-2 border-slate-900 bg-white p-4 brutalist-shadow max-w-[290px] sm:max-w-sm"
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 pb-1 border-b border-slate-200">
                          Full Description
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed max-h-56 overflow-y-auto pr-1">
                          {project.description}
                        </p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Contributors
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {project.contributors.slice(0, 2).map((c) => {
                      const badgeContent = (
                        <div className="flex items-center gap-1.5 border border-slate-700 bg-slate-900 px-2 py-1 rounded text-xs text-white hover:bg-white hover:text-slate-950 transition-colors">
                          <Users size={12} />
                          <span className="font-bold">{c.name}</span>
                          {c.role && <span className="text-[10px] text-slate-300">({c.role})</span>}
                        </div>
                      );

                      return c.github ? (
                        <a
                          key={c.name}
                          href={c.github}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {badgeContent}
                        </a>
                      ) : (
                        <div key={c.name}>{badgeContent}</div>
                      );
                    })}

                    {project.contributors.length > 2 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 border border-slate-700 bg-slate-100 hover:bg-primary hover:text-white px-2 py-1 rounded text-xs font-bold text-slate-900 transition-colors cursor-pointer"
                            aria-label={`Show ${project.contributors.length - 2} more contributors`}
                          >
                            +{project.contributors.length - 2} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          onClick={(e) => e.stopPropagation()}
                          className="z-50 border-2 border-slate-900 bg-white p-3 brutalist-shadow max-w-[280px] sm:max-w-xs"
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 pb-1 border-b border-slate-200">
                            Additional Contributors ({project.contributors.length - 2})
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                            {project.contributors.slice(2).map((c) => {
                              const badgeContent = (
                                <div className="flex items-center gap-1.5 border border-slate-700 bg-slate-900 px-2 py-1 rounded text-xs text-white hover:bg-white hover:text-slate-950 transition-colors">
                                  <Users size={12} />
                                  <span className="font-bold">{c.name}</span>
                                  {c.role && <span className="text-[10px] text-slate-300">({c.role})</span>}
                                </div>
                              );

                              return c.github ? (
                                <a
                                  key={c.name}
                                  href={c.github}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {badgeContent}
                                </a>
                              ) : (
                                <div key={c.name}>{badgeContent}</div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t-2 border-slate-800">
                {project.demoLink && (
                  <a
                    href={project.demoLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 border-2 border-white bg-primary py-2.5 text-xs font-black uppercase text-white brutalist-shadow-sm hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                  >
                    <ExternalLink size={16} strokeWidth={2.5} />
                    Launch Live Demo
                  </a>
                )}
                {project.repoLink && (
                  <a
                    href={project.repoLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 border-2 border-white bg-slate-900 py-2.5 text-xs font-black uppercase text-white brutalist-shadow-sm hover:bg-white hover:text-slate-950 transition-colors"
                  >
                    <Github size={16} strokeWidth={2.5} />
                    View Source Code
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged Image Modal via Portal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isImageEnlarged && hasImages && currentImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsImageEnlarged(false);
              }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 md:p-12 cursor-zoom-out"
            >
              <button
                className="absolute top-4 right-4 md:top-8 md:right-8 border-4 border-slate-900 bg-primary p-2 text-white hover:bg-white hover:text-slate-900 brutalist-shadow transition-colors z-[110]"
                onClick={() => setIsImageEnlarged(false)}
              >
                <X size={28} strokeWidth={3} />
              </button>
              
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.3 }}
                  src={currentImage}
                  alt={project.title}
                  className="max-h-[90vh] max-w-[90vw] object-contain border-8 border-slate-900 brutalist-shadow cursor-default bg-slate-900"
                  onClick={(e) => e.stopPropagation()} 
                />
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </TiltCard>
  );
}
