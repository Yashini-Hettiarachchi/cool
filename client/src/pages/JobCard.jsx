/**
 * Printable job card (Phase 6).
 *
 * One component holds the whole sheet so the layout can be re-skinned in one
 * place when the client hands over their exact template (phase-06 issue #2).
 *
 * Printing goes through the browser rather than a server-side PDF library:
 * cPanel shared hosting won't carry puppeteer, and Chrome/Edge/Safari all offer
 * "Save as PDF" from the same dialog (phase-06 issue #1). `document.title` is
 * swapped before printing so the suggested filename is the AS- number and visit,
 * not "Highcool Service Hub".
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { Alert, Svg, ICONS } from '../components/ui';

const STATUS_LABEL = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

function longDate(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

function money(v) {
  if (v === null || v === undefined || v === '') return '—';
  return `Rs. ${Number(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function JobCard() {
  const { id } = useParams();
  const nav = useNavigate();
  const [card, setCard] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    jobsApi.card(id)
      .then(({ card, photos }) => {
        if (!alive) return;
        setCard(card);
        setPhotoCount((photos || []).length);
      })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [id]);

  /**
   * Print with a filename-friendly document title, restored afterwards.
   * `afterprint` (not a timer) is what tells us the dialog is gone — a timer
   * would race a user who leaves the preview open.
   */
  const print = useCallback(() => {
    if (!card) return;
    const original = document.title;
    document.title = `JobCard-${card.agreement_no}-visit-${card.visit_no}`;
    const restore = () => {
      document.title = original;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  }, [card]);

  if (error) return <div className="card"><Alert tone="error">{error}</Alert></div>;
  if (!card) return <div className="card"><p className="muted">Loading job card…</p></div>;

  const serviceType = card.service_type_used === 'hp' ? 'H/P service' : card.service_type_used === 'normal' ? 'Normal service' : '—';

  return (
    <div className="jobcard-page">
      {/* Screen-only toolbar — @media print drops it from the sheet. */}
      <div className="jobcard-bar no-print">
        <button className="secondary" onClick={() => nav(-1)}>
          <Svg d="M15 18l-6-6 6-6" size={16} /> Back
        </button>
        <div className="jcb-actions">
          <button className="secondary" onClick={print}>
            <Svg d={ICONS.file} size={16} /> Print
          </button>
          <button onClick={print} title="Opens the print dialog — choose “Save as PDF” as the destination">
            <Svg d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={16} /> Download PDF
          </button>
        </div>
      </div>
      <p className="muted no-print jobcard-hint">
        “Download PDF” opens your browser’s print dialog — pick <strong>Save as PDF</strong> as the destination.
      </p>

      {/* ---- The sheet ---- */}
      <article className="jobcard-sheet">
        <header className="jc-head">
          <div className="jc-brand">
            <div className="jc-mark">H</div>
            <div>
              <div className="jc-company">Highcool</div>
              <div className="jc-company-sub">AC Service &amp; Maintenance</div>
            </div>
          </div>
          <div className="jc-meta">
            <div className="jc-title">Job Card</div>
            <div className="jc-as mono">{card.agreement_no}</div>
            <div className="jc-visit">
              Visit {card.visit_no} of {card.visit_total} · {STATUS_LABEL[card.status] || card.status}
            </div>
          </div>
        </header>

        <section className="jc-section">
          <h3 className="jc-h">Customer</h3>
          <div className="jc-grid">
            <Field label="Name" value={card.customer_name} />
            <Field label="Phone" value={dash(card.phone)} />
            <Field label="NIC" value={dash(card.nic)} />
            <Field label="Route" value={dash(card.route)} />
            <Field label="Address" value={dash(card.address)} wide />
          </div>
        </section>

        <section className="jc-section">
          <h3 className="jc-h">Air Conditioner</h3>
          <div className="jc-grid">
            <Field label="Brand" value={dash(card.brand)} />
            <Field label="Model" value={dash(card.model)} />
            <Field label="Serial (indoor)" value={dash(card.serial_indoor)} mono />
            <Field label="Serial (outdoor)" value={dash(card.serial_outdoor)} mono />
            {card.install_notes && <Field label="Installation notes" value={card.install_notes} wide />}
          </div>
        </section>

        <section className="jc-section">
          <h3 className="jc-h">This Visit</h3>
          <div className="jc-grid">
            <Field label="Scheduled date" value={longDate(card.scheduled_date)} />
            <Field label="Technician" value={dash(card.technician_name)} />
            <Field label="Service type" value={serviceType} />
            <Field label="Photos on file" value={photoCount || card.photo_count || 0} />
            {card.postponed_from && (
              <Field label="Postponed from" value={`${longDate(card.postponed_from)} (+${card.postpone_days} days)`} wide />
            )}
            {card.postpone_reason && <Field label="Postpone reason" value={card.postpone_reason} wide />}
            {card.cancel_reason && <Field label="Cancellation reason" value={card.cancel_reason} wide />}
            <Field label="Completed" value={card.completed_at ? longDate(card.completed_at) : 'Not yet'} />
            <Field label="Office approved" value={card.admin_confirmed ? 'Yes' : 'No'} />
          </div>
        </section>

        <section className="jc-section">
          <h3 className="jc-h">Agreement</h3>
          <div className="jc-grid">
            <Field label="Period" value={`${longDate(card.start_date)} – ${longDate(card.end_date)}`} wide />
            <Field label="Visits" value={`${card.normal_count} normal · ${card.hp_count} H/P`} />
            <Field label="Interval" value={`${card.period_days} days`} />
            <Field label="Agreed price" value={money(card.price)} />
            <Field label="Amount paid" value={money(card.amount_paid)} />
          </div>
        </section>

        <section className="jc-section jc-notes">
          <h3 className="jc-h">Work carried out / remarks</h3>
          <div className="jc-notebox">{card.comments || card.notes || ''}</div>
        </section>

        <footer className="jc-foot">
          <div className="jc-sign">
            <span className="jc-sign-line" />
            <span className="jc-sign-label">Technician signature</span>
          </div>
          <div className="jc-sign">
            <span className="jc-sign-line" />
            <span className="jc-sign-label">Customer signature</span>
          </div>
          <div className="jc-sign">
            <span className="jc-sign-line" />
            <span className="jc-sign-label">Date</span>
          </div>
        </footer>

        <p className="jc-fineprint">
          Highcool AC Service &amp; Maintenance · {card.agreement_no} · visit {card.visit_no} of {card.visit_total}
        </p>
      </article>
    </div>
  );
}

function Field({ label, value, wide, mono }) {
  return (
    <div className={`jc-field${wide ? ' wide' : ''}`}>
      <span className="jc-label">{label}</span>
      <span className={`jc-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}
