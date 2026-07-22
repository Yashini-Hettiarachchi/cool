import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers.api';

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
      <div className="row-between">
        <h1>Customer Search</h1>
        <button onClick={() => navigate('/agreements/new')}>+ New Agreement</button>
      </div>
      <p className="muted">Search by NIC, phone, name, or AS- number.</p>

      <form onSubmit={handleSearch} className="search-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 911234567V, 0712223334, or AS-00001" />
        <button type="submit" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {searched && (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>NIC</th><th>Route</th><th></th></tr>
          </thead>
          <tbody>
            {results.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.nic}</td>
                <td>{c.route}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => navigate(`/customers/${c.id}`)}>View</button>
                </td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan="5" className="muted">No matches.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
