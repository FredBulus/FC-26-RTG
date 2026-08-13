import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { writeFileSync } from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const gameWeek = Number(process.argv[2] ?? "1");

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before generating a poster.");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

type PosterFixture = {
  matchday: number;
  groups: { name: string } | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fixtureLine(match: PosterFixture) {
  const [firstTeam, secondTeam] = [match.home_team?.name ?? "TBC", match.away_team?.name ?? "TBC"].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return `${escapeXml(firstTeam)} <tspan class="versus">v</tspan> ${escapeXml(secondTeam)}`;
}

function slugify(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

async function main() {
  const { data, error } = await supabase
    .from("fixtures")
    .select("matchday, groups(name), home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)")
    .eq("matchday", gameWeek)
    .order("created_at");

  if (error) throw error;

  const fixtures = (data ?? []) as unknown as PosterFixture[];
  const groups = fixtures.reduce<Record<string, PosterFixture[]>>((acc, match) => {
    const groupName = match.groups?.name ?? "Ungrouped";
    acc[groupName] = acc[groupName] ?? [];
    acc[groupName].push(match);
    return acc;
  }, {});

  const groupNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  const sharedDefs = `
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#370050" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#370050"/>
      <stop offset="100%" stop-color="#100018"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#260034" flood-opacity="0.16"/>
    </filter>`;

  for (const groupName of groupNames) {
    const groupFixtures = groups[groupName];
    const width = 1200;
    const height = 1900;
    const rowStart = 420;
    const rowHeight = 46;
    const rows = groupFixtures.map((match, index) => {
      const y = rowStart + index * rowHeight;
      const [firstTeam, secondTeam] = [match.home_team?.name ?? "TBC", match.away_team?.name ?? "TBC"].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );

      return `
        <g filter="url(#rowShadow)">
          <rect x="80" y="${y - 30}" width="1040" height="40" rx="6" fill="${index % 2 === 0 ? "#ffffff" : "#fbf3ff"}"/>
          <text x="118" y="${y - 4}" class="rowNumber">${String(index + 1).padStart(2, "0")}</text>
          <text x="184" y="${y - 4}" class="team home">${escapeXml(firstTeam)}</text>
          <rect x="555" y="${y - 29}" width="90" height="38" rx="19" fill="#370050"/>
          <text x="600" y="${y - 3}" text-anchor="middle" class="vPill">v</text>
          <text x="682" y="${y - 4}" class="team">${escapeXml(secondTeam)}</text>
        </g>`;
    }).join("");

    const groupSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">FC 26 Game Week ${gameWeek} ${escapeXml(groupName)} Matches</title>
  <desc id="desc">Shareable FC 26 League Game Week ${gameWeek} matchups for ${escapeXml(groupName)}.</desc>
  <defs>
    ${sharedDefs}
    <filter id="rowShadow" x="-5%" y="-30%" width="110%" height="170%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#260034" flood-opacity="0.08"/>
    </filter>
    <style>
      .eyebrow { font: 900 28px Arial, Helvetica, sans-serif; letter-spacing: 8px; fill: #ffd44d; }
      .title { font: 900 76px Arial, Helvetica, sans-serif; fill: #ffffff; }
      .subtitle { font: 900 30px Arial, Helvetica, sans-serif; fill: #ffffff; opacity: 0.9; }
      .badge { font: 900 28px Arial, Helvetica, sans-serif; fill: #260034; }
      .rowNumber { font: 900 20px Arial, Helvetica, sans-serif; fill: #8f779a; }
      .team { font: 900 25px Arial, Helvetica, sans-serif; fill: #260034; }
      .home { text-anchor: start; }
      .vPill { font: 900 23px Arial, Helvetica, sans-serif; fill: #04f5ff; }
      .footer { font: 900 28px Arial, Helvetica, sans-serif; fill: #260034; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="#f7f1fb"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <circle cx="1050" cy="230" r="270" fill="#04f5ff" opacity="0.18"/>
  <circle cx="120" cy="1700" r="290" fill="#ff2882" opacity="0.12"/>
  <g filter="url(#shadow)">
    <rect x="70" y="70" width="1060" height="240" rx="30" fill="url(#hero)"/>
    <text x="115" y="142" class="eyebrow">FC 26 LEAGUE</text>
    <text x="115" y="226" class="title">Game Week ${gameWeek}</text>
    <rect x="808" y="130" width="242" height="70" rx="18" fill="#04f5ff"/>
    <text x="929" y="174" text-anchor="middle" class="badge">${escapeXml(groupName)}</text>
    <text x="115" y="278" class="subtitle">${groupFixtures.length} matches</text>
  </g>
  <g>
    ${rows}
  </g>
  <text x="${width / 2}" y="1832" text-anchor="middle" class="footer">Play early. Stream if possible. Send result screenshots.</text>
</svg>`;

    const groupSvgPath = path.join(process.cwd(), "public", `fc26-gw${gameWeek}-${slugify(groupName)}-fixtures.svg`);
    writeFileSync(groupSvgPath, groupSvg);
    console.log(groupSvgPath);
  }

  const width = 1600;
  const height = 2300;
  const columnWidth = 700;
  const rowHeight = 54;
  const rowStart = 520;

  const columns = groupNames.map((groupName, groupIndex) => {
    const x = 90 + groupIndex * 780;
    const rows = groups[groupName]
      .map((match, index) => {
        const y = rowStart + index * rowHeight;
        return `
          <g>
            <rect x="${x}" y="${y - 34}" width="${columnWidth}" height="44" rx="10" fill="${index % 2 === 0 ? "#ffffff" : "#f9f0fb"}" opacity="0.95"/>
            <text x="${x + 24}" y="${y - 6}" class="fixture"><tspan class="number">${index + 1}.</tspan> ${fixtureLine(match)}</text>
          </g>`;
      })
      .join("");

    return `
      <g filter="url(#shadow)">
        <rect x="${x}" y="390" width="${columnWidth}" height="1780" rx="24" fill="#ffffff" stroke="#eadff1" stroke-width="2"/>
        <rect x="${x}" y="390" width="${columnWidth}" height="88" rx="24" fill="#370050"/>
        <text x="${x + 34}" y="446" class="groupTitle">${escapeXml(groupName)}</text>
        ${rows}
      </g>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">FC 26 Game Week ${gameWeek} Matches</title>
  <desc id="desc">Shareable FC 26 League Game Week ${gameWeek} matchup poster split by group.</desc>
  <defs>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#370050" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#370050"/>
      <stop offset="100%" stop-color="#100018"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#260034" flood-opacity="0.16"/>
    </filter>
    <style>
      .eyebrow { font: 900 34px Arial, Helvetica, sans-serif; letter-spacing: 9px; fill: #ffd44d; }
      .title { font: 900 86px Arial, Helvetica, sans-serif; fill: #ffffff; }
      .subtitle { font: 800 34px Arial, Helvetica, sans-serif; fill: #ffffff; opacity: 0.86; }
      .groupTitle { font: 900 38px Arial, Helvetica, sans-serif; fill: #ffffff; }
      .fixture { font: 800 24px Arial, Helvetica, sans-serif; fill: #260034; }
      .footer { font: 900 34px Arial, Helvetica, sans-serif; fill: #260034; }
      .number { fill: #8f779a; }
      .versus { fill: #ff2882; font-weight: 900; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="#f7f1fb"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <circle cx="1320" cy="260" r="300" fill="#04f5ff" opacity="0.18"/>
  <circle cx="160" cy="2060" r="360" fill="#ff2882" opacity="0.12"/>
  <g filter="url(#shadow)">
    <rect x="70" y="70" width="1460" height="250" rx="32" fill="url(#hero)"/>
    <text x="120" y="145" class="eyebrow">FC 26 LEAGUE</text>
    <text x="120" y="238" class="title">Game Week ${gameWeek} Matches</text>
    <text x="1130" y="177" class="subtitle">${fixtures.length} matches</text>
  </g>
  ${columns}
  <text x="${width / 2}" y="2244" text-anchor="middle" class="footer">Play early. Stream if possible. Send result screenshots.</text>
</svg>`;

  const svgPath = path.join(process.cwd(), "public", `fc26-gw${gameWeek}-fixtures.svg`);
  writeFileSync(svgPath, svg);
  console.log(svgPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
