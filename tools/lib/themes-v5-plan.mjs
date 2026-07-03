/** Themes V5 slot plan — real content types per index. */

export const SITE_V5_COUNT = 100;
export const EXT_V5_COUNT = 60;

/** @type {string[]} */
export const SITE_CATEGORY_PLAN = [
  ...Array(12).fill("superhero-comic"),
  ...Array(12).fill("anime-style"),
  ...Array(12).fill("crypto-web3"),
  ...Array(9).fill("mecha-cyber"),
  ...Array(15).fill("city-neon"),
  ...Array(15).fill("nature"),
  ...Array(10).fill("space"),
  ...Array(8).fill("fantasy-env"),
  ...Array(7).fill("abstract-minimal"),
];

/** @type {string[]} */
export const EXT_CATEGORY_PLAN = [
  ...Array(15).fill("superhero-comic"),
  ...Array(15).fill("anime-style"),
  ...Array(12).fill("crypto-web3"),
  ...Array(10).fill("mecha-cyber"),
  ...Array(5).fill("fantasy-character"),
  ...Array(3).fill("abstract-dark"),
];

/** Honest sitev4 photo donors by content bucket (1-based slot indices). */
export const SITE_PHOTO_DONORS = {
  "city-neon": [3, 4, 5, 7, 8, 15, 16, 19, 20, 24, 25, 30, 31, 37, 40],
  nature: [23, 26, 27, 28, 29, 41, 44, 46, 47, 51, 58, 61, 62, 71, 73],
  space: [36, 59, 66, 67, 68, 75, 76, 77, 83, 85],
  "abstract-minimal": [1, 2, 6, 9, 11, 17, 18],
  "fantasy-env": [],
};

export const SITE_NAMES = {
  "superhero-comic": [
    "Neon Masked Guardian", "Cosmic Armor Sentinel", "Comic Thunder Squad", "Crimson Cape Vigilante",
    "Midnight Hero Patrol", "Urban Shield Warrior", "Halftone Justice", "Skyline Defender",
    "Electric Mask Knight", "Shadow Avenger", "Powered Alley Guardian", "Neon Vigilante",
  ],
  "anime-style": [
    "Anime Cyber Runner", "Manga Night Warrior", "Neon Blade Runner", "Pastel Ronin",
    "Cyberpunk Student", "Twin-Tail Hacker", "Rain Alley Runner", "Violet Mech Pilot",
    "Electric Katana", "Moonlit Ronin", "Neon Fox Spirit", "Chrome Street Fighter",
  ],
  "crypto-web3": [
    "Solana Neon Core", "Ethereum Vault", "Bitcoin Citadel", "Web3 Vault",
    "Onchain City", "Blockchain Nexus", "Token Forge", "DeFi Terminal",
    "Crypto Trading Floor", "Hardware Wallet Glow", "NFT Gallery Hall", "Node Network",
  ],
  "mecha-cyber": [
    "Mecha City Defender", "Chrome Titan", "Neon Mech Unit", "Cyber Frame Alpha",
    "Armored Sentinel", "Plasma Mech", "Steel Guardian", "Circuit Colossus", "Neon Exo Suit",
  ],
  "city-neon": [
    "Neon District", "Glass Tower Night", "Rain City Glow", "Skyline Pulse",
    "Metro After Dark", "Harbor Lights", "Bridge Neon", "Urban Horizon",
    "Night Market", "Tower District", "Canal Reflections", "City Haze",
    "Neon Alley", "Skyline Drift", "Late Night Grid",
  ],
  nature: [
    "Mist Valley", "Ocean Depths", "Forest Canopy", "Mountain Dawn",
    "Desert Horizon", "Northern Glow", "Coastal Cliffs", "Pine Ridge",
    "Waterfall Mist", "Lake Mirror", "Canyon Light", "Rain Forest",
    "Highland Fog", "Tide Pool", "Summit Clouds",
  ],
  space: [
    "Orbital Ring", "Nebula Drift", "Lunar Horizon", "Deep Space Gate",
    "Galaxy Spine", "Planet Rise", "Cosmic Dust", "Starfield",
    "Satellite Arc", "Void Aurora",
  ],
  "fantasy-env": [
    "Crystal Castle", "Dragon Valley", "Mystic Forest", "Floating Isles",
    "Ancient Ruins", "Moon Temple", "Enchanted Peaks", "Spirit Lake",
  ],
  "abstract-minimal": [
    "Glass Gradient", "Dark Geometry", "Soft Texture", "Minimal Grid",
    "Muted Glass", "Quiet Lines", "Shadow Plane",
  ],
};

export const EXT_NAMES = {
  "superhero-comic": [
    "Neon Masked Guardian", "Cosmic Armor", "Comic Thunder Hero", "Crimson Vigilante",
    "Midnight Avenger", "Urban Shield", "Halftone Hero", "Skyline Sentinel",
    "Electric Knight", "Shadow Defender", "Powered Guardian", "Neon Cape",
    "Thunder Mask", "Armor Pulse", "Hero Portrait",
  ],
  "anime-style": [
    "Anime Cyber Runner", "Manga Night Warrior", "Neon Ronin", "Pastel Hacker",
    "Cyber Student", "Twin-Tail Pilot", "Rain Runner", "Violet Mech",
    "Electric Katana", "Moon Ronin", "Fox Spirit", "Street Fighter",
    "Neon Samurai", "Chrome Idol", "Anime Portrait",
  ],
  "crypto-web3": [
    "Solana Core", "Ethereum Vault", "Bitcoin Citadel", "Web3 Vault",
    "Onchain Terminal", "Blockchain Node", "Token Forge", "DeFi Hub",
    "Crypto Floor", "Wallet Glow", "NFT Gallery", "Node Mesh",
  ],
  "mecha-cyber": [
    "Mecha Defender", "Chrome Titan", "Neon Mech", "Cyber Frame",
    "Armored Unit", "Plasma Mech", "Steel Guardian", "Circuit Titan",
    "Neon Exo", "Mech Portrait",
  ],
  "fantasy-character": [
    "Crystal Mage", "Dragon Knight", "Forest Spirit", "Moon Cleric", "Arcane Hunter",
  ],
  "abstract-dark": ["Void Gradient", "Dark Glass", "Minimal Pulse"],
};

export function isGeneratedCategory(cat) {
  return [
    "superhero-comic",
    "anime-style",
    "crypto-web3",
    "mecha-cyber",
    "fantasy-env",
    "fantasy-character",
    "abstract-dark",
  ].includes(cat);
}

export function hasCharacterCategory(cat) {
  return [
    "superhero-comic",
    "anime-style",
    "mecha-cyber",
    "fantasy-character",
    "crypto-web3",
  ].includes(cat);
}
