import mongoose from "mongoose";
import { Demo } from "@/models/Demo";
import { DemoInput, DemoUpdate } from "@/domain/demo";
import {
  resolveOneRelation,
  resolveManyRelations,
} from "@/repositories/relationResolvers";
import type { PublicIssue } from "@/lib/parse";
import { withOptionalTransaction } from "@/lib/tx";

export type CreateOpts = { dryRun?: boolean; upsert?: boolean; allowNew?: boolean };
type RepoError = { message: string; issues?: ReadonlyArray<PublicIssue> };

type LeanRel = { slug: string; name?: string };
type PlainObject = Record<string, unknown>;
type DryRunPlan = {
  action: "create" | "update";
  slug: string;
  set: {
    skills?: LeanRel[];
    type?: LeanRel;
    client?: LeanRel;
    studio?: LeanRel;
    [k: string]: unknown;
  };
};

export async function createDemo(
  payload: DemoInput,
  opts: CreateOpts = {}
): Promise<{ ok: true; data: PlainObject; summary?: DryRunPlan } | { ok: false; error: RepoError }> {
  try {
    const existing = await Demo.findOne({ slug: payload.slug })
      .lean<{ _id: mongoose.Types.ObjectId }>();

    if (existing && !opts.upsert) {
      return { ok: false, error: { message: `Demo with slug "${payload.slug}" already exists` } };
    }

    if (opts.dryRun) {
      const plan: DryRunPlan = {
        action: existing ? "update" : "create",
        slug: payload.slug,
        set: {
          skills: await resolveManyRelations(payload.skills, "skill"),
          type: await resolveOneRelation(payload.type, "type"),
          client: await resolveOneRelation(payload.client, "client"),
          studio: await resolveOneRelation(payload.studio, "studio"),
        },
      };
      return { ok: true, data: { slug: payload.slug }, summary: plan };
    }

    let createdOrUpdated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const relOpts = { session, allowNew: opts.allowNew };
      const skills = await resolveManyRelations(payload.skills, "skill", relOpts);
      const type = await resolveOneRelation(payload.type, "type", relOpts);
      const client = await resolveOneRelation(payload.client, "client", relOpts);
      const studio = await resolveOneRelation(payload.studio, "studio", relOpts);

      const unresolved: string[] = [];
      if (payload.type && !type) unresolved.push(`type.slug="${payload.type.slug}"`);
      if (payload.client && !client) unresolved.push(`client.slug="${payload.client.slug}"`);
      if (payload.studio && !studio) unresolved.push(`studio.slug="${payload.studio.slug}"`);
      for (const rel of payload.skills ?? []) {
        if (!skills.find((s) => s.slug === rel.slug)) unresolved.push(`skills.slug="${rel.slug}"`);
      }
      if (unresolved.length) {
        throw new Error(
          `Unresolved relations: ${unresolved.join(
            ", "
          )}. Pass "?allowNew=1" and use {_new:true} on new relations to create them.`
        );
      }

      const data: PlainObject = {
        title: payload.title,
        slug: payload.slug,
        summary: payload.summary,
        description: payload.description,
        url: payload.url,
        repoUrl: payload.repoUrl,
        thumb: payload.thumb,
        media: payload.media ?? [],
        skills,
        type,
        client,
        studio,
        published: payload.published ?? false,
        featured: payload.featured ?? false,
        order: payload.order,
      };

      if (existing) {
        await Demo.updateOne({ _id: existing._id }, data, { session: session ?? undefined });
        const found = await Demo.findById(existing._id).session(session ?? null).lean<PlainObject | null>();
        createdOrUpdated = found ?? {};
      } else {
        const saved = await new Demo(data).save({ session: session ?? undefined });
        createdOrUpdated = saved.toObject() as PlainObject;
      }
    });

    return { ok: true, data: createdOrUpdated ?? {} };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create demo";
    return { ok: false, error: { message } };
  }
}

