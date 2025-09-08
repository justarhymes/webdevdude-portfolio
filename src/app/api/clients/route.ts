// clients
import { makeCatalogGetHandler } from "@/lib/catalogApi";
import { Client } from "@/models/Client";

// GET /api/clients
export const GET = makeCatalogGetHandler(Client);
