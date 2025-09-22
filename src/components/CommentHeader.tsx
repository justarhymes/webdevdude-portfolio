import React from "react";

type CommentHeaderProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export default function CommentHeader({
  as: Component = "h2",
  children,
  className,
  id,
}: CommentHeaderProps) {
  return (
    <Component
      {...(id && { id })}
      className={`text-fg-muted-500 before:content-["//"] before:pr-2 ${
        className || ""
      }`}>
      {children}
    </Component>
  );
}
