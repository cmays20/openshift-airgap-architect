import React from "react";

/**
 * Premium button with 3D hover/pressed animation.
 * Variants: primary (Install blue), secondary (neutral), destructive.
 */
function Button({
  variant = "secondary",
  type = "button",
  disabled = false,
  onClick,
  children,
  className = "",
  "aria-label": ariaLabel,
  ...rest
}) {
  const variantClass =
    variant === "primary"
      ? "primary"
      : variant === "destructive"
        ? "danger"
        : "ghost";

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
