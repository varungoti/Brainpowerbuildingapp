import { readFileSync } from "node:fs";

const adminBase = process.env.GROWTH_ADMIN_API_BASE;
const token = process.env.GROWTH_ADMIN_BEARER_TOKEN;

if (!adminBase || !token) {
  console.error("Set GROWTH_ADMIN_API_BASE and GROWTH_ADMIN_BEARER_TOKEN before seeding campaigns.");
  process.exit(1);
}

const seed = JSON.parse(readFileSync("automation/growth-campaigns/seed-campaigns.json", "utf8"));

async function post(path, body) {
  const res = await fetch(`${adminBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed ${res.status}: ${text}`);
  }
  return res.json();
}

for (const campaign of seed.campaigns) {
  if (campaign.segment === "internal") continue;
  await post("/admin/growth/campaigns", {
    name: campaign.name,
    channel: campaign.channel.includes("webinar") ? "webinar" : campaign.channel.includes("social") ? "social" : campaign.channel.includes("partner") ? "partner" : "email",
    audience: campaign.segment,
    offer: campaign.offer,
    hypothesis: `If we run ${campaign.name}, then ${campaign.successMetric}.`,
    successMetric: campaign.successMetric,
    failMetric: "No qualified lead, revenue, demo, or partner signal within 7 days.",
    dryRunRequired: true,
    approvalRequired: true,
  });
  console.log(`Seeded campaign: ${campaign.name}`);
}

console.log("Growth campaign seed complete.");
