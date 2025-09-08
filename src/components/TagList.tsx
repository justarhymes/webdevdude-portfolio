import React from "react";
import CommentHeader from "./CommentHeader";

type TagListProps = {
  children: React.ReactNode;
  title?: string;
};

export default function TagList({ children, title }: TagListProps) {
  return (
    <section className='mt-4'>
      {title && <CommentHeader as='h3'>{title}</CommentHeader>}
      <ul className={`flex flex-wrap gap-2 ${title ? "mt-2" : ""}`}>
        {children}
      </ul>
    </section>
  );
}
