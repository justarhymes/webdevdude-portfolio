// studios
import { makeCatalogGetHandler } from "@/lib/catalogApi";
import { Studio } from "@/models/Studio";

// GET /api/studios
export const GET = makeCatalogGetHandler(Studio);
