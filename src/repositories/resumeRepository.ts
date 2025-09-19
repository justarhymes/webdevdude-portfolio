import mongoose from "mongoose";
import { ResumeItem } from "@/models/ResumeItem";
import { Skill } from "@/models/Skill";
import { ResumeItemInput, ResumeItemUpdate } from "@/domain/resume";
import { resolveManyRelations } from "@/repositories/relationResolvers";
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
type DryRunPlan = {
  action: "create" | "update";
  id?: string;
  set: Record<string, unknown>;
};

// CREATE / UPSERT
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
      // If allowNew, synthesize slugs for name-only skills so you can preview.
      const inSkills = payload.skills ?? [];
      const skills = opts.allowNew
        ? (inSkills
            .map((s: any) => {
              const name: string | undefined =
                s?.name ?? (typeof s?.slug === "string" ? s.slug : undefined);
              const slug: string | undefined =
                typeof s?.slug === "string"
                  ? s.slug
                  : name
                  ? slugify(name)
                  : undefined;
              return slug ? ({ slug, name } as LeanRel) : undefined;
            })
            .filter(Boolean) as LeanRel[])
        : await resolveManyRelations(inSkills, "skill"); // strict preview when not allowing new

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
      let skills = await resolveManyRelations(payload.skills, "skill", {
        session,
        allowNew: opts.allowNew,
        backfillSlug: true,
      });
      // Fallback: if some requested skills are still unresolved but allowNew=true,
      // upsert them directly into the Skill catalog and append to the resolved list.
      if (opts.allowNew) {
        const resolvedSlugs = new Set(
          (skills as Array<{ slug: string }>).map((s) => s.slug)
        );
        for (const rel of payload.skills ?? []) {
          const wantSlug =
            (rel as any)?.slug ??
            ((rel as any)?.name ? slugify((rel as any).name) : undefined);
          const wantName =
            (rel as any)?.name ??
            (typeof (rel as any)?.slug === "string"
              ? (rel as any).slug
              : undefined);
          if (!wantSlug) continue;
          if (resolvedSlugs.has(wantSlug)) continue;
          const doc = await Skill.findOneAndUpdate(
            { slug: wantSlug },
            { $setOnInsert: { slug: wantSlug, name: wantName ?? wantSlug } },
            { upsert: true, new: true, session: session ?? undefined }
          ).lean<{ slug: string; name?: string } | null>();
          if (doc?.slug) {
            skills.push({
              slug: doc.slug,
              name: doc.name ?? wantName ?? doc.slug,
            } as any);
            resolvedSlugs.add(doc.slug);
          }
        }
      }
      const data: PlainObject = { ...payload, skills };

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

// UPDATE by ID
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
      for (const k of [
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
      ] as const) {
        if ((patch as Record<string, unknown>)[k] !== undefined) {
          plan.set[k] = (patch as Record<string, unknown>)[k]!;
        }
      }
      if (patch.skills !== undefined) {
        const inSkills = patch.skills ?? [];
        plan.set.skills = opts.allowNew
          ? ((inSkills as any[])
              .map((s) => {
                const name: string | undefined =
                  s?.name ?? (typeof s?.slug === "string" ? s.slug : undefined);
                const slug: string | undefined =
                  typeof s?.slug === "string"
                    ? s.slug
                    : name
                    ? slugify(name)
                    : undefined;
                return slug ? ({ slug, name } as LeanRel) : undefined;
              })
              .filter(Boolean) as LeanRel[])
          : await resolveManyRelations(inSkills, "skill");
      }
      return { ok: true, data: plan as unknown as PlainObject };
    }

    let updated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const set: PlainObject = {};

      const put = (k: keyof ResumeItemUpdate) => {
        const v = patch[k];
        if (v !== undefined)
          (set as Record<string, unknown>)[k as string] = v as unknown;
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
        let skills = await resolveManyRelations(patch.skills, "skill", {
          session,
          allowNew: opts.allowNew,
          backfillSlug: true,
        });
        if (opts.allowNew) {
          const resolvedSlugs = new Set(
            (skills as Array<{ slug: string }>).map((s) => s.slug)
          );
          for (const rel of patch.skills ?? []) {
            const wantSlug =
              (rel as any)?.slug ??
              ((rel as any)?.name ? slugify((rel as any).name) : undefined);
            const wantName =
              (rel as any)?.name ??
              (typeof (rel as any)?.slug === "string"
                ? (rel as any).slug
                : undefined);
            if (!wantSlug) continue;
            if (resolvedSlugs.has(wantSlug)) continue;
            const doc = await Skill.findOneAndUpdate(
              { slug: wantSlug },
              { $setOnInsert: { slug: wantSlug, name: wantName ?? wantSlug } },
              { upsert: true, new: true, session: session ?? undefined }
            ).lean<{ slug: string; name?: string } | null>();
            if (doc?.slug) {
              skills.push({
                slug: doc.slug,
                name: doc.name ?? wantName ?? doc.slug,
              } as any);
              resolvedSlugs.add(doc.slug);
            }
          }
        }
        for (const rel of patch.skills ?? []) {
          if (!skills.find((s: LeanRel) => s.slug === rel.slug)) {
            throw new Error(
              `Unresolved relation: skills.slug="${(rel as any).slug}"`
            );
          }
        }
        (set as Record<string, unknown>).skills = skills;
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
