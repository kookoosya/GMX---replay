/**
 * Curated image pool for Themes V4 — generic inspired imagery only (no licensed characters).
 * Extension skins use Unsplash (Pexels blocked in some build envs); site replacements mixed.
 */

/** @type {{ slot: number, category: string, name: string, provider: string, unsplashId?: string, pexelsId?: number, photographer: string }[]} */
export const SITE_SLOT_REPLACEMENTS = [
  { slot: 14, category: "anime-inspired", name: "Neon Alley Inspired", provider: "unsplash", unsplashId: "1519501025264-65fcb10442f1", photographer: "Unsplash" },
  { slot: 32, category: "comic-inspired", name: "Pop Color Inspired", provider: "unsplash", unsplashId: "1557683316-973673baf926", photographer: "Unsplash" },
  { slot: 70, category: "superhero-inspired", name: "Skyline Hero Inspired", provider: "unsplash", unsplashId: "1419242902214-272b4f683ee6", photographer: "Unsplash" },
  { slot: 36, category: "mecha", name: "Mech Grid Inspired", provider: "unsplash", unsplashId: "1550745166-0-bc7f730998c2", photographer: "Unsplash" },
  { slot: 45, category: "fantasy", name: "Fantasy Peaks", provider: "unsplash", unsplashId: "1519681393784-d120267933ba", photographer: "Unsplash" },
  { slot: 48, category: "sci-fi", name: "Orbital Sci-Fi", provider: "unsplash", unsplashId: "1451187580459-43408879c446", photographer: "Unsplash" },
  { slot: 53, category: "anime-inspired", name: "Pastel Sky Inspired", provider: "unsplash", unsplashId: "1557682254-3ba16653db84", photographer: "Unsplash" },
  { slot: 57, category: "comic-inspired", name: "Halftone Inspired", provider: "unsplash", unsplashId: "1579546929518-9e396f3cc809", photographer: "Unsplash" },
  { slot: 60, category: "superhero-inspired", name: "Tower Light Inspired", provider: "unsplash", unsplashId: "1506318137071-a8e63cb36748", photographer: "Unsplash" },
  { slot: 65, category: "mecha", name: "Circuit Mech Inspired", provider: "unsplash", unsplashId: "1516416676182-444cef49d3ad", photographer: "Unsplash" },
  { slot: 72, category: "fantasy", name: "Mist Valley", provider: "unsplash", unsplashId: "1506905925346-21bda4d32df4", photographer: "Unsplash" },
  { slot: 74, category: "sci-fi", name: "Deep Space Sci-Fi", provider: "unsplash", unsplashId: "1462331940022-91a8562c0a8e", photographer: "Unsplash" },
  { slot: 78, category: "anime-inspired", name: "Rain Neon Inspired", provider: "unsplash", unsplashId: "1475274040260-ce3ac7944a91", photographer: "Unsplash" },
  { slot: 81, category: "comic-inspired", name: "Bold Spectrum Inspired", provider: "unsplash", unsplashId: "1485478826545-15437787d5cb", photographer: "Unsplash" },
  { slot: 84, category: "superhero-inspired", name: "City Glow Inspired", provider: "unsplash", unsplashId: "1509198397868-475647b2c754", photographer: "Unsplash" },
  { slot: 86, category: "mecha", name: "Steel Frame Inspired", provider: "unsplash", unsplashId: "1563089145-599997696d32", photographer: "Unsplash" },
  { slot: 88, category: "fantasy", name: "Moonlit Fantasy", provider: "unsplash", unsplashId: "1446776877081-d282a136aa63", photographer: "Unsplash" },
  { slot: 91, category: "sci-fi", name: "Nebula Sci-Fi", provider: "unsplash", unsplashId: "1502134249126-9f3755a50d81", photographer: "Unsplash" },
  { slot: 94, category: "anime-inspired", name: "Twilight Inspired", provider: "unsplash", unsplashId: "1534798566895-d62a05b5d4a1", photographer: "Unsplash" },
  { slot: 97, category: "fantasy", name: "Aurora Fantasy", provider: "unsplash", unsplashId: "1558591710-4b4641412817", photographer: "Unsplash" },
];

