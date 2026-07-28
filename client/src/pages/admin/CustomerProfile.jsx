import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { customersApi } from '../../api/customers.api';
import { listItem, listContainer, tap, motionTokens } from '../../lib/motion';
import { Svg, ICONS, Avatar, EmptyState, Alert, rowContainer, rowItem } from '../../components/ui';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    customersApi.profile(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="card"><Alert tone="error">{error}</Alert></div>;
  if (!data) return <div className="card"><p className="muted">Loading…</p></div>;

  const { customer, acUnits, agreements } = data;
  const fields = [
    { icon: 'phone', label: 'Phone', value: customer.phone },
    { icon: 'idCard', label: 'NIC', value: customer.nic },
    { icon: 'pin', label: 'Route', value: customer.route || '—' },
    { icon: 'home', label: 'Address', value: customer.address || '—' },
  ];

  return (
    <motion.div variants={pageStagger} initial="hidden" animate="visible">
      {/* ---- Hero ---- */}
      <motion.div className="card" variants={listItem}>
        <div className="row-between">
          <div className="cp-identity">
            <Avatar name={customer.name} size={52} />
            <div>
              <h1 style={{ margin: 0 }}>{customer.name}</h1>
              <span className="loyalty"><Svg d={ICONS.star} size={14} /> {customer.years_as_customer} year{customer.years_as_customer === 1 ? '' : 's'} as a customer</span>
            </div>
          </div>
          <motion.button {...tap} onClick={() => navigate(`/agreements/new?customerId=${customer.id}`)}>
            <Svg d={ICONS.userPlus} size={16} /> New Agreement
          </motion.button>
        </div>

        <motion.div className="info-grid" variants={listContainer} initial="hidden" animate="visible">
          {fields.map((f) => (
            <motion.div className="info-tile" key={f.label} variants={listItem}
              whileHover={{ y: -2 }} transition={{ duration: motionTokens.duration.fast }}>
              <span className="info-ico"><Svg d={ICONS[f.icon]} /></span>
              <div className="info-body">
                <span className="info-label">{f.label}</span>
                <span className="info-value">{f.value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ---- Agreements ---- */}
      <motion.div className="card" variants={listItem}>
        <div className="card-title"><h2>Agreements</h2><span className="count">{agreements.length}</span></div>
        {agreements.length === 0 ? (
          <EmptyState icon="file" title="No agreements yet"
            hint="This customer has no service agreements. Create one to schedule visits.">
            <motion.button {...tap} onClick={() => navigate(`/agreements/new?customerId=${customer.id}`)}>+ New Agreement</motion.button>
          </EmptyState>
        ) : (
          <table className="table">
            <thead>
              <tr><th>AS-No</th><th>AC (Brand / Model)</th><th>Normal / H-P</th><th>Period</th><th>Price</th><th>Status</th><th>End date</th></tr>
            </thead>
            <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
              {agreements.map((a) => (
                <motion.tr key={a.id} variants={rowItem}>
                  <td><span className="as-chip">{a.agreement_no}</span></td>
                  <td>{a.brand} / {a.model}</td>
                  <td>{a.normal_count} / {a.hp_count}</td>
                  <td>{a.period_days}d</td>
                  <td>{a.price ? `LKR ${a.price}` : '—'}</td>
                  <td><span className={`badge-soft st-${a.status}`}>{a.status}</span></td>
                  <td>{a.end_date}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </motion.div>

      {/* ---- AC Units ---- */}
      <motion.div className="card" variants={listItem}>
        <div className="card-title"><h2>AC Units</h2><span className="count">{acUnits.length}</span></div>
        {acUnits.length === 0 ? (
          <EmptyState icon="ac" title="No AC units on record" hint="AC units are added when you create an agreement." />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Brand</th><th>Model</th><th>Serial (Indoor)</th><th>Serial (Outdoor)</th></tr>
            </thead>
            <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
              {acUnits.map((u) => (
                <motion.tr key={u.id} variants={rowItem}>
                  <td>{u.brand}</td><td>{u.model}</td><td>{u.serial_indoor || '—'}</td><td>{u.serial_outdoor || '—'}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}

const pageStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
