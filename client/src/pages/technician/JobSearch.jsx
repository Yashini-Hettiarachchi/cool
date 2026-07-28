import { useState } from 'react';
import { motion } from 'motion/react';
import { techApi } from '../../api/technician.api';
import { Svg, ICONS, EmptyState, rowContainer, rowItem } from '../../components/ui';
import TechJobCard from '../../components/TechJobCard';

/** Look up all visits under an AS- number. */
export default function JobSearch() {
  const [term, setTerm] = useState('');
  const [jobs, setJobs] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setLoading(true); setError(''); setJobs(null);
    try {
      const d = await techApi.byAgreement(q);
      setJobs(d.jobs || []);
    } catch (err) {
      setJobs([]);
      if (err.status !== 404) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tech-wrap">
      <div className="tech-hero">
        <span className="tech-hero-ico"><Svg d={ICONS.search} size={22} /></span>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Find a Job</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>Enter the agreement (AS-) number</p>
        </div>
      </div>

      <form className="tech-search" onSubmit={submit}>
        <div className="search-input">
          <span className="si-ico"><Svg d={ICONS.file} size={16} /></span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. AS-00001"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <button className="btn primary" disabled={loading || !term.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="alert error" role="alert">{error}</div>}

      {jobs === null && !loading && (
        <EmptyState icon="search" title="Search for a job" hint="Type an AS- number and tap Search to see its visits." />
      )}

      {jobs !== null && jobs.length === 0 && !loading && !error && (
        <EmptyState icon="inbox" title="No visits found" hint={`No jobs matched "${term.trim()}". Check the AS- number and try again.`} />
      )}

      {jobs !== null && jobs.length > 0 && (
        <>
          <div className="tech-section-label">{jobs.length} visit{jobs.length > 1 ? 's' : ''} · {jobs[0].agreement_no}</div>
          <motion.div className="tjob-list" variants={rowContainer} initial="hidden" animate="visible">
            {jobs.map((j) => <TechJobCard key={j.id} job={j} variants={rowItem} />)}
          </motion.div>
        </>
      )}
    </div>
  );
}
