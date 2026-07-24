/**
 * Reusable pagination — numbered pages with prev/next chevrons and a range label.
 * Use with the `paginate()` helper:
 *   const [page, setPage] = useState(0);
 *   const pg = paginate(items, page, 15);
 *   ...render pg.slice...
 *   <Pagination {...pg} onPage={setPage} unit="customers" />
 */

/** Slice `items` for the given page; returns everything a Pagination needs. */
export function paginate(items, page, perPage) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(0, page), pageCount - 1);
  const start = p * perPage;
  return {
    slice: items.slice(start, start + perPage),
    page: p,
    pageCount,
    total,
    rangeStart: total ? start + 1 : 0,
    rangeEnd: Math.min(start + perPage, total),
  };
}

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </svg>
);

/** Compact page list with ellipses when there are many pages. */
function pageWindow(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const keep = [...new Set([0, count - 1, page, page - 1, page + 1])]
    .filter((n) => n >= 0 && n < count).sort((a, b) => a - b);
  const out = [];
  let prev = -1;
  for (const n of keep) {
    if (prev >= 0 && n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

export default function Pagination({ page, pageCount, total, rangeStart, rangeEnd, onPage, unit = 'items' }) {
  if (pageCount <= 1) return null;
  const items = pageWindow(page, pageCount);
  return (
    <div className="pagination">
      <span className="pg-range">{rangeStart}–{rangeEnd} of {total} {unit}</span>
      <div className="pg-controls">
        <button className="pg-nav" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <Chevron dir="left" />
        </button>
        {items.map((n, i) => (n === '…'
          ? <span key={`e${i}`} className="pg-ellipsis">…</span>
          : <button key={n} className={`pg-num${n === page ? ' active' : ''}`} onClick={() => onPage(n)}>{n + 1}</button>
        ))}
        <button className="pg-nav" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)} aria-label="Next page">
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}
