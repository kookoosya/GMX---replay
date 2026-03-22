#!/usr/bin/env node
import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "public", "arcade.js");
let code = fs.readFileSync(file, "utf8");

// Remove _REMOVE_ blocks (each is from "  {\n" to "  }\n" before next block or ]);
const removeBlock = (id) => {
  const re = new RegExp(
    `  \\{\\s*"id": "_REMOVE_${id}"[^}]*"badge": null\\s*\\},\\s*`,
    "s"
  );
  code = code.replace(re, "");
};

["merc", "pixel", "forward", "combat", "vortex", "poly"].forEach(removeBlock);

// Add new games before ];
const newGames = `  {
    "id": "agario",
    "name": "Agar.io",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/agario/20230719092731/agario-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/agario",
    "launchUrl": "https://www.crazygames.com/embed/agario",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "diep-io",
    "name": "Diep.io",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/diepio/20230629173952/diepio-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/diepio",
    "launchUrl": "https://www.crazygames.com/embed/diepio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "geometry-dash",
    "name": "Geometry Dash",
    "icon": "🏃",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/geometry-dash-online/cover_16x9-1732744370399.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/geometry-dash-online",
    "launchUrl": "https://www.crazygames.com/embed/geometry-dash-online",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Platformer",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "snake-io",
    "name": "Snake.io",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/snake-io_16x9/20260302021932/snake-io_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/snake-io",
    "launchUrl": "https://www.crazygames.com/embed/snake-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "voxiom-io",
    "name": "Voxiom",
    "icon": "🔫",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/voxiom-io/cover_16x9-1714408559317.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/voxiom-io",
    "launchUrl": "https://www.crazygames.com/embed/voxiom-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "zombs-royale",
    "name": "Zombs Royale",
    "icon": "🔫",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/zombsroyaleio/cover-1587299840102.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/zombsroyaleio",
    "launchUrl": "https://www.crazygames.com/embed/zombsroyaleio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "lol-beans",
    "name": "LOL Beans",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/lolbeans-io/cover-1603275114093.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/lolbeans-io",
    "launchUrl": "https://www.crazygames.com/embed/lolbeans-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "doodle-jump",
    "name": "Doodle Jump",
    "icon": "🃏",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/doodle-jump/cover-1669135753297.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/doodle-jump",
    "launchUrl": "https://www.crazygames.com/embed/doodle-jump",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "bubble-shooter",
    "name": "Bubble Shooter",
    "icon": "🃏",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/bubble-shooter-classic/cover-1643212218101.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/bubble-shooter-classic",
    "launchUrl": "https://www.crazygames.com/embed/bubble-shooter-classic",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "2048",
    "name": "2048",
    "icon": "🃏",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/2048/cover_16x9-1707828856995.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/2048",
    "launchUrl": "https://www.crazygames.com/embed/2048",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "basketball-legends",
    "name": "Basketball Legends",
    "icon": "🏀",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/basketball-legends-2020_16x9/20231122050621/basketball-legends-2020_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/basketball-legends-2020",
    "launchUrl": "https://www.crazygames.com/embed/basketball-legends-2020",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Sports",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "run-3",
    "name": "Run 3",
    "icon": "🏃",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/run3b.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/run-3",
    "launchUrl": "https://www.crazygames.com/embed/run-3",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Platformer",
    "provider": "crazygames",
    "badge": null
  }
`;

code = code.replace(/(\s*\n)(  \]\;)/, `,\n${newGames}\n$2`);
fs.writeFileSync(file, code);
console.log("Done.");
