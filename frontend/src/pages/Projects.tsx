import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { MOCK_PROJECTS, type Project } from "../data/projects";
import { ProjectCard } from "../components/ui/ProjectCard";
import { ScrollReveal, StaggerContainer, StaggerItem } from "../components/animations/ScrollReveal";
import { client } from "../sanity/client";
import { urlFor } from "../sanity/image";

const CATEGORIES = ["All", "Web Development", "Artificial Intelligence", "Machine Learning", "Cybersecurity", "Open Source"];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [dynamicProjects, setDynamicProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await client.fetch(`*[_type == "project"] | order(_createdAt desc) {
          _id,
          title,
          shortDescription,
          description,
          category,
          technologies,
          contributors,
          demoLink,
          repoLink,
          gallery,
          featured
        }`);

        if (result && result.length > 0) {
          const formattedProjects: Project[] = result.map((p: any) => ({
            id: p._id,
            title: p.title,
            shortDescription: p.shortDescription || p.description,
            description: p.description,
            category: p.category || "Web Development",
            technologies: p.technologies || [],
            contributors: p.contributors || [],
            demoLink: p.demoLink,
            repoLink: p.repoLink,
            images: p.gallery && p.gallery.length > 0 
              ? p.gallery
                  .filter((img: any) => img && img.asset)
                  .map((img: any) => urlFor(img).url()) 
              : undefined,
            featured: p.featured,
          }));
          setDynamicProjects(formattedProjects);
        } else {
          setDynamicProjects(MOCK_PROJECTS);
        }
      } catch (error) {
        console.error("Error fetching projects from Sanity:", error);
        setDynamicProjects(MOCK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") return dynamicProjects;
    return dynamicProjects.filter((p) => p.category === activeCategory);
  }, [activeCategory, dynamicProjects]);

  return (
    <>
      <SEO
        title="Projects - CODEX"
        description="Discover the innovative projects developed by CODEX members across various engineering disciplines."
      />
      <div className="bg-background-light min-h-screen font-display text-slate-900">
        <main className="max-w-7xl mx-auto px-6 md:px-20 py-16">
          
          <ScrollReveal className="mb-20">
            <div className="inline-block bg-primary text-white px-4 py-1 mb-4 font-bold uppercase tracking-widest text-xs border-2 border-slate-900">
              Our Work
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 uppercase leading-none tracking-tighter mb-6 font-display">
              Innovative <br />
              <span className="text-primary italic">Projects</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium max-w-2xl text-slate-700 border-l-8 border-primary pl-6">
              Explore the technical work, creativity, and engineering excellence fostered within the CODEX community. From Web apps to AI models, we build what's next.
            </p>
          </ScrollReveal>

          {/* Filtering */}
          <ScrollReveal delay={0.1} className="flex flex-wrap gap-4 mb-12">
            {CATEGORIES.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 font-bold uppercase border-2 transition-colors duration-200 cursor-pointer ${
                  activeCategory === category
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary hover:text-white"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </ScrollReveal>

          {/* Projects Grid */}
          {loading ? (
            <div className="border-4 border-slate-900 bg-white p-12 text-center brutalist-shadow my-8">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Loading Projects...</h3>
            </div>
          ) : (
            <StaggerContainer key={activeCategory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <StaggerItem key={project.id}>
                  <ProjectCard project={project} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
          
          {!loading && filteredProjects.length === 0 && (
            <div className="border-4 border-slate-900 bg-white p-12 text-center brutalist-shadow mt-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">No Projects Found</h3>
              <p className="text-slate-600 font-medium font-mono text-sm">
                No projects match the selected category right now.
              </p>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
