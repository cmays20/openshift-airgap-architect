import React, { useState, useRef, useEffect } from "react";

/**
 * Small blue "i" icon; shows tooltip on hover/focus. Use for optional dense guidance.
 */
function TooltipInfo({ content, id: idProp }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const id = idProp || `tooltip-info-${Math.random().toString(36).slice(2, 9)}`;

  useEffect(() => {
    if (!visible) return;
    const el = ref.current;
    if (!el) return;
    const close = (e) => {
      if (el.contains(e.target)) return;
      setVisible(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [visible]);

  return (
    <span className="tooltip-info-wrap" ref={ref}>
      <button
        type="button"
        className="tooltip-info-icon"
        aria-describedby={visible ? id : undefined}
        aria-label="More information"
        onPointerEnter={() => setVisible(true)}
        onPointerLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        i
      </button>
      {visible && content ? (
        <span id={id} className="tooltip-info-content" role="tooltip">
          {content}
        </span>
      ) : null}
    </span>
  );
}

export default TooltipInfo;
