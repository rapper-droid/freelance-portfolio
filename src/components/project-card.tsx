import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories, type Project } from "@/lib/portfolio";
import { ProjectArt } from "./project-art";
export function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link
      href={`/projects/${p.slug}`}
      className="project-card"
      data-project={p.slug}
    >
      <ProjectArt project={p} />
      <div className="project-card-copy">
        <div className="project-card-meta">
          <span>SELF-INITIATED DEMO</span>
          <ArrowUpRight size={20} />
        </div>
        <h3>
          {p.title}
          <small>{p.name}</small>
        </h3>
        <p>{p.summary}</p>
        <div className="project-card-tags">
          {p.categories.slice(0, 3).map((id) => (
            <span key={id}>{categories.find((c) => c.id === id)?.short}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
