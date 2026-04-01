'use client';

import React, { useMemo } from 'react';
import styles from '@/styles/profile.module.css';

interface Project {
  id: string;
  name: string;
  entryCount: number;
  topTags: string[];
  lastActivityAt: string;
  pivotalCount: number;
}

interface ProjectsShowcaseProps {
  projects: Project[];
}

const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({ projects }) => {
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), []);

  const formatDate = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className={styles.projectsSection}>
      <h3 className={styles.sectionLabel} style={{ marginBottom: '20px' }}>Projects</h3>
      <div className={styles.projectsGrid}>
        {projects.map((project) => (
          <a key={project.id} href={`/project/${project.id}`} className={styles.projectCard}>
            <div className={styles.projectName}>{project.name}</div>
            
            <div className={styles.stackTags}>
              {project.topTags.map((tag) => (
                <span key={tag} className={styles.stackTag} style={{ fontSize: '10px' }}>#{tag}</span>
              ))}
            </div>

            <div className={styles.projectStats}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {project.entryCount} entries
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Last sealed {formatDate(project.lastActivityAt)}
              </div>
            </div>

            {project.pivotalCount > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: project.pivotalCount }).map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ProjectsShowcase;
