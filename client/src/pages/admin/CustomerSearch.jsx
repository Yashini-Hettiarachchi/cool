import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { customersApi } from '../../api/customers.api';
import { tap } from '../../lib/motion';
import { PageHeader, EmptyState, Avatar, Svg, ICONS, rowContainer, rowItem } from '../../components/ui';

export default function CustomerSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { customers } = await customersApi.search(q.trim());
      setResults(customers);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <PageHeader icon="search" title="Customer Search" subtitle="Search by NIC, phone, name, or AS- number.">
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
      </form>

      {error && <p className="error">{error}</p>}

      {!searched && !error && (
        <EmptyState icon="search" title="Find a customer"
          hint="Type a NIC, phone number, name, or AS- number above and press Search." />
      )}

      {searched && results.length === 0 && (
        <EmptyState icon="inbox" title="No matches found"
          hint={`Nothing matched "${q}". Check the spelling, or register a new agreement.`}>
          <motion.button {...tap} className="secondary" onClick={() => navigate('/agreements/new')}>+ New Agreement</motion.button>
        </EmptyState>
      )}

      {searched && results.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>NIC</th><th>Route</th><th></th></tr>
          </thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {results.map((c) => (
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
                <td className="row-actions">
                  <button className="link" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}>View →</button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      )}
    </div>
  );
}
