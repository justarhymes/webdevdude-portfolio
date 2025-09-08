import React from "react";

type StringTextProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: String;
};

export default function StringText({
  as: Component = "span",
  children,
  className,
}: StringTextProps) {
  return (
    <Component
      className={`before:content-[open-quote] after:content-[close-quote] ${
        className || ""
      }`}>
      {children}
    </Component>
  );
}
