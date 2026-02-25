import React from "react";

/**
 * Section-level banner: info (blue-gray), warning (amber), error (red).
 * Place directly under section title. Readable in light and dark mode.
 */
function Banner({ variant = "info", children, className = "" }) {
  const v = variant === "error" ? "error" : variant === "warning" ? "warning" : "info";
  return (
    <div className={`banner ${v} ${className}`.trim()} role={v === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export default Banner;
