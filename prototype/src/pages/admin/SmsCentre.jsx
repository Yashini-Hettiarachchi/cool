import { useEffect, useState } from 'react';
import { smsApi } from '../../api/sms.api';
import { PageHead } from '../../components/ui';
import Pagination from '../../components/Pagination';

export default function SmsCentre() {
  const [templates, setTemplates] = useState([]);
  const [logsRes, setLogsRes] = useState(null);
  const [page, setPage] = useState(1);
  const [testPhone, setTestPhone] = useState('0771234567');

  const loadData = () => {
    smsApi.getTemplates().then(setTemplates);
    smsApi.getLogs('', '', '', page).then(setLogsRes);
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleUpdateTemplate = async (type, body) => {
    await smsApi.updateTemplate(type, body);
    alert(`Template for ${type} updated!`);
    loadData();
  };

  const handleSendTest = async (type) => {
    await smsApi.sendTest(type, testPhone);
    alert(`Test SMS sent to ${testPhone}`);
    loadData();
  };

  return (
    <div>
      <PageHead
        title="SMS Centre"
        sub="Manage automated SMS templates & view transmission logs."
      />

      <div className="card">
        <h2>SMS Templates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {templates.map((t) => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <h3 style={{ margin: '0 0 8px', textTransform: 'capitalize' }}>{t.template_type} SMS</h3>
              <textarea
                rows="4"
                value={t.body}
                onChange={(e) => {
                  const val = e.target.value;
                  setTemplates(templates.map(item => item.id === t.id ? { ...item, body: val } : item));
                }}
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn secondary sm" onClick={() => handleUpdateTemplate(t.template_type, t.body)}>
                  Save Template
                </button>
                <button className="btn primary sm" onClick={() => handleSendTest(t.template_type)}>
                  Send Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Transmission Logs</h2>
        {logsRes && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logsRes.data.map((l) => (
                  <tr key={l.id}>
                    <td className="muted">{l.sent_at}</td>
                    <td><strong>{l.customer_name}</strong> ({l.customer_phone})</td>
                    <td><span className="chip">{l.template_type}</span></td>
                    <td style={{ maxWidth: 320 }}>{l.message}</td>
                    <td><span className={`badge sms-st-${l.status}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={logsRes.page}
              totalPages={logsRes.totalPages}
              total={logsRes.total}
              limit={logsRes.limit}
              onChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
