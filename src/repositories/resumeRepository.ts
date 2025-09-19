// src/repositories/resumeRepository.ts
import mongoose from "mongoose";
import { ResumeItem } from "@/models/ResumeItem";
import { Skill } from "@/models/Skill";
import { ResumeItemInput, ResumeItemUpdate } from "@/domain/resume";
import {
  resolveManyRelations,
  type RelInput,
} from "@/repositories/relationResolvers";
import { withOptionalTransaction } from "@/lib/tx";
import type { PublicIssue } from "@/lib/parse";
import { slugify } from "@/lib/slug";

export type CreateOpts = {
  dryRun?: boolean;
  upsert?: boolean;
  allowNew?: boolean;
};

type RepoError = { message: string; issues?: ReadonlyArray<PublicIssue> };
type PlainObject = Record<string, unknown>;

type LeanRel = { slug: string; name?: string };

// The inputs we accept for a relation in this repo,
// mirroring what the rest of the app passes around.
type MaybeRelInput =
  | RelInput
  | { slug?: string; name?: string }
  | null
  | undefined;

type DryRunPlan = {
  action: "create" | "update";
  id?: string;
  set: Record<string, unknown>;
};

// ---------- helpers ----------

function desiredSlugName(rel: MaybeRelInput): { slug?: string; name?: string } {
  if (!rel) return {};
  // RelInput shape is typically { slug?: string; name?: string }
  const maybeSlug =
    typeof (rel as { slug?: unknown }).slug === "string"
      ? (rel as { slug: string }).slug
      : undefined;

  const maybeName =
    typeof (rel as { name?: unknown }).name === "string"
      ? (rel as { name: string }).name
      : // Some callers historically use {slug: "React"} to mean name=React.
      typeof (rel as { slug?: unknown }).slug === "string"
      ? (rel as { slug: string }).slug
      : undefined;

  if (maybeSlug) return { slug: maybeSlug, name: maybeName };
  if (maybeName) return { slug: slugify(maybeName), name: maybeName };
  return {};
}

function normalizeLean(rel: MaybeRelInput): LeanRel | undefined {
  const { slug, name } = desiredSlugName(rel);
  if (!slug) return undefined;
  return { slug, name };
}

// ---------- CREATE / UPSERT ----------

export async function createResumeItem(
  payload: ResumeItemInput,
  opts: CreateOpts = {}
): Promise<
  | { ok: true; data: PlainObject; summary?: DryRunPlan }
  | { ok: false; error: RepoError }
> {
  try {
    const identity = {
      section: payload.section,
      title: payload.title,
      organization: payload.organization ?? null,
      startDate: payload.startDate,
    };

    const existing = await ResumeItem.findOne(identity).lean<{
      _id: mongoose.Types.ObjectId;
    }>();
    if (existing && !opts.upsert) {
      return {
        ok: false,
        error: {
          message: `Resume item already exists for "${payload.title}" (${payload.section})`,
        },
      };
    }

    if (opts.dryRun) {
      // DRY-RUN: show the *full* intended stack without writing.
      const inSkills: MaybeRelInput[] = payload.skills ?? [];
      const skills: LeanRel[] = opts.allowNew
        ? (inSkills.map(normalizeLean).filter(Boolean) as LeanRel[])
        : await resolveManyRelations(inSkills, "skill");

      return {
        ok: true,
        data: { key: identity } as PlainObject,
        summary: {
          action: existing ? "update" : "create",
          set: { ...payload, skills },
        },
      };
    }

    let result: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const resolved: LeanRel[] = await resolveManyRelations(
        payload.skills ?? [],
        "skill",
        {
          session,
          allowNew: opts.allowNew,
          backfillSlug: true,
        }
      );

      // Fallback: if some requested skills are still unresolved but allowNew=true,
      // upsert them into Skill and append.
      if (opts.allowNew) {
        const resolvedSlugs = new Set(resolved.map((s) => s.slug));
        const requested: MaybeRelInput[] = payload.skills ?? [];
        for (const rel of requested) {
          const { slug, name } = desiredSlugName(rel);
          if (!slug) continue;
          if (resolvedSlugs.has(slug)) continue;

          const doc = await Skill.findOneAndUpdate(
            { slug },
            { $setOnInsert: { slug, name: name ?? slug } },
            { upsert: true, new: true, session: session ?? undefined }
          ).lean<{ slug: string; name?: string } | null>();
          if (doc?.slug) {
            resolved.push({
              slug: doc.slug,
              name: doc.name ?? name ?? doc.slug,
            });
            resolvedSlugs.add(doc.slug);
          }
        }
      }

      const data: PlainObject = { ...payload, skills: resolved };

      if (existing) {
        await ResumeItem.updateOne({ _id: existing._id }, data, {
          session: session ?? undefined,
        });
        const found = await ResumeItem.findById(existing._id)
          .session(session ?? null)
          .lean<PlainObject | null>();
        result = found ?? {};
      } else {
        const saved = await new ResumeItem(data).save({
          session: session ?? undefined,
        });
        result = saved.toObject() as PlainObject;
      }
    });

    return { ok: true, data: result ?? {} };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to create resume item";
    return { ok: false, error: { message } };
  }
}

