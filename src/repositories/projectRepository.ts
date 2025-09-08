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

type PartialRelationsInput = {
  skills?: Array<{ slug?: string; name?: string }>;
  tasks?: Array<{ slug?: string; name?: string }>;
  type?: { slug?: string; name?: string } | null;
  client?: { slug?: string; name?: string } | null;
  studio?: { slug?: string; name?: string } | null;
};

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

    const payloadRel = payload as unknown as PartialRelationsInput;

    if (opts.dryRun) {
      const plan = {
        action: existing ? "update" : "create",
        slug: payload.slug,
        set: {
          skills: await resolveManyRelations(payloadRel.skills, "skill"),
          tasks: await resolveManyRelations(payloadRel.tasks, "task"),
          type: await resolveOneRelation(payloadRel.type, "type"),
          client: await resolveOneRelation(payloadRel.client, "client"),
          studio: await resolveOneRelation(payloadRel.studio, "studio"),
        },
      };
      return { ok: true, data: { slug: payload.slug }, summary: plan };
    }

    let out: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const relOpts = { session, allowNew: opts.allowNew };

      const skills = await resolveManyRelations(
        payloadRel.skills,
        "skill",
        relOpts
      );
      const tasks = await resolveManyRelations(
        payloadRel.tasks,
        "task",
        relOpts
      );
      const type = await resolveOneRelation(payloadRel.type, "type", relOpts);
      const client = await resolveOneRelation(
        payloadRel.client,
        "client",
        relOpts
      );
      const studio = await resolveOneRelation(
        payloadRel.studio,
        "studio",
        relOpts
      );

      const unresolved: string[] = [];
      if (payloadRel.type && !type)
        unresolved.push(`type.slug="${payloadRel.type.slug}"`);
      if (payloadRel.client && !client)
        unresolved.push(`client.slug="${payloadRel.client.slug}"`);
      if (payloadRel.studio && !studio)
        unresolved.push(`studio.slug="${payloadRel.studio.slug}"`);

      for (const rel of payloadRel.skills ?? []) {
        if (!skills.find((s) => s.slug === rel?.slug))
          unresolved.push(`skills.slug="${rel?.slug}"`);
      }
      for (const rel of payloadRel.tasks ?? []) {
        if (!tasks.find((t) => t.slug === rel?.slug))
          unresolved.push(`tasks.slug="${rel?.slug}"`);
      }

      if (unresolved.length)
        throw new Error(`Unresolved relations: ${unresolved.join(", ")}`);

      const data: PlainObject = {
        title: payload.title,
        slug: payload.slug,
        summary: (payload as Record<string, unknown>).summary,
        description: (payload as Record<string, unknown>).description,
        url: (payload as Record<string, unknown>).url,
        repoUrl: (payload as Record<string, unknown>).repoUrl,
        thumb: (payload as Record<string, unknown>).thumb,
        media: (payload as Record<string, unknown>).media ?? [],
        // relations
        skills,
        tasks,
        type,
        client,
        studio,
        // flags / ordering
        published: (payload as Record<string, unknown>).published ?? false,
        featured: (payload as Record<string, unknown>).featured ?? false,
        order: (payload as Record<string, unknown>).order,
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

    const patchRel = patch as unknown as PartialRelationsInput;

    if (opts.dryRun) {
      const set: Record<string, unknown> = {};
      if (patchRel.skills !== undefined)
        set.skills = await resolveManyRelations(patchRel.skills, "skill");
      if (patchRel.tasks !== undefined)
        set.tasks = await resolveManyRelations(patchRel.tasks, "task");
      if (patchRel.type !== undefined)
        set.type = await resolveOneRelation(patchRel.type, "type");
      if (patchRel.client !== undefined)
        set.client = await resolveOneRelation(patchRel.client, "client");
      if (patchRel.studio !== undefined)
        set.studio = await resolveOneRelation(patchRel.studio, "studio");

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
          set[k] = (patch as Record<string, unknown>)[k];
        }
      }

      const plan = { action: "update", slug, set };
      return { ok: true, data: plan as unknown as PlainObject };
    }

    let updated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const set: Record<string, unknown> = {};
      const put = (k: keyof ProjectUpdate) => {
        const v = (patch as Record<string, unknown>)[k as string];
        if (v !== undefined) set[k as string] = v;
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

      if (patchRel.skills !== undefined) {
        const skills = await resolveManyRelations(
          patchRel.skills,
          "skill",
          relOpts
        );
        for (const rel of patchRel.skills ?? []) {
          if (!skills.find((s: LeanRel) => s.slug === rel?.slug))
            unresolved.push(`skills.slug="${rel?.slug}"`);
        }
        set.skills = skills;
      }

      if (patchRel.tasks !== undefined) {
        const tasks = await resolveManyRelations(
          patchRel.tasks,
          "task",
          relOpts
        );
        for (const rel of patchRel.tasks ?? []) {
          if (!tasks.find((t: LeanRel) => t.slug === rel?.slug))
            unresolved.push(`tasks.slug="${rel?.slug}"`);
        }
        set.tasks = tasks;
      }

      if (patchRel.type !== undefined) {
        const type = await resolveOneRelation(patchRel.type, "type", relOpts);
        if (patchRel.type && !type)
          unresolved.push(`type.slug="${patchRel.type.slug}"`);
        set.type = type;
      }

      if (patchRel.client !== undefined) {
        const client = await resolveOneRelation(
          patchRel.client,
          "client",
          relOpts
        );
        if (patchRel.client && !client)
          unresolved.push(`client.slug="${patchRel.client.slug}"`);
        set.client = client;
      }

      if (patchRel.studio !== undefined) {
        const studio = await resolveOneRelation(
          patchRel.studio,
          "studio",
          relOpts
        );
        if (patchRel.studio && !studio)
          unresolved.push(`studio.slug="${patchRel.studio.slug}"`);
        set.studio = studio;
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
