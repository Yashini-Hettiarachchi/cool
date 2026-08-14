import React from 'react';

export function PageHead({ title, sub, icon, actions }) {
  return (
    <div className="page-head">
      <div className="ph-lead">
        {icon && <div className="ph-icon">{icon}</div>}
        <div>
          <h1>{title}</h1>
          {sub && <p className="ph-sub">{sub}</p>}
        </div>
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, icon, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-ico">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {hint && <p className="empty-hint">{hint}</p>}
      {action}
    </div>
  );
}
