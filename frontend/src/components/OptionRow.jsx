import React from "react";

/**
 * Consistent option row: left = title + description, right = control (e.g. Switch).
 * Optional note or warning below the description (only when provided).
 */
function OptionRow({ title, description, children, note, warning, id }) {
  return (
    <div className="option-row" id={id}>
      <div className="option-row-main">
        <div className="option-row-text">
          <span className="option-row-title">{title}</span>
          {description ? (
            <span className="option-row-desc">{description}</span>
          ) : null}
        </div>
        <div className="option-row-control">
          {children}
        </div>
      </div>
      {note && !warning ? (
        <p className="option-row-note">{note}</p>
      ) : null}
      {warning ? (
        <div className="warning-callout">{warning}</div>
      ) : null}
    </div>
  );
}

export default OptionRow;
