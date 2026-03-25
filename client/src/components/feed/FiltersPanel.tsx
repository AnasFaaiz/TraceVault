'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import styles from './FiltersPanel.module.css';

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: 'for_you' | 'from_your_stack' | 'trending';
}

const TEMPLATE_TYPES = [
  'design_decision',
  'technical_challenge',
  'tradeoff',
  'lesson_learned',
  'bug_autopsy',
  'integration_note',
];

const TEMPLATE_LABELS: Record<string, string> = {
  design_decision: 'Design Decision',
  technical_challenge: 'Technical Challenge',
  tradeoff: 'Tradeoff',
  lesson_learned: 'Lesson Learned',
  bug_autopsy: 'Bug Autopsy',
  integration_note: 'Integration Note',
};

const IMPACT_LEVELS = ['minor', 'significant', 'pivotal'];

const CONFIDENCE_LEVELS = ['yes_fully', 'mostly', 'not_really'];

const FiltersPanel = ({ isOpen, onClose, activeView = 'for_you' }: FiltersPanelProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState<string[]>([]);
  const [selectedConfidence, setSelectedConfidence] = useState<string>('any');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load filters from URL on mount
  useEffect(() => {
    const templates = searchParams.get('template_type')?.split(',').filter(Boolean) || [];
    const impact = searchParams.get('impact')?.split(',').filter(Boolean) || [];
    const confidence = searchParams.get('confidence') || 'any';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    setSelectedTemplates(templates);
    setSelectedImpact(impact);
    setSelectedConfidence(confidence);
    setSelectedTags(tags);
  }, [searchParams]);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await api.get('/reflections/tags');
        setAllTags(response.data);
      } catch (error) {
        console.error('Failed to fetch tags', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const handleTemplateToggle = (template: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(template)
        ? prev.filter((t) => t !== template)
        : [...prev, template],
    );
  };

  const handleImpactToggle = (impact: string) => {
    setSelectedImpact((prev) =>
      prev.includes(impact)
        ? prev.filter((i) => i !== impact)
        : [...prev, impact],
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag],
    );
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    params.set('view', activeView);

    if (selectedTemplates.length > 0) {
      params.set('template_type', selectedTemplates.join(','));
    } else {
      params.delete('template_type');
    }

    if (selectedImpact.length > 0) {
      params.set('impact', selectedImpact.join(','));
    } else {
      params.delete('impact');
    }

    if (selectedConfidence !== 'any') {
      params.set('confidence', selectedConfidence);
    } else {
      params.delete('confidence');
    }

    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    } else {
      params.delete('tags');
    }

    router.push(`/feed?${params.toString()}`);
    onClose();
  };

  const clearAllFilters = () => {
    setSelectedTemplates([]);
    setSelectedImpact([]);
    setSelectedConfidence('any');
    setSelectedTags([]);
    router.push(`/feed?view=${activeView}`);
    onClose();
  };

  const filterCount = 
    selectedTemplates.length +
    selectedImpact.length +
    (selectedConfidence !== 'any' ? 1 : 0) +
    selectedTags.length;

  const isConfidenceRelevant = selectedTemplates.some((t) =>
    ['bug_autopsy', 'technical_challenge'].includes(t),
  );

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filters {filterCount > 0 && `(${filterCount})`}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {filterCount > 0 && (
          <button className={styles.clearButton} onClick={clearAllFilters}>
            Clear all filters
          </button>
        )}

        <div className={styles.content}>
          {/* Template Type Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Template Type</h3>
            <div className={styles.options}>
              {TEMPLATE_TYPES.map((template) => (
                <label key={template} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template)}
                    onChange={() => handleTemplateToggle(template)}
                  />
                  <span>{TEMPLATE_LABELS[template]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Impact Level Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Impact Level</h3>
            <div className={styles.pills}>
              {IMPACT_LEVELS.map((impact) => (
                <button
                  key={impact}
                  className={`${styles.pill} ${
                    selectedImpact.includes(impact) ? styles.active : ''
                  }`}
                  onClick={() => handleImpactToggle(impact)}
                >
                  {impact.charAt(0).toUpperCase() + impact.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Filter (conditional) */}
          {isConfidenceRelevant && (
            <div className={styles.filterSection}>
              <h3 className={styles.sectionTitle}>Confidence</h3>
              <div className={styles.pills}>
                <button
                  className={`${styles.pill} ${
                    selectedConfidence === 'any' ? styles.active : ''
                  }`}
                  onClick={() => setSelectedConfidence('any')}
                >
                  Any
                </button>
                {CONFIDENCE_LEVELS.map((confidence) => (
                  <button
                    key={confidence}
                    className={`${styles.pill} ${
                      selectedConfidence === confidence ? styles.active : ''
                    }`}
                    onClick={() => setSelectedConfidence(confidence)}
                  >
                    {confidence === 'yes_fully' ? 'Yes fully' : confidence.charAt(0).toUpperCase() + confidence.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            <div className={styles.searchbox}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </div>
            <div className={styles.tagsList}>
              {loading ? (
                <p className={styles.loading}>Loading tags...</p>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <label key={tag} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))
              ) : (
                <p className={styles.noTags}>No tags found</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.applyButton} onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FiltersPanel;