/** Unsplash photo IDs for 60 extension portrait skins — must not overlap site pexels IDs (verified at build). */
export const EXT_SKIN_UNSPLASH_POOL = [
  "1519501025264-65fcb10442f1",
  "1557683316-973673baf926",
  "1419242902214-272b4f683ee6",
  "1550745166-0-bc7f730998c2",
  "1519681393784-d120267933ba",
  "1451187580459-43408879c446",
  "1557682254-3ba16653db84",
  "1579546929518-9e396f3cc809",
  "1506318137071-a8e63cb36748",
  "1516416676182-444cef49d3ad",
  "1506905925346-21bda4d32df4",
  "1462331940022-91a8562c0a8e",
  "1475274040260-ce3ac7944a91",
  "1485478826545-15437787d5cb",
  "1509198397868-475647b2c754",
  "1563089145-599997696d32",
  "1446776877081-d282a136aa63",
  "1502134249126-9f3755a50d81",
  "1534798566895-d62a05b5d4a1",
  "1558591710-4b4641412817",
  "1528459081796-0077a079ad4a",
  "1491002059016-0a105291e942",
  "1501785884543-0b090a7e8139",
  "1518837695005-2083093ee35b",
  "1520208422226-721730104caa",
  "1526374965318-abf2d687237f",
  "1534447676618-98e63cb36748",
  "1540959733332-eab4deab47af",
  "1541700538315-6a5f3a5378c8",
  "1542281286-9e0a16bb7366",
  "1553357521-16a4c8d7ef11",
  "1557683311-1e27314248a8",
  "1563089145-599997696d32",
  "1563986768609-322da13575f3",
  "1565299624946-b28f40a0ae38",
  "1574169208507-84376148f167",
  "1579546929518-9e396f3cc809",
  "1581091226825-a6a2a5aee158",
  "1581092160562-40aa08e78837",
  "1581092918056-0c4c3acd3789",
  "1581094799489-7910d728ea33",
  "1582719478250-c89cae4dc85b",
  "1583212298598-e739d2720a8b",
  "1583847268969-b962d6765912",
  "1585503417939-0c5c7a51e079",
  "1593508512255-86ab42a8e620",
  "1595435934247-5757d488f8da",
  "1604076916727-8171c152a0d3",
  "1605810230434-7631ac76ad54",
  "1618005182384-a83a8bd57fbe",
  "1618005198919-d54d37b782a4",
  "1618176814075-796e4457c2c9",
  "1620641788421-7a1c342ea42e",
  "1626814026160-2237a95fc5a0",
  "1633356122544-f134324a6cee",
  "1635070041078-e363dbe005cb",
  "1639765482234-d15a46843a99",
  "1641677964520-1cff60451630",
  "1642619552131-72f140e99898",
  "1643112411110-de47e8a28391",
  "1646586546784-1c2a706672d8",
];

export const EXT_SKIN_CATEGORIES = Object.freeze([
  { id: "cyber-neon", labelKey: "extskin_cat_cyber_neon" },
  { id: "abstract", labelKey: "extskin_cat_abstract" },
  { id: "space", labelKey: "extskin_cat_space" },
  { id: "nature", labelKey: "extskin_cat_nature" },
  { id: "fantasy", labelKey: "extskin_cat_fantasy" },
  { id: "minimal", labelKey: "extskin_cat_minimal" },
]);

const EXT_CAT_CYCLE = ["cyber-neon", "abstract", "space", "nature", "fantasy", "minimal"];

export function extSkinCategoryForIndex(n) {
  return EXT_CAT_CYCLE[(Number(n) - 1) % EXT_CAT_CYCLE.length];
}
