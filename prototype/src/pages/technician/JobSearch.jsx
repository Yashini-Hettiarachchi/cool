import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { technicianApi } from '../../api/technician.api';
import { PageHead } from '../../components/ui';

export default function JobSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    technicianApi.searchJobs(query).then(setResults);
  }, [query]);

  return (
    <div className="tech-wrap">
      <PageHead
        title="Find Job Slot"
        sub="Search service visits by agreement AS- number, customer name, or phone."
      />

      <div className="card">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search AS-00001, customer name, or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {results.map((j) => (
            <div key={j.id} className="card clickable" style={{ marginBottom: 0 }} onClick={() => navigate(`/technician/jobs/${j.id}`)}>
              <div className="row-between">
                <div>
                  <span className="chip mono">{j.agreement_no}</span>
                  <h3 style={{ margin: '4px 0 2px' }}>{j.customer_name}</h3>
                  <span className="muted">{j.customer_phone} • {j.scheduled_date}</span>
                </div>
                <span className={`badge-soft st-${j.status}`}>{j.status?.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
