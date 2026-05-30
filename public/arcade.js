(() => {
  const RAW_GAMES = [
  {
    "id": "kour-io",
    "name": "Kour.io",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.crazygames.com/games/kour-io/cover-1709565575515.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/kour-io",
    "launchUrl": "https://www.crazygames.com/embed/kour-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": "top_pro"
  },
  {
    "id": "hazmob-fps",
    "name": "Hazmob FPS",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.crazygames.com/games/hazmob-fps-online-shooter/cover-1698224520779.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/hazmob-fps-online-shooter",
    "launchUrl": "https://www.crazygames.com/embed/hazmob-fps-online-shooter",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": "top_pro"
  },
  {
    "id": "sniper-fury",
    "name": "Sniper Fury",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.crazygames.com/sniper-fury_16x9/20231110091811/sniper-fury_16x9-cover?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/sniper-fury",
    "launchUrl": "https://www.crazygames.com/embed/sniper-fury",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": "top_pro"
  },
  {
    "id": "zombie-derby-pixel",
    "name": "Zombie Derby Pixel",
    "icon": "⚡",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/zombie-derby-pixel-survival/cover-1616491795797.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/zombie-derby-pixel-survival",
    "launchUrl": "https://www.crazygames.com/embed/zombie-derby-pixel-survival",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Action",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "path-of-survivor",
    "name": "Path of Survivor",
    "icon": "⚡",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/path-of-survivor/cover-1688640103681.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/path-of-survivor",
    "launchUrl": "https://www.crazygames.com/embed/path-of-survivor",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Action",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "trial-mania",
    "name": "Trial Mania",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/trial-mania/cover-1681289191024.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/trial-mania",
    "launchUrl": "https://www.crazygames.com/embed/trial-mania",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "mx-offroad-master",
    "name": "MX Offroad Master",
    "icon": "🏎️",
    "access": "pro",
    "imageUrl": "https://images.crazygames.com/games/mx-offroad-master/cover-1640081308369.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/mx-offroad-master",
    "launchUrl": "https://www.crazygames.com/embed/mx-offroad-master",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": "top_pro"
  },
  {
    "id": "rally-racer-dirt",
    "name": "Rally Racer Dirt",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/rally-racer-dirt/cover-1634653554425.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/rally-racer-dirt",
    "launchUrl": "https://www.crazygames.com/embed/rally-racer-dirt",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "super-bowling",
    "name": "Super Bowling",
    "icon": "🎳",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/super-bowling-mania/cover-1698658826435.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/super-bowling-mania",
    "launchUrl": "https://www.crazygames.com/embed/super-bowling-mania",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Sports",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "firestone-idle-rpg",
    "name": "Firestone Idle RPG",
    "icon": "⚔️",
    "access": "pro",
    "imageUrl": "https://images.crazygames.com/games/firestone-idle-rpg/cover-1628151811566.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/firestone-idle-rpg",
    "launchUrl": "https://www.crazygames.com/embed/firestone-idle-rpg",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "RPG",
    "provider": "crazygames",
    "badge": "top_pro"
  },
  {
    "id": "solitaire-home",
    "name": "Solitaire Home",
    "icon": "🧩",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/solitaire-home-story/cover-1678280650993.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/solitaire-home-story",
    "launchUrl": "https://www.crazygames.com/embed/solitaire-home-story",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Casual",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "zumba-quest",
    "name": "Zumba Quest",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/zumba-quest/cover-1698236774640.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/zumba-quest",
    "launchUrl": "https://www.crazygames.com/embed/zumba-quest",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "goat-escape",
    "name": "Goat Escape",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/goat-escape/cover-1699539328570.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/goat-escape",
    "launchUrl": "https://www.crazygames.com/embed/goat-escape",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "1v1-lol",
    "name": "1v1.LOL",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/games/1v1-lol/cover-1585728351086.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/1v1-lol",
    "launchUrl": "https://www.crazygames.com/embed/1v1-lol",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "shell-shockers",
    "name": "Shell Shockers",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/shellshockersio_16x9/20260203211252/shellshockersio_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/shellshockersio",
    "launchUrl": "https://www.crazygames.com/embed/shellshockersio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "smash-karts",
    "name": "Smash Karts",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://images.crazygames.com/games/smash-karts/cover-1583232508892.png?auto=format,compress&q=75&cs=strip",
    "embedUrl": "https://www.crazygames.com/embed/smash-karts",
    "launchUrl": "https://www.crazygames.com/embed/smash-karts",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "drift-hunters",
    "name": "Drift Hunters",
    "icon": "🏎️",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/games/drift-hunters/cover-1656950639575.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/drift-hunters",
    "launchUrl": "https://www.crazygames.com/embed/drift-hunters",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "bloxd-io",
    "name": "Bloxd.io",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/bloxdhop-io_16x9/20250829023851/bloxdhop-io_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/bloxdhop-io",
    "launchUrl": "https://www.crazygames.com/embed/bloxdhop-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
{
    "id": "crazy-roll-3d",
    "name": "Crazy Roll 3D",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/crazy-roll-3d/cover_16x9-1709124312204.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/crazy-roll-3d",
    "launchUrl": "https://www.crazygames.com/embed/crazy-roll-3d",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "slither-io",
    "name": "Slither.io",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/slitherio/cover-1587331280441.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/slitherio",
    "launchUrl": "https://www.crazygames.com/embed/slitherio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "paper-io-2",
    "name": "Paper.io 2",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/paper-io-2_16x9/20250214024143/paper-io-2_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/paper-io-2",
    "launchUrl": "https://www.crazygames.com/embed/paper-io-2",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "hole-io",
    "name": "Hole.io",
    "icon": "🎮",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/holey-io-battle-royale_16x9/20230809150431/holey-io-battle-royale_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/hole-io",
    "launchUrl": "https://www.crazygames.com/embed/hole-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "worms-zone",
    "name": "Worms Zone",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/worms-zone_16x9/20241128100948/worms-zone_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/worms-zone",
    "launchUrl": "https://www.crazygames.com/embed/worms-zone",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "moto-x3m",
    "name": "Moto X3M",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/moto-x3m/cover_16x9-1700625476572.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/moto-x3m",
    "launchUrl": "https://www.crazygames.com/embed/moto-x3m",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "basketball-stars",
    "name": "Basketball Stars",
    "icon": "🎳",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/games/basketball-stars-2019/cover-1583231506155.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/basketball-stars-2019",
    "launchUrl": "https://www.crazygames.com/embed/basketball-stars-2019",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Sports",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "tennis-masters",
    "name": "Tennis Masters",
    "icon": "🎳",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/tennis-masters/20201207104629/tennis-masters-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/tennis-masters",
    "launchUrl": "https://www.crazygames.com/embed/tennis-masters",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Sports",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "soccer-legends",
    "name": "Soccer Legends",
    "icon": "🎳",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/soccer-legends-2021/cover_16x9-1732724179287.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/soccer-legends-2021",
    "launchUrl": "https://www.crazygames.com/embed/soccer-legends-2021",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Sports",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "madalin-stunt-cars",
    "name": "Madalin Stunt Cars",
    "icon": "🏎️",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/games/madalin-stunt-cars-2/cover_16x9-1695113654654.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/madalin-stunt-cars-2",
    "launchUrl": "https://www.crazygames.com/embed/madalin-stunt-cars-2",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "night-city-racing",
    "name": "Night City Racing",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/night-city-racing_16x9/20260220035423/night-city-racing_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/night-city-racing",
    "launchUrl": "https://www.crazygames.com/embed/night-city-racing",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "evoworld-io",
    "name": "EvoWorld.io",
    "icon": "🎮",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/flyordieio/20210614144226/flyordieio-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/flyordieio",
    "launchUrl": "https://www.crazygames.com/embed/flyordieio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "IO",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "skribbl-io",
    "name": "Skribbl.io",
    "icon": "🧩",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/skribblio.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/skribblio",
    "launchUrl": "https://www.crazygames.com/embed/skribblio",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Casual",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "mahjongg",
    "name": "Mahjongg",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/games/mahjongg-solitaire/cover_16x9-1707829450935.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/mahjongg-solitaire",
    "launchUrl": "https://www.crazygames.com/embed/mahjongg-solitaire",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "words-of-wonders",
    "name": "Words of Wonders",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/words-of-wonders_16x9/20231019163757/words-of-wonders_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/words-of-wonders",
    "launchUrl": "https://www.crazygames.com/embed/words-of-wonders",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "crazygames",
    "badge": null
  },
{
    "id": "dead-zed",
    "name": "Dead Zed",
    "icon": "🔫",
    "access": "free",
    "imageUrl": "https://imgs.crazygames.com/dead-zed_16x9/20260220044407/dead-zed_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/dead-zed",
    "launchUrl": "https://www.crazygames.com/embed/dead-zed",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "buildnow-gg",
    "name": "BuildNow GG",
    "icon": "⚡",
    "access": "pro",
    "imageUrl": "https://imgs.crazygames.com/buildnow-gg_16x9/20251229084241/buildnow-gg_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop",
    "embedUrl": "https://www.crazygames.com/embed/buildnow-gg",
    "launchUrl": "https://www.crazygames.com/embed/buildnow-gg",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Action",
    "provider": "crazygames",
    "badge": null
  },
  {"id":"agario","name":"Agar.io","icon":"🎮","access":"free","imageUrl":"https://imgs.crazygames.com/agario/20230719092731/agario-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/agario","launchUrl":"https://www.crazygames.com/embed/agario","sourceLabel":"CrazyGames","shortNote":"","category":"IO","provider":"crazygames","badge":null},
  {"id":"diep-io","name":"Diep.io","icon":"🎮","access":"free","imageUrl":"https://imgs.crazygames.com/diepio/20230629173952/diepio-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/diepio","launchUrl":"https://www.crazygames.com/embed/diepio","sourceLabel":"CrazyGames","shortNote":"","category":"IO","provider":"crazygames","badge":null},
  {"id":"geometry-dash","name":"Geometry Dash","icon":"🏃","access":"free","imageUrl":"https://imgs.crazygames.com/games/geometry-dash-online/cover_16x9-1732744370399.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/geometry-dash-online","launchUrl":"https://www.crazygames.com/embed/geometry-dash-online","sourceLabel":"CrazyGames","shortNote":"","category":"Platformer","provider":"crazygames","badge":null},
  {"id":"snake-io","name":"Snake.io","icon":"🎮","access":"free","imageUrl":"https://imgs.crazygames.com/snake-io_16x9/20260302021932/snake-io_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/snake-io","launchUrl":"https://www.crazygames.com/embed/snake-io","sourceLabel":"CrazyGames","shortNote":"","category":"IO","provider":"crazygames","badge":null},
  {"id":"voxiom-io","name":"Voxiom","icon":"🔫","access":"free","imageUrl":"https://imgs.crazygames.com/games/voxiom-io/cover_16x9-1714408559317.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/voxiom-io","launchUrl":"https://www.crazygames.com/embed/voxiom-io","sourceLabel":"CrazyGames","shortNote":"","category":"Shooter","provider":"crazygames","badge":null},
  {"id":"zombs-royale","name":"Zombs Royale","icon":"🔫","access":"free","imageUrl":"https://imgs.crazygames.com/games/zombsroyaleio/cover-1587299840102.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/zombsroyaleio","launchUrl":"https://www.crazygames.com/embed/zombsroyaleio","sourceLabel":"CrazyGames","shortNote":"","category":"Shooter","provider":"crazygames","badge":null},
  {"id":"lol-beans","name":"LOL Beans","icon":"🎮","access":"free","imageUrl":"https://imgs.crazygames.com/games/lolbeans-io/cover-1603275114093.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/lolbeans-io","launchUrl":"https://www.crazygames.com/embed/lolbeans-io","sourceLabel":"CrazyGames","shortNote":"","category":"IO","provider":"crazygames","badge":null},
  {"id":"doodle-jump","name":"Doodle Jump","icon":"🃏","access":"free","imageUrl":"https://imgs.crazygames.com/games/doodle-jump/cover-1669135753297.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/doodle-jump","launchUrl":"https://www.crazygames.com/embed/doodle-jump","sourceLabel":"CrazyGames","shortNote":"","category":"Arcade","provider":"crazygames","badge":null},
  {"id":"bubble-shooter","name":"Bubble Shooter","icon":"🃏","access":"free","imageUrl":"https://imgs.crazygames.com/games/bubble-shooter-classic/cover-1643212218101.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/bubble-shooter-classic","launchUrl":"https://www.crazygames.com/embed/bubble-shooter-classic","sourceLabel":"CrazyGames","shortNote":"","category":"Puzzle","provider":"crazygames","badge":null},
  {"id":"2048","name":"2048","icon":"🃏","access":"free","imageUrl":"https://imgs.crazygames.com/games/2048/cover_16x9-1707828856995.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/2048","launchUrl":"https://www.crazygames.com/embed/2048","sourceLabel":"CrazyGames","shortNote":"","category":"Puzzle","provider":"crazygames","badge":null},
  {"id":"basketball-legends","name":"Basketball Legends","icon":"🏀","access":"free","imageUrl":"https://imgs.crazygames.com/basketball-legends-2020_16x9/20231122050621/basketball-legends-2020_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/basketball-legends-2020","launchUrl":"https://www.crazygames.com/embed/basketball-legends-2020","sourceLabel":"CrazyGames","shortNote":"","category":"Sports","provider":"crazygames","badge":null},
  {"id":"run-3","name":"Run 3","icon":"🏃","access":"free","imageUrl":"https://imgs.crazygames.com/run3b.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/run-3","launchUrl":"https://www.crazygames.com/embed/run-3","sourceLabel":"CrazyGames","shortNote":"","category":"Platformer","provider":"crazygames","badge":null},
  {"id":"getaway-shootout","name":"Getaway Shootout","icon":"🔫","access":"free","imageUrl":"https://imgs.crazygames.com/getaway-shootout_16x9/20241230044730/getaway-shootout_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/getaway-shootout","launchUrl":"https://www.crazygames.com/embed/getaway-shootout","sourceLabel":"CrazyGames","shortNote":"","category":"Shooter","provider":"crazygames","badge":null},
  {"id":"happy-wheels","name":"Happy Wheels","icon":"🏎️","access":"free","imageUrl":"https://imgs.crazygames.com/games/happy-wheels/cover-1688034516340.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/happy-wheels","launchUrl":"https://www.crazygames.com/embed/happy-wheels","sourceLabel":"CrazyGames","shortNote":"","category":"Racing","provider":"crazygames","badge":null},
  {"id":"cut-the-rope","name":"Cut the Rope","icon":"🃏","access":"free","imageUrl":"https://imgs.crazygames.com/cut-the-rope-ebx_16x9/20240530085010/cut-the-rope-ebx_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/cut-the-rope","launchUrl":"https://www.crazygames.com/embed/cut-the-rope","sourceLabel":"CrazyGames","shortNote":"","category":"Puzzle","provider":"crazygames","badge":null},
  {"id":"eggy-car","name":"Eggy Car","icon":"🏎️","access":"free","imageUrl":"https://imgs.crazygames.com/eggy-car/20230720050147/eggy-car-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/eggy-car","launchUrl":"https://www.crazygames.com/embed/eggy-car","sourceLabel":"CrazyGames","shortNote":"","category":"Racing","provider":"crazygames","badge":null},
  {"id":"drift-boss","name":"Drift Boss","icon":"🏎️","access":"free","imageUrl":"https://imgs.crazygames.com/drift-boss_16x9/20260209092420/drift-boss_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/drift-boss","launchUrl":"https://www.crazygames.com/embed/drift-boss","sourceLabel":"CrazyGames","shortNote":"","category":"Racing","provider":"crazygames","badge":null},
  {"id":"friday-night-funkin","name":"Friday Night Funkin","icon":"🎵","access":"free","imageUrl":"https://imgs.crazygames.com/games/friday-night-funkin/cover-1614085803807.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/friday-night-funkin","launchUrl":"https://www.crazygames.com/embed/friday-night-funkin","sourceLabel":"CrazyGames","shortNote":"","category":"Arcade","provider":"crazygames","badge":null},
  {"id":"kirka-io","name":"Kirka.io","icon":"🔫","access":"free","imageUrl":"https://imgs.crazygames.com/kirka-io_16x9/20260116015838/kirka-io_16x9-cover?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/kirka-io","launchUrl":"https://www.crazygames.com/embed/kirka-io","sourceLabel":"CrazyGames","shortNote":"","category":"Shooter","provider":"crazygames","badge":null},
  {"id":"marble-shooter","name":"Marble Shooter","icon":"🎯","access":"free","imageUrl":"https://imgs.crazygames.com/games/marble-shooter/cover-1616449636651.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/marble-shooter","launchUrl":"https://www.crazygames.com/embed/marble-shooter","sourceLabel":"CrazyGames","shortNote":"","category":"Puzzle","provider":"crazygames","badge":null},
  {"id":"bullet-force","name":"Bullet Force","icon":"🔫","access":"free","imageUrl":"https://imgs.crazygames.com/games/bullet-force/cover-1583232537561.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/bullet-force","launchUrl":"https://www.crazygames.com/embed/bullet-force","sourceLabel":"CrazyGames","shortNote":"","category":"Shooter","provider":"crazygames","badge":null},
  {"id":"minecraft-classic","name":"Minecraft Classic","icon":"🎮","access":"free","imageUrl":"https://imgs.crazygames.com/games/minecraft-classic/cover-1583232518913.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/minecraft-classic","launchUrl":"https://www.crazygames.com/embed/minecraft-classic","sourceLabel":"CrazyGames","shortNote":"","category":"Arcade","provider":"crazygames","badge":null},
  {"id":"subway-surfers","name":"Subway Surfers","icon":"🏃","access":"free","imageUrl":"https://imgs.crazygames.com/games/subway-surfers-seoul/cover_16x9-1732724247485.png?metadata=none&quality=100&width=1200&height=630&fit=crop","embedUrl":"https://www.crazygames.com/embed/subway-surfers-seoul","launchUrl":"https://www.crazygames.com/embed/subway-surfers-seoul","sourceLabel":"CrazyGames","shortNote":"","category":"Arcade","provider":"crazygames","badge":null}
];
  const CATEGORY_LABELS = {
    action: "Action",
    arcade: "Arcade",
    casual: "Casual",
    io: "IO",
    platformer: "Platformer",
    puzzle: "Puzzle",
    racing: "Racing",
    rpg: "RPG",
    shooter: "Shooter",
    simulation: "Simulation",
    sports: "Sports",
    strategy: "Strategy",
    survivor: "Survivor"
  };
  const CATEGORY_NOTES = {
    action: "Fast action pick with quick browser launch.",
    arcade: "Arcade pick for easy drop in runs.",
    casual: "Light casual pick for slower sessions.",
    io: "Public IO match with instant join flow.",
    platformer: "Platformer slot with clean short runs.",
    puzzle: "Puzzle pick for slower problem solving.",
    racing: "Racing pick built for short runs.",
    rpg: "RPG slot with slower progression loops.",
    shooter: "Shooter pick with fast browser entry.",
    simulation: "Simulation slot for longer sandbox runs.",
    sports: "Sports pick with easy one run flow.",
    strategy: "Strategy slot with slower decision loops.",
    survivor: "Survivor run with pressure that ramps quickly."
  };
  function normalizeArcadeCategory(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "io") return "IO";
    if (raw === "rpg") return "RPG";
    // Legacy import aliases from older non-English catalogs.
    if (raw === "\u0441\u0438\u043c\u0443\u043b\u044f\u0442\u043e\u0440") return "Simulation";
    if (raw === "\u0433\u043e\u043b\u043e\u0432\u043e\u043b\u043e\u043c\u043a\u0430") return "Puzzle";
    if (raw === "\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435\u0440") return "Platformer";
    if (raw === "\u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f") return "Strategy";
    if (raw === "\u0432\u044b\u0436\u0438\u0432\u0430\u043d\u0438\u0435") return "Survivor";
    const key = raw.replace(/[^a-z]+/g, "");
    return CATEGORY_LABELS[key] || "Arcade";
  }
  function normalizedArcadeNote(game, category) {
    const key = String(category || "").trim().toLowerCase().replace(/[^a-z]+/g, "");
    return CATEGORY_NOTES[key] || "Browser game slot with direct launch.";
  }
  function categoryIconTag(category){
    const key = String(category || "").trim().toLowerCase();
    const map = {
      shooter: "FPS",
      action: "ACT",
      racing: "RACE",
      sports: "SPORT",
      rpg: "RPG",
      puzzle: "PUZZLE",
      platformer: "PLAT",
      strategy: "STRAT",
      survivor: "SURV",
      simulation: "SIM",
      arcade: "ARC",
      io: "IO",
      casual: "CASUAL"
    };
    return map[key] || "GAME";
  }
  const GAMES = RAW_GAMES.filter((g) => g && g.id && !String(g.id).startsWith("_REMOVE_") && !String(g.id).startsWith("_DEL_")).map((game) => {
    const category = normalizeArcadeCategory(game && game.category);
    return {
      ...game,
      category,
      icon: categoryIconTag(category),
      shortNote: normalizedArcadeNote(game, category)
    };
  });
  const PAGE_SIZE = 15;
  const CATEGORY_COVER_COLORS = {
    action: ["#ef4444", "#7f1d1d"],
    arcade: ["#8b5cf6", "#312e81"],
    crypto: ["#f59e0b", "#7c2d12"],
    idle: ["#0ea5e9", "#0c4a6e"],
    platformer: ["#22c55e", "#14532d"],
    puzzle: ["#a855f7", "#581c87"],
    racing: ["#f97316", "#7c2d12"],
    shooter: ["#3b82f6", "#1e3a8a"],
    simulation: ["#14b8a6", "#134e4a"],
    sports: ["#06b6d4", "#164e63"],
    strategy: ["#84cc16", "#365314"],
    survivor: ["#f43f5e", "#881337"],
    generic: ["#64748b", "#0f172a"],
  };
  function categoryCoverSvgDataUri(label, c1, c2){
    const text = String(label || "GAME").slice(0, 12).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 540'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs><rect width='900' height='540' fill='url(#g)'/><circle cx='760' cy='90' r='120' fill='rgba(255,255,255,.12)'/><circle cx='120' cy='460' r='180' fill='rgba(255,255,255,.08)'/><text x='58' y='460' font-family='Inter,Segoe UI,Arial' font-size='96' font-weight='800' fill='rgba(255,255,255,.92)'>${text}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  function categoryCover(game) {
    const raw = String(game && game.category || "").toLowerCase().trim();
    const key = raw.replace(/[^a-z]+/g, "");
    const colors = CATEGORY_COVER_COLORS[key] || CATEGORY_COVER_COLORS.generic;
    return categoryCoverSvgDataUri(game && game.category || "Game", colors[0], colors[1]);
  }
  const LOCAL_GAME_COVERS = new Set([]);
  function localGameCover(game) {
    const slug = game && (game.id || game.slug || "");
    if (!slug || !LOCAL_GAME_COVERS.has(slug)) return "";
    return `/assets/arcade/covers/games/${slug}.svg`;
  }
  function fallbackCover(game) {
    return localGameCover(game) || categoryCover(game);
  }
  function remoteCoverUrl(game) {
    try {
      const raw = String(game && game.imageUrl || "").trim();
      if (!raw) return "";
      const url = new URL(raw, window.location.origin);
      if (!/^https:$/i.test(String(url.protocol || ""))) return "";
      return url.toString();
    } catch {
      return "";
    }
  }
  function liveScreenshotCover(game){
    try{
      const launch = String(game && (game.launchUrl || game.embedUrl) || "").trim();
      if (!/^https?:\/\//i.test(launch)) return "";
      let source = launch;
      try{
        const u = new URL(launch);
        // For CrazyGames, page URLs usually render better than embed frames.
        if (/crazygames\.com$/i.test(u.hostname || "")) {
          const m = String(u.pathname || "").match(/^\/embed\/([^/?#]+)/i);
          if (m && m[1]) source = `https://www.crazygames.com/game/${m[1]}`;
        }
      }catch{}
      return `https://image.thum.io/get/width/900/crop/540/noanimate/${source}`;
    }catch{
      return "";
    }
  }
  function preferredCover(game) {
    // Use live screenshot from game page when no explicit imageUrl (grab from site).
    return localGameCover(game) || remoteCoverUrl(game) || liveScreenshotCover(game) || categoryCover(game);
  }
  function upgradeTileCovers(scope) {
    try {
      (scope || document).querySelectorAll("img[data-fallback-cover]").forEach((img) => {
        if (img.dataset.coverBound === "1") return;
        img.dataset.coverBound = "1";
        const fallback = String(img.getAttribute("data-fallback-cover") || "").trim();
        const swapToFallback = () => {
          if (!fallback) return;
          if (img.getAttribute("src") === fallback && img.dataset.coverFailed === "1") return;
          img.dataset.coverFailed = "1";
          img.setAttribute("src", fallback);
        };
        img.addEventListener("error", swapToFallback, { once: false });
        if (!img.getAttribute("src")) swapToFallback();
      });
    } catch {}
  }
  const state = {
    plan: "loading",
    handle: "",
    search: "",
    access: "all",
    category: "all",
    visible: PAGE_SIZE,
    activeId: null,
    lockedId: null,
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
  const host = typeof window !== "undefined" ? window.location.origin : "";
  const token = () => {
    try { return String(localStorage.getItem("gmx_token") || localStorage.getItem("gmx_access_token") || ""); } catch { return ""; }
  };
  const handle = () => {
    try { return String(localStorage.getItem("gmx_handle") || ""); } catch { return ""; }
  };
  const planLabel = () => state.plan === "pro" ? "PRO unlocked" : (state.plan === "loading" ? "Checking access" : "FREE plan");
  const categories = () => ["all", ...Array.from(new Set(GAMES.map((g) => g.category))).sort()];
  const filtered = () => {
    const q = state.search.trim().toLowerCase();
    return GAMES.filter((game) => {
      if (state.access !== "all" && game.access !== state.access) return false;
      if (state.category !== "all" && game.category !== state.category) return false;
      if (!q) return true;
      return [game.name, game.shortNote, game.category, game.sourceLabel, game.provider].join(" ").toLowerCase().includes(q);
    });
  };
  const visibleGames = () => filtered().slice(0, state.visible);
  const badge = (game) => game.badge === "showcase" ? "SHOWCASE" : (game.badge === "top_pro" ? "TOP PRO" : game.access.toUpperCase());

  function setStatus(text) {
    const el = $("arcadeStatus");
    if (el) el.textContent = text;
  }

  async function loadPlan() {
    state.handle = handle();
    const handleEl = $("planHandle");
    if (handleEl) handleEl.textContent = state.handle || "Guest slot";
    try {
      const res = await fetch("/api/usage", {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      state.plan = data?.sub?.active ? "pro" : "free";
    } catch {
      state.plan = "free";
    }
    const planEl = $("planLabel");
    if (planEl) planEl.textContent = planLabel();
    render();
  }

  function openGame(game) {
    if (game.access === "pro" && state.plan !== "pro") {
      state.lockedId = game.id;
      state.activeId = null;
      render();
      return;
    }
    state.lockedId = null;
    state.activeId = game.id;
    render();
  }

  function activeGame() {
    return GAMES.find((g) => g.id === state.activeId) || null;
  }

  function lockedGame() {
    return GAMES.find((g) => g.id === state.lockedId) || null;
  }

  function renderPlayer(game) {
    return `
      <section class="panel playerPanel">
        <div class="playerHead">
          <div>
            <div class="eyebrow">Live game slot</div>
            <h2>${esc(game.name)}</h2>
            <div class="sub">${esc(game.sourceLabel)} · ${esc(game.category)}</div>
          </div>
          <div class="playerActions">
            <button class="ghostBtn" id="backToLibrary">Back to library</button>
            <a class="primaryBtn" href="${esc(game.launchUrl)}" target="_blank" rel="noreferrer">Open original</a>
          </div>
        </div>
        <div class="playerWrap">
          <iframe
            title="${esc(game.name)}"
            src="${esc(game.embedUrl)}"
            allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write"
            allowfullscreen
          ></iframe>
        </div>
        <div class="playerNote">If a publisher blocks iframe launch in your browser, use <b>Open original</b>.</div>
      </section>
    `;
  }

  function renderLocked(game) {
    if (!game) return "";
    return `
      <section class="panel lockedPanel">
        <div class="eyebrow warn">Locked Pro slot</div>
        <h2>${esc(game.name)}</h2>
        <div class="sub">${esc(game.shortNote)}</div>
        <div class="lockedActions">
          <a class="primaryBtn warm" href="${esc(game.launchUrl)}" target="_blank" rel="noreferrer">Open original now</a>
          <div class="muted">This title stays visibly premium until PRO is active.</div>
        </div>
      </section>
    `;
  }

  function gameOfTheDay() {
    const d = new Date();
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    const idx = dayOfYear % GAMES.length;
    return GAMES[idx];
  }

  function renderLibrary() {
    const list = filtered();
    const visible = visibleGames();
    const locked = lockedGame();
    const active = activeGame();
    const gotd = gameOfTheDay();
    const root = $("arcadeRoot");
    if (!root) return;

    const gotdTile = gotd ? (() => {
      const g = gotd;
      const locked = g.access === "pro" && state.plan !== "pro";
      return `
        <article class="tile tileGotd" data-game-id="${esc(g.id)}">
          <div class="tileMedia">
            <img src="${esc(preferredCover(g))}" data-fallback-cover="${esc(fallbackCover(g))}" alt="${esc(g.name)}" loading="eager" referrerpolicy="no-referrer"/>
            <div class="tileOverlay"></div>
            <div class="tileTop">
              <div class="tileBadge" style="background:linear-gradient(135deg,rgba(251,191,36,.4),rgba(244,63,94,.4))">GAME OF THE DAY</div>
              ${g.access === "pro" ? '<span class="tileBadge tileBadgePro">PRO</span>' : ""}
              ${locked ? '<span class="tileBadge tileBadgeLock">LOCKED</span>' : ""}
            </div>
            <div class="tileBottom">
              <div class="tileTitle">${esc(g.name)}</div>
              <div class="tileMeta">${esc(g.category)} · Try it now</div>
            </div>
          </div>
          <div class="tileBody">
            <div class="tileNote">Today's featured pick. One click to launch.</div>
            <div class="tileFoot"><span>${esc(g.sourceLabel)}</span><span>${locked ? "Upgrade to unlock" : "Launch now"}</span></div>
          </div>
        </article>`;
    })() : "";

    root.innerHTML = `
      <section class="panel heroPanel">
        <div class="heroRow">
          <div>
            <div class="eyebrow">Live arcade shelf</div>
            <h1>Arcade</h1>
            <div class="heroText">${GAMES.length} browser games with real covers. Launch instantly. Free games always available.</div>
            <a href="/app.html" class="ghostBtn" style="margin-top:12px;display:inline-block">← Back to GMXReply</a>
          </div>
          <div class="planCard">
            <div id="planLabel" class="planMain">${esc(planLabel())}</div>
            <div id="planHandle" class="planSub">${esc(state.handle || "Guest slot")}</div>
          </div>
        </div>
      </section>
      ${gotd ? `<section class="panel"><h2 style="margin-bottom:14px">Game of the Day</h2><div class="grid gridGotd" id="gotdGrid">${gotdTile}</div></section>` : ""}
      ${active ? renderPlayer(active) : renderLocked(locked)}
      <section class="panel">
        <div class="libraryHead">
          <div>
            <h2>Game library</h2>
            <div class="sub">Showing ${visible.length} of ${list.length} filtered games · total catalog ${GAMES.length}</div>
          </div>
          <div class="filtersRow" id="accessFilters"></div>
        </div>
        <div class="searchRow">
          <input id="searchInput" class="field" placeholder="Search games" value="${esc(state.search)}" />
          <select id="categorySelect" class="field selectField"></select>
          <button id="resetFilters" class="ghostBtn">Reset filters</button>
        </div>
        <div class="grid" id="gameGrid"></div>
        <div class="loadMoreWrap" id="loadMoreWrap"></div>
      </section>
    `;

    const accessWrap = $("accessFilters");
    if (accessWrap) {
      accessWrap.innerHTML = ["all","free","pro"].map((value) => `
        <button class="pill ${state.access === value ? "pillActive" : ""}" data-access="${value}">${value}</button>
      `).join("");
      accessWrap.querySelectorAll("[data-access]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.access = String(btn.getAttribute("data-access") || "all");
          state.visible = PAGE_SIZE;
          render();
        });
      });
    }

    const catSel = $("categorySelect");
    if (catSel) {
      catSel.innerHTML = categories().map((value) => `<option value="${esc(value)}">${value === "all" ? "All categories" : esc(value)}</option>`).join("");
      catSel.value = state.category;
      catSel.addEventListener("change", (event) => {
        state.category = String(event.target.value || "all");
        state.visible = PAGE_SIZE;
        render();
      });
    }

    const searchInput = $("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        state.search = String(event.target.value || "");
        state.visible = PAGE_SIZE;
        render();
      });
    }

    const resetBtn = $("resetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.search = "";
        state.access = "all";
        state.category = "all";
        state.visible = PAGE_SIZE;
        render();
      });
    }

    const grid = $("gameGrid");
    if (grid) {
      if (!visible.length) {
        grid.innerHTML = '<div class="empty">No games match the current filters.</div>';
      } else {
        grid.innerHTML = visible.map((game) => {
          const locked = game.access === "pro" && state.plan !== "pro";
          return `
            <article class="tile" data-game-id="${esc(game.id)}">
              <div class="tileMedia">
                <img src="${esc(preferredCover(game))}" data-fallback-cover="${esc(fallbackCover(game))}" alt="${esc(game.name)}" loading="lazy" referrerpolicy="no-referrer"/>
                <div class="tileOverlay"></div>
                <div class="tileTop">
                  <div class="tileIcon">${esc(game.icon)}</div>
                  <div class="tileBadges">
                    <span class="tileBadge ${game.access === "pro" ? "tileBadgePro" : "tileBadgeFree"}">${badge(game)}</span>
                    ${locked ? '<span class="tileBadge tileBadgeLock">LOCKED</span>' : ""}
                  </div>
                </div>
                <div class="tileBottom">
                  <div class="tileTitle">${esc(game.name)}</div>
                  <div class="tileMeta">${esc(game.category)} · ${esc(game.sourceLabel)}</div>
                </div>
              </div>
              <div class="tileBody">
                <div class="tileNote">${esc(game.shortNote)}</div>
                <div class="tileFoot"><span>${esc(game.sourceLabel || game.provider || "external")}</span><span>${locked ? "Upgrade to unlock" : "Launch now"}</span></div>
              </div>
            </article>
          `;
        }).join("");
        upgradeTileCovers(grid);
        grid.querySelectorAll("[data-game-id]").forEach((node) => {
          node.addEventListener("click", () => {
            const game = GAMES.find((item) => item.id === node.getAttribute("data-game-id"));
            if (game) openGame(game);
          });
        });
      }
    }

    const gotdGrid = $("gotdGrid");
    if (gotdGrid) {
      upgradeTileCovers(gotdGrid);
      gotdGrid.querySelectorAll("[data-game-id]").forEach((node) => {
        node.addEventListener("click", () => {
          const game = GAMES.find((item) => item.id === node.getAttribute("data-game-id"));
          if (game) openGame(game);
        });
      });
    }

    const loadMoreWrap = $("loadMoreWrap");
    if (loadMoreWrap) {
      if (state.visible < list.length) {
        loadMoreWrap.innerHTML = '<button id="loadMoreBtn" class="primaryBtn">Load 15 more</button>';
        $("loadMoreBtn")?.addEventListener("click", () => {
          state.visible = Math.min(state.visible + PAGE_SIZE, list.length);
          render();
        });
      } else {
        loadMoreWrap.innerHTML = "";
      }
    }

    $("backToLibrary")?.addEventListener("click", () => {
      state.activeId = null;
      render();
    });
  }

  function render() {
    renderLibrary();
  }

  window.addEventListener("storage", () => {
    state.handle = handle();
    const handleEl = $("planHandle");
    if (handleEl) handleEl.textContent = state.handle || "Guest slot";
    loadPlan();
  });

  render();
  loadPlan();
  setStatus(`Arcade shelf loaded: ${GAMES.length} games`);
})();
