/** 100 curated site wallpapers — licensed sources plus internal originals. */
export const WALLPAPER_PACK_COUNT = 100;

export const WALLPAPER_CATEGORIES = Object.freeze([
  {"id":"anime-inspired","labelKey":"wp_cat_anime_inspired"},
  {"id":"comic-inspired","labelKey":"wp_cat_comic_inspired"},
  {"id":"superhero-inspired","labelKey":"wp_cat_superhero_inspired"},
  {"id":"mecha","labelKey":"wp_cat_mecha"},
  {"id":"fantasy","labelKey":"wp_cat_fantasy"},
  {"id":"sci-fi","labelKey":"wp_cat_sci_fi"},
  {
    "id": "neon-city",
    "labelKey": "wp_cat_neon_city"
  },
  {
    "id": "futuristic-architecture",
    "labelKey": "wp_cat_futuristic_architecture"
  },
  {
    "id": "night-skyline",
    "labelKey": "wp_cat_night_skyline"
  },
  {
    "id": "space",
    "labelKey": "wp_cat_space"
  },
  {
    "id": "moon-planets",
    "labelKey": "wp_cat_moon_planets"
  },
  {
    "id": "mountains",
    "labelKey": "wp_cat_mountains"
  },
  {
    "id": "forest",
    "labelKey": "wp_cat_forest"
  },
  {
    "id": "ocean-underwater",
    "labelKey": "wp_cat_ocean_underwater"
  },
  {
    "id": "desert",
    "labelKey": "wp_cat_desert"
  },
  {
    "id": "northern-lights",
    "labelKey": "wp_cat_northern_lights"
  },
  {
    "id": "abstract-glass",
    "labelKey": "wp_cat_abstract_glass"
  },
  {
    "id": "geometric-dark",
    "labelKey": "wp_cat_geometric_dark"
  },
  {
    "id": "minimal-texture",
    "labelKey": "wp_cat_minimal_texture"
  }
]);

