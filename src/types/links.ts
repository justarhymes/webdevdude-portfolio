import type { Project } from "./project";
import type { Demo } from "./demo";

export type ProjectLinks = Pick<Project, "primaryLink" | "secondaryLink">;
export type DemoLinks = Pick<Demo, "url" | "repoUrl">;