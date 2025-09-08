// Common utility types used across FE/BE

// Slugs are our stable identifiers across JSON, DB and UI.
export type Slug = string;

// Keep dates loosely typed strings to play nicely with API/DB/Next serialization
export type ISODateString = string;

export type WithId = {
  _id?: string;
};

export type WithTimestamps = {
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// Optional helper when something can be missing or empty
export type Maybe<T> = T | null | undefined;

export type SlugRef = {
  slug: string;
  name?: string;
};