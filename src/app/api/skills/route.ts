// skills
import { makeCatalogGetHandler } from "@/lib/catalogApi";
import { Skill } from "@/models/Skill";


// GET /api/skills
export const GET = makeCatalogGetHandler(Skill);