// ---------- UPDATE by ID ----------

export async function updateResumeItemById(
  id: string,
  patch: ResumeItemUpdate,
  opts: CreateOpts = {}
): Promise<{ ok: true; data: PlainObject } | { ok: false; error: RepoError }> {
  try {
    const existing = await ResumeItem.findById(id).lean<{
      _id: mongoose.Types.ObjectId;
    }>();
    if (!existing)
      return { ok: false, error: { message: `Resume item "${id}" not found` } };

    if (opts.dryRun) {
      const plan: DryRunPlan = { action: "update", id, set: {} };

      (
        [
          "section",
          "title",
          "organization",
          "location",
          "startDate",
          "endDate",
          "current",
          "bullets",
          "links",
          "order",
          "hidden",
        ] as const
      ).forEach((k) => {
        const v = patch[k];
        if (v !== undefined) {
          (plan.set as Record<string, unknown>)[k] = v as unknown;
        }
      });

      if (patch.skills !== undefined) {
        const inSkills: MaybeRelInput[] = patch.skills ?? [];
        plan.set.skills = opts.allowNew
          ? (inSkills.map(normalizeLean).filter(Boolean) as LeanRel[])
          : await resolveManyRelations(inSkills, "skill");
      }
      return { ok: true, data: plan as unknown as PlainObject };
    }

    let updated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const set: PlainObject = {};

      const put = <K extends keyof ResumeItemUpdate>(k: K) => {
        const v = patch[k];
        if (v !== undefined) (set as Record<string, unknown>)[k as string] = v;
      };

      put("section");
      put("title");
      put("organization");
      put("location");
      put("startDate");
      put("endDate");
      put("current");
      put("bullets");
      put("links");
      put("order");
      put("hidden");

      if (patch.skills !== undefined) {
        const resolved: LeanRel[] = await resolveManyRelations(
          patch.skills ?? [],
          "skill",
          {
            session,
            allowNew: opts.allowNew,
            backfillSlug: true,
          }
        );

        if (opts.allowNew) {
          const resolvedSlugs = new Set(resolved.map((s) => s.slug));
          const requested: MaybeRelInput[] = patch.skills ?? [];
          for (const rel of requested) {
            const { slug, name } = desiredSlugName(rel);
            if (!slug) continue;
            if (resolvedSlugs.has(slug)) continue;

            const doc = await Skill.findOneAndUpdate(
              { slug },
              { $setOnInsert: { slug, name: name ?? slug } },
              { upsert: true, new: true, session: session ?? undefined }
            ).lean<{ slug: string; name?: string } | null>();
            if (doc?.slug) {
              resolved.push({
                slug: doc.slug,
                name: doc.name ?? name ?? doc.slug,
              });
              resolvedSlugs.add(doc.slug);
            }
          }
        }

        // Validate every requested relation was resolved
        for (const rel of patch.skills ?? []) {
          const norm = normalizeLean(rel);
          if (!norm) {
            throw new Error(`Unresolved relation in skills (missing slug)`);
          }
          if (!resolved.find((s) => s.slug === norm.slug)) {
            throw new Error(`Unresolved relation: skills.slug="${norm.slug}"`);
          }
        }

        (set as Record<string, unknown>).skills = resolved;
      }

      await ResumeItem.updateOne({ _id: existing._id }, set, {
        session: session ?? undefined,
      });
      const found = await ResumeItem.findById(existing._id)
        .session(session ?? null)
        .lean<PlainObject | null>();
      updated = found ?? {};
    });

    return { ok: true, data: updated ?? {} };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to update resume item";
    return { ok: false, error: { message } };
  }
}

// ---------- DELETE ----------

export async function deleteResumeItemById(
  id: string
): Promise<
  { ok: true; deletedCount: number } | { ok: false; error: RepoError }
> {
  try {
    const res = await ResumeItem.deleteOne({ _id: id as unknown });
    if ((res.deletedCount ?? 0) === 0)
      return { ok: false, error: { message: `Resume item "${id}" not found` } };
    return { ok: true, deletedCount: res.deletedCount ?? 0 };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to delete resume item";
    return { ok: false, error: { message } };
  }
}
