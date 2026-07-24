import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { customersApi } from '../../api/customers.api';
import { tap } from '../../lib/motion';
import { PageHeader, EmptyState, Avatar, Pill, Svg, ICONS, rowContainer, rowItem } from '../../components/ui';
import Pagination, { paginate } from '../../components/Pagination';

const PER_PAGE = 15;

export default function CustomerSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState('all');   // 'all' (default listing) | 'search'
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(0);

  // Load every customer by default, before any search.
  async function loadAll() {
    setError(''); setBusy(true);
    try {
      const { customers } = await customersApi.list();
      setResults(customers);
      setMode('all');
      setPage(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return loadAll();   // empty search → back to full list
    setError(''); setBusy(true);
    try {
      const { customers } = await customersApi.search(term);
      setResults(customers);
      setMode('search');
      setPage(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function clearSearch() {
    setQ('');
    loadAll();
  }

  const count = results.length;
  const subtitle = busy
    ? 'Loading customers…'
    : mode === 'all'
      ? `${count} customer${count === 1 ? '' : 's'} registered · search by NIC, phone, name, or AS-`
      : `${count} match${count === 1 ? '' : 'es'} for "${q.trim()}"`;

  return (
    <div className="card">
      <PageHeader icon="users" title="Customers" subtitle={subtitle}>
        <motion.button {...tap} onClick={() => navigate('/agreements/new')}>
          <Svg d={ICONS.userPlus} size={16} /> New Agreement
        </motion.button>
      </PageHeader>

      <form onSubmit={handleSearch} className="search-row">
        <div className="search-input">
          <span className="si-ico"><Svg d={ICONS.search} size={17} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 911234567V, 0712223334, or AS-00001" autoFocus />
        </div>
        <motion.button {...tap} type="submit" disabled={busy}>{busy ? 'Searching…' : 'Search'}</motion.button>
        {mode === 'search' && (
          <motion.button {...tap} type="button" className="secondary" onClick={clearSearch}>Show all</motion.button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {!busy && count === 0 && mode === 'all' && !error && (
        <EmptyState icon="customers" title="No customers yet"
          hint="Register your first customer by creating a new agreement.">
          <motion.button {...tap} className="secondary" onClick={() => navigate('/agreements/new')}>+ New Agreement</motion.button>
        </EmptyState>
      )}

      {!busy && count === 0 && mode === 'search' && !error && (
        <EmptyState icon="inbox" title="No matches found"
          hint={`Nothing matched "${q.trim()}". Check the spelling, or register a new agreement.`}>
          <motion.button {...tap} className="secondary" onClick={clearSearch}>Show all customers</motion.button>
        </EmptyState>
      )}

      {!busy && count > 0 && (() => {
        const pg = paginate(results, page, PER_PAGE);
        return (
        <>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>NIC</th><th>Route</th><th>Agreements</th><th></th></tr>
          </thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {pg.slice.map((c) => (
              <motion.tr key={c.id} variants={rowItem} className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>
                <td>
                  <span className="name-cell">
                    <Avatar name={c.name} size={34} />
                    <span className="nc-main">{c.name}</span>
                  </span>
                </td>
                <td>{c.phone}</td>
                <td>{c.nic}</td>
                <td>{c.route || '—'}</td>
                <td>
                  {c.agreement_count != null
                    ? <Pill tone={c.agreement_count > 0 ? 'brand' : 'muted'}>{c.agreement_count}</Pill>
                    : '—'}
                </td>
                <td className="row-actions">
                  <button className="row-go" title={`View ${c.name}`}
                    onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}>
                    <Svg d={ICONS.arrow} size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
        <Pagination {...pg} onPage={setPage} unit="customers" />
        </>
        );
      })()}
    </div>
  );
}
