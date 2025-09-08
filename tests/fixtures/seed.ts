import { Skill } from "@/models/Skill";
import { Task } from "@/models/Task";
import { Client } from "@/models/Client";
import { Studio } from "@/models/Studio";
import { Type } from "@/models/Type";
import { Project } from "@/models/Project";

export async function seedBasic() {
  await Skill.insertMany([
    { name: "React", slug: "react" },
    { name: "Next.js", slug: "nextjs" },
    { name: "Tailwind", slug: "tailwind" },
    { name: "Node.js", slug: "nodejs" },
  ]);

  await Task.insertMany([
    { name: "Frontend", slug: "frontend" },
    { name: "Backend", slug: "backend" },
    { name: "Design System", slug: "design-system" },
  ]);

  await Client.insertMany([{ name: "Corsair", slug: "corsair" }]);
  await Studio.insertMany([{ name: "Jellybox Studio", slug: "jellybox" }]);

  await Type.insertMany([
    { name: "Business", slug: "business" },
    { name: "Web App", slug: "web-app" },
  ]);

  // 👇 Projects expect slug-based embedded relations
  await Project.insertMany([
    {
      title: "Gamer Sensei Migration",
      slug: "gamer-sensei-migration",
      abbreviation: "gs",
      published: true,
      featured: false,
      order: 1,
      thumb: "gs/thumb.jpg",
      media: ["gs/page01.jpg", "gs/page02.jpg"],
      // embedded relations w/ slug
      client: { slug: "corsair" },
      studio: { slug: "jellybox" },
      type: { slug: "web-app" },
      skills: [{ slug: "react" }, { slug: "nextjs" }, { slug: "tailwind" }],
      tasks: [{ slug: "frontend" }, { slug: "design-system" }],
    },
    {
      title: "DAPshow Portfolio",
      slug: "dapshow-portfolio",
      abbreviation: "dap",
      published: true,
      featured: false,
      order: 2,
      thumb: "dap/thumb.jpg",
      media: ["dap/page01.jpg"],
      client: null,
      studio: { slug: "jellybox" },
      type: { slug: "business" },
      skills: [{ slug: "react" }, { slug: "tailwind" }],
      tasks: [{ slug: "frontend" }],
    },
  ]);
}
