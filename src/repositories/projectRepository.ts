import mongoose from "mongoose";
import { Project } from "@/models/Project";
import { ProjectInput, ProjectUpdate } from "@/domain/project";
import {
  resolveOneRelation,
  resolveManyRelations,
} from "@/repositories/relationResolvers";
import { withOptionalTransaction } from "@/lib/tx";
import type { PublicIssue } from "@/lib/parse";

export type CreateOpts = {
  dryRun?: boolean;
  upsert?: boolean;
  allowNew?: boolean;
};
type RepoError = { message: string; issues?: ReadonlyArray<PublicIssue> };
type PlainObject = Record<string, unknown>;
type LeanRel = { slug: string; name?: string };

export async function createProject(
  payload: ProjectInput,
  opts: CreateOpts = {}
): Promise<
  | { ok: true; data: PlainObject; summary?: unknown }
  | { ok: false; error: RepoError }
> {
  try {
    const existing = await Project.findOne({ slug: payload.slug }).lean<{
      _id: mongoose.Types.ObjectId;
    }>();

    if (existing && !opts.upsert) {
      return {
        ok: false,
        error: {
          message: `Project with slug "${payload.slug}" already exists`,
        },
      };
    }

    // ⚠️ We may not have tasks on ProjectInput yet; use a lenient view
    const payloadAny = payload as unknown as {
      skills?: Array<{ slug?: string; name?: string }>;
      tasks?: Array<{ slug?: string; name?: string }>;
      type?: { slug?: string; name?: string } | null;
      client?: { slug?: string; name?: string } | null;
      studio?: { slug?: string; name?: string } | null;
      media?: unknown[];
      [k: string]: unknown;
    };

    if (opts.dryRun) {
      const plan = {
        action: existing ? "update" : "create",
        slug: payload.slug,
        set: {
          skills: await resolveManyRelations(payloadAny.skills, "skill"),
          tasks: await resolveManyRelations(payloadAny.tasks, "task"),
          type: await resolveOneRelation(payloadAny.type, "type"),
          client: await resolveOneRelation(payloadAny.client, "client"),
          studio: await resolveOneRelation(payloadAny.studio, "studio"),
        },
      };
      return { ok: true, data: { slug: payload.slug }, summary: plan };
    }

    let out: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const relOpts = { session, allowNew: opts.allowNew };

      const skills = await resolveManyRelations(
        payloadAny.skills,
        "skill",
        relOpts
      );
      const tasks = await resolveManyRelations(
        payloadAny.tasks,
        "task",
        relOpts
      );
      const type = await resolveOneRelation(payloadAny.type, "type", relOpts);
      const client = await resolveOneRelation(
        payloadAny.client,
        "client",
        relOpts
      );
      const studio = await resolveOneRelation(
        payloadAny.studio,
        "studio",
        relOpts
      );

      const unresolved: string[] = [];
      if (payloadAny.type && !type)
        unresolved.push(`type.slug="${payloadAny.type.slug}"`);
      if (payloadAny.client && !client)
        unresolved.push(`client.slug="${payloadAny.client.slug}"`);
      if (payloadAny.studio && !studio)
        unresolved.push(`studio.slug="${payloadAny.studio.slug}"`);

      for (const rel of payloadAny.skills ?? []) {
        if (!skills.find((s) => s.slug === rel?.slug))
          unresolved.push(`skills.slug="${rel?.slug}"`);
      }
      for (const rel of payloadAny.tasks ?? []) {
        if (!tasks.find((t) => t.slug === rel?.slug))
          unresolved.push(`tasks.slug="${rel?.slug}"`);
      }

      if (unresolved.length)
        throw new Error(`Unresolved relations: ${unresolved.join(", ")}`);

      const data: PlainObject = {
        title: (payload as any).title,
        slug: payload.slug,
        summary: (payload as any).summary,
        description: (payload as any).description,
        url: (payload as any).url,
        repoUrl: (payload as any).repoUrl,
        thumb: (payload as any).thumb,
        media: (payload as any).media ?? [],
        // relations
        skills,
        tasks,
        type,
        client,
        studio,
        // flags / ordering
        published: (payload as any).published ?? false,
        featured: (payload as any).featured ?? false,
        order: (payload as any).order,
      };

      if (existing) {
        await Project.updateOne({ _id: existing._id }, data, {
          session: session ?? undefined,
        });
        const found = await Project.findById(existing._id)
          .session(session ?? null)
          .lean<PlainObject | null>();
        out = found ?? {};
      } else {
        const saved = await new Project(data).save({
          session: session ?? undefined,
        });
        out = saved.toObject() as PlainObject;
      }
    });

    return { ok: true, data: out ?? {} };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create project";
    return { ok: false, error: { message } };
  }
}

export async function updateProjectBySlug(
  slug: string,
  patch: ProjectUpdate,
  opts: CreateOpts = {}
): Promise<{ ok: true; data: PlainObject } | { ok: false; error: RepoError }> {
  try {
    const existing = await Project.findOne({ slug }).lean<{
      _id: mongoose.Types.ObjectId;
    }>();
    if (!existing)
      return { ok: false, error: { message: `Project "${slug}" not found` } };

    // Lenient access to tasks (and any future relations) without changing ProjectUpdate type yet
    const patchAny = patch as unknown as {
      skills?: Array<{ slug?: string; name?: string }>;
      tasks?: Array<{ slug?: string; name?: string }>;
      type?: { slug?: string; name?: string } | null;
      client?: { slug?: string; name?: string } | null;
      studio?: { slug?: string; name?: string } | null;
      [k: string]: unknown;
    };

    if (opts.dryRun) {
      const plan: Record<string, unknown> = { action: "update", slug, set: {} };
      if (patchAny.skills !== undefined)
        (plan.set as any).skills = await resolveManyRelations(
          patchAny.skills,
          "skill"
        );
      if (patchAny.tasks !== undefined)
        (plan.set as any).tasks = await resolveManyRelations(
          patchAny.tasks,
          "task"
        );
      if (patchAny.type !== undefined)
        (plan.set as any).type = await resolveOneRelation(
          patchAny.type,
          "type"
        );
      if (patchAny.client !== undefined)
        (plan.set as any).client = await resolveOneRelation(
          patchAny.client,
          "client"
        );
      if (patchAny.studio !== undefined)
        (plan.set as any).studio = await resolveOneRelation(
          patchAny.studio,
          "studio"
        );

      for (const k of [
        "title",
        "summary",
        "description",
        "url",
        "repoUrl",
        "thumb",
        "media",
        "published",
        "featured",
        "order",
      ] as const) {
        if ((patch as Record<string, unknown>)[k] !== undefined) {
          (plan.set as Record<string, unknown>)[k] = (
            patch as Record<string, unknown>
          )[k];
        }
      }
      return { ok: true, data: plan as unknown as PlainObject };
    }

    let updated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const set: PlainObject = {};
      const put = (k: keyof ProjectUpdate) => {
        const v = (patch as Record<string, unknown>)[k as string];
        if (v !== undefined)
          (set as Record<string, unknown>)[k as string] = v as unknown;
      };

      put("title");
      put("summary");
      put("description");
      put("url");
      put("repoUrl");
      put("thumb");
      put("media");
      put("published");
      put("featured");
      put("order");

      const relOpts = { session, allowNew: opts.allowNew };
      const unresolved: string[] = [];

      if (patchAny.skills !== undefined) {
        const skills = await resolveManyRelations(
          patchAny.skills,
          "skill",
          relOpts
        );
        for (const rel of patchAny.skills ?? []) {
          if (!skills.find((s: LeanRel) => s.slug === rel?.slug))
            unresolved.push(`skills.slug="${rel?.slug}"`);
        }
        (set as any).skills = skills;
      }

      if (patchAny.tasks !== undefined) {
        const tasks = await resolveManyRelations(
          patchAny.tasks,
          "task",
          relOpts
        );
        for (const rel of patchAny.tasks ?? []) {
          if (!tasks.find((t: LeanRel) => t.slug === rel?.slug))
            unresolved.push(`tasks.slug="${rel?.slug}"`);
        }
        (set as any).tasks = tasks;
      }

      if (patchAny.type !== undefined) {
        const type = await resolveOneRelation(patchAny.type, "type", relOpts);
        if (patchAny.type && !type)
          unresolved.push(`type.slug="${patchAny.type.slug}"`);
        (set as any).type = type;
      }
      if (patchAny.client !== undefined) {
        const client = await resolveOneRelation(
          patchAny.client,
          "client",
          relOpts
        );
        if (patchAny.client && !client)
          unresolved.push(`client.slug="${patchAny.client.slug}"`);
        (set as any).client = client;
      }
      if (patchAny.studio !== undefined) {
        const studio = await resolveOneRelation(
          patchAny.studio,
          "studio",
          relOpts
        );
        if (patchAny.studio && !studio)
          unresolved.push(`studio.slug="${patchAny.studio.slug}"`);
        (set as any).studio = studio;
      }

      if (unresolved.length)
        throw new Error(`Unresolved relations: ${unresolved.join(", ")}`);

      await Project.updateOne({ _id: existing._id }, set, {
        session: session ?? undefined,
      });
      const found = await Project.findById(existing._id)
        .session(session ?? null)
        .lean<PlainObject | null>();
      updated = found ?? {};
    });

    return { ok: true, data: updated ?? {} };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update project";
    return { ok: false, error: { message } };
  }
}

export async function deleteProjectBySlug(
  slug: string
): Promise<
  { ok: true; deletedCount: number } | { ok: false; error: RepoError }
> {
  try {
    const res = await Project.deleteOne({ slug });
    if ((res.deletedCount ?? 0) === 0)
      return { ok: false, error: { message: `Project "${slug}" not found` } };
    return { ok: true, deletedCount: res.deletedCount ?? 0 };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete project";
    return { ok: false, error: { message } };
  }
}
