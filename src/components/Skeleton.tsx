import React from "react";

type SkeletonProps<E extends React.ElementType = "div"> = {
  as?: E;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "className">;

export function Skeleton<E extends React.ElementType = "div">(
  { as, className = "", ...rest }: SkeletonProps<E>
) {
  const Tag = (as ?? "div") as React.ElementType;
  return <Tag className={`animate-pulse rounded-lg bg-white/5 ${className}`} {...rest} />;
}

export function TextSkeleton({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
      ))}
    </div>
  );
}