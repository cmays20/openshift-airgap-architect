import React from "react";

/**
 * Amber/yellow warning callout. Use for risky options, not for actual errors (red).
 */
function WarningCallout({ children, className = "" }) {
  return (
    <div className={`warning-callout ${className}`.trim()} role="status">
      {children}
    </div>
  );
}

export default WarningCallout;
