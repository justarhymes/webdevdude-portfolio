// types
import { makeCatalogGetHandler } from "@/lib/catalogApi";
import { Type } from "@/models/Type";

// GET /api/types
export const GET = makeCatalogGetHandler(Type);