export async function updateDemoBySlug(
  slug: string,
  patch: DemoUpdate,
  opts: CreateOpts = {}
): Promise<{ ok: true; data: PlainObject } | { ok: false; error: RepoError }> {
  try {
    const existing = await Demo.findOne({ slug }).lean<{ _id: mongoose.Types.ObjectId }>();
    if (!existing) return { ok: false, error: { message: `Demo "${slug}" not found` } };

    if (opts.dryRun) {
      const plan: DryRunPlan = { action: "update", slug, set: {} };
      if (patch.skills !== undefined) plan.set.skills = await resolveManyRelations(patch.skills, "skill");
      if (patch.type !== undefined) plan.set.type = await resolveOneRelation(patch.type, "type");
      if (patch.client !== undefined) plan.set.client = await resolveOneRelation(patch.client, "client");
      if (patch.studio !== undefined) plan.set.studio = await resolveOneRelation(patch.studio, "studio");
      for (const k of [
        "title","summary","description","url","repoUrl","thumb","media","published","featured","order",
      ] as const) {
        if ((patch as Record<string, unknown>)[k] !== undefined) {
          (plan.set as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k];
        }
      }
      return { ok: true, data: plan as unknown as PlainObject };
    }

    let updated: PlainObject | null = null;

    await withOptionalTransaction(async (session) => {
      const set: PlainObject = {};

      const assign = <K extends keyof DemoUpdate>(k: K) => {
        const v = patch[k];
        if (v !== undefined) (set as Record<string, unknown>)[k as string] = v as unknown;
      };

      assign("title"); assign("summary"); assign("description");
      assign("url"); assign("repoUrl"); assign("thumb"); assign("media");
      assign("published"); assign("featured"); assign("order");

      const relOpts = { session, allowNew: opts.allowNew };
      const unresolved: string[] = [];

      if (patch.skills !== undefined) {
        const skills = await resolveManyRelations(patch.skills, "skill", relOpts);
        for (const rel of patch.skills ?? []) {
          if (!skills.find((s) => s.slug === rel.slug)) unresolved.push(`skills.slug="${rel.slug}"`);
        }
        (set as Record<string, unknown>).skills = skills;
      }
      if (patch.type !== undefined) {
        const type = await resolveOneRelation(patch.type, "type", relOpts);
        if (patch.type && !type) unresolved.push(`type.slug="${patch.type.slug}"`);
        (set as Record<string, unknown>).type = type;
      }
      if (patch.client !== undefined) {
        const client = await resolveOneRelation(patch.client, "client", relOpts);
        if (patch.client && !client) unresolved.push(`client.slug="${patch.client.slug}"`);
        (set as Record<string, unknown>).client = client;
      }
      if (patch.studio !== undefined) {
        const studio = await resolveOneRelation(patch.studio, "studio", relOpts);
        if (patch.studio && !studio) unresolved.push(`studio.slug="${patch.studio.slug}"`);
        (set as Record<string, unknown>).studio = studio;
      }

      if (unresolved.length) {
        throw new Error(
          `Unresolved relations: ${unresolved.join(", ")}. Pass "?allowNew=1" and include {_new:true} to create new ones.`
        );
      }

      await Demo.updateOne({ _id: existing._id }, set, { session: session ?? undefined });
      const found = await Demo.findById(existing._id).session(session ?? null).lean<PlainObject | null>();
      updated = found ?? {};
    });

    return { ok: true, data: updated ?? {} };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update demo";
    return { ok: false, error: { message } };
  }
}

export async function deleteDemoBySlug(
  slug: string
): Promise<{ ok: true; deletedCount: number } | { ok: false; error: RepoError }> {
  try {
    const res = await Demo.deleteOne({ slug });
    if ((res.deletedCount ?? 0) === 0) return { ok: false, error: { message: `Demo "${slug}" not found` } };
    return { ok: true, deletedCount: res.deletedCount ?? 0 };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete demo";
    return { ok: false, error: { message } };
  }
}