/** @type {{ name: string, category: string, tier: string, overlay: number, score: number, origin?: string, generator?: string, reviewStatus?: string, reviewId?: string }[]} */
export const CURATED_WALLPAPERS = [
  {
    "name": "Neon Protocol Citadel",
    "category": "comic-inspired",
    "tier": "free",
    "overlay": 0.28,
    "score": 40,
    "origin": "generated-original",
    "generator": "cursor-generate-image",
    "reviewStatus": "lockedAccept",
    "reviewId": "SITE-01"
  },
  {
    "name": "Vault of the Digital Guardian",
    "category": "superhero-inspired",
    "tier": "free",
    "overlay": 0.28,
    "score": 39,
    "origin": "generated-original",
    "generator": "cursor-generate-image",
    "reviewStatus": "lockedAccept",
    "reviewId": "SITE-02"
  },
  {
    "name": "Raincode Runner Alley",
    "category": "sci-fi",
    "tier": "free",
    "overlay": 0.28,
    "score": 38,
    "origin": "generated-original",
    "generator": "cursor-generate-image",
    "reviewStatus": "lockedAccept",
    "reviewId": "SITE-07"
  },
  {
    "name": "Cosmic Drift Sentinel",
    "category": "space",
    "tier": "free",
    "overlay": 0.28,
    "score": 37,
    "origin": "generated-original",
    "generator": "cursor-generate-image",
    "reviewStatus": "lockedAccept",
    "reviewId": "SITE-13B"
  },
  {
    "name": "Orbital Mecha Deployment",
    "category": "mecha",
    "tier": "free",
    "overlay": 0.28,
    "score": 36,
    "origin": "generated-original",
    "generator": "cursor-generate-image",
    "reviewStatus": "lockedAccept",
    "reviewId": "SITE-19"
  },
  {
    "name": "Indigo Drift",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "free",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Astral Register",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Free Nature Stock",
    "tier": "free",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Spiral Index",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "The Bureau of Land Management",
    "tier": "free",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Celestial Margin",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Free Nature Stock",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Null Horizon",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Ledger Glow",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Desert Fall",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Neon Borough",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Mikael Häggström",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Reflective Hills",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Ritual Monument",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Skyline Pulse",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Dom Sch-veg-man",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Glass Angle",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "ZhiCheng Zhang",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Mist Archive",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "David Brown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Golden Mesa",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Wolfgang Weiser",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Grid Terrace",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Masood Aslami",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Red Block Theory",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Nadine Ginzel",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Lightcube",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Yunus Tuğ",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "City Nightfall",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Ashish Durgude",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Shadow Stripe",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Sydney Sang",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Window Signal",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Weathered Paper",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Reflected Garden",
    "category": "neon-city",
    "pexelsId": 0,
    "photographer": "Nguyen Hung",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Prism Chapel",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "Joerg Hartmann",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Cathedral Glass",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "Filiberto Giglio",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Algorithmic Portrait",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "max laurell",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Stellar Cartography",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "Matias Mango",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Plasma Garden",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "Tim Mossholder",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Ember Atlas",
    "category": "anime-inspired",
    "pexelsId": 0,
    "photographer": "Artbreeder",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Chainwork",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "NASA, ESA, CSA, STScI, Webb ERO Production Team",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Block Signal",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "NASA, ESA, N. Smith (University of California, Berkeley), and The Hubble Heritage Team (STScI/AURA); credit for CTIO Image: N. Smith (University of California, Berkeley) and NOAO/AURA/NSF",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Ledger Bloom",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "VulcanSphere",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Token Geometry",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Vector Muse",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Night Street",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Town in Amber",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Paper Nocturne",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Rocket Margin",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "Ethan Brooke",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Arcane Folio",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "August Strindberg",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Soft Orbit",
    "category": "fantasy",
    "pexelsId": 0,
    "photographer": "Benlisquare",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Convergence Light",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Moon Garden",
    "category": "space",
    "pexelsId": 0,
    "photographer": "\nEngraved by Carl Albert von Lespilliez",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Generations",
    "category": "space",
    "pexelsId": 0,
    "photographer": "User:Niabot",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Orbiting Dust",
    "category": "space",
    "pexelsId": 0,
    "photographer": "theconciergeclub",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Constellation Study",
    "category": "space",
    "pexelsId": 0,
    "photographer": "thegetty",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Rocket Vector",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Night Bloom",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Free Nature Stock",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Signal Six",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Free Nature Stock",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Orbiting Room",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Free Nature Stock",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Amber Cathedral",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "Xuthoria",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Cathedral Signal",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Glass Orchard",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Xuthoria",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Quiet Aperture",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Xuthoria",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Dark Lattice",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Xuthoria",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Rust Interval",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Shadow Current",
    "category": "night-skyline",
    "pexelsId": 0,
    "photographer": "NASA/Pat Rawlings",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Electric Facade",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Black Geometry",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Solar Wall",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "themet",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Stone Frequency",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Night Prism",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "SCIENCE: NASA, ESA, STScI IMAGE PROCESSING: Varun Bajaj (STScI), Joseph DePasquale (STScI), Jennifer Mack (STScI)",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Steel Repetition",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Wolfgang Weiser",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Looped Circuit",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Wolfgang Weiser",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Carbon Edge",
    "category": "abstract-glass",
    "pexelsId": 0,
    "photographer": "Sydney Sang",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Future Line",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "jiang hua",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Liquid Circuit",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Wolfgang Weiser",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Cyber Meadow",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Digital Bloom",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Data Veil",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Pixel Meridian",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Graphite Grid",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "Pachon in Motion",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Signal Garden",
    "category": "moon-planets",
    "pexelsId": 0,
    "photographer": "ym z",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Urban Vector",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "Alex Kalinin",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Desert Architecture",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "Alex Kalinin",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Amber Skyline",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "Robert Hacker",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "City Ember",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "YIYANG LIU",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Brutalist Light",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "K",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "Green Shadow",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "Connor Scott McManus",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Snow Vault",
    "category": "northern-lights",
    "pexelsId": 0,
    "photographer": "FURKAN GÜNEŞ",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Monochrome Study",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "幼聪 戴",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Desert Latitude",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "Mitchell Luo",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Paper Satellite",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "Steve Pancrate",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Coastal Frequency",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "www.kaboompics.com",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Hazy Monument",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "Uğur Sevinç",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Glass District",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "Jess Loiterton",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Aurora Concrete",
    "category": "geometric-dark",
    "pexelsId": 0,
    "photographer": "K",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  },
  {
    "name": "Late Signal",
    "category": "anime-inspired",
    "pexelsId": 0,
    "photographer": "MBC3 Fan 2022",
    "tier": "premium",
    "overlay": 0.28,
    "score": 40
  },
  {
    "name": "White Canyon",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "NASA",
    "tier": "premium",
    "overlay": 0.28,
    "score": 39
  },
  {
    "name": "Shadowed Hills",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 38
  },
  {
    "name": "Neon Foyer",
    "category": "anime-inspired",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 37
  },
  {
    "name": "Winter Geometry",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 36
  },
  {
    "name": "Sunlit Interval",
    "category": "space",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 35
  },
  {
    "name": "Copper Horizon",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 34
  },
  {
    "name": "Modern Silence",
    "category": "anime-inspired",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 33
  },
  {
    "name": "Cloud Atlas",
    "category": "sci-fi",
    "pexelsId": 0,
    "photographer": "Davidstankiewicz",
    "tier": "premium",
    "overlay": 0.28,
    "score": 32
  },
  {
    "name": "Frontier Static",
    "category": "mecha",
    "pexelsId": 0,
    "photographer": "Unknown",
    "tier": "premium",
    "overlay": 0.28,
    "score": 31
  }
];

export const PACK_NAMES = CURATED_WALLPAPERS.map((w) => w.name);
export const PACK_CATEGORIES = CURATED_WALLPAPERS.map((w) => w.category);
