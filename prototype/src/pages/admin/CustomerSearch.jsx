import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers.api';
import { PageHead } from '../../components/ui';
import Pagination from '../../components/Pagination';

export default function CustomerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [res, setRes] = useState(null);
  const [page, setPage] = useState(1);

  const load = (q = '', p = 1) => {
    customersApi.search(q, p).then(setRes);
  };

  useEffect(() => {
    load(query, page);
  }, [query, page]);

  return (
    <div>
      <PageHead
        title="Customer Directory"
        sub="Search customers by name, phone number, NIC, or route."
        actions={
          <button className="btn primary" onClick={() => navigate('/agreements/new')}>
            + New Agreement
          </button>
        }
      />

      <div className="card">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search by name, phone (07...), NIC, route..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        {res && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>NIC</th>
                  <th>Route</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {res.data.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td><strong>{c.name}</strong></td>
                    <td className="mono">{c.phone}</td>
                    <td>{c.nic}</td>
                    <td>{c.route || '—'}</td>
                    <td className="muted">{c.created_at?.slice(0, 10)}</td>
                    <td className="row-actions">
                      <button className="btn link">View Profile →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={res.page}
              totalPages={res.totalPages}
              total={res.total}
              limit={res.limit}
              onChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
