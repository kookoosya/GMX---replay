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
    "id": "tripeaks-solitaire-escapes",
    "name": "Tripeaks Solitaire Escapes",
    "icon": "🃏",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/c1337d45912e45b5be9666f08ba81963/",
    "launchUrl": "https://html5.gamedistribution.com/c1337d45912e45b5be9666f08ba81963/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "snow-rider-obby-parkour",
    "name": "Snow Rider Obby Parkour",
    "icon": "🏂",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1547396115-32115ec66fb7?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/1d74e75b8da74767938d3310255b4bd3/",
    "launchUrl": "https://html5.gamedistribution.com/1d74e75b8da74767938d3310255b4bd3/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Racing",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "obby-vs-zombies",
    "name": "Obby vs Zombies",
    "icon": "🧟",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/bbb134e346924f8ba823e5a674a3e0aa/",
    "launchUrl": "https://html5.gamedistribution.com/bbb134e346924f8ba823e5a674a3e0aa/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Action",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "plane-chase",
    "name": "Plane Chase",
    "icon": "✈️",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/7da1d1f0bbe64db08338b05e9a697290/",
    "launchUrl": "https://html5.gamedistribution.com/7da1d1f0bbe64db08338b05e9a697290/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Racing",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "sniper-team-3",
    "name": "Sniper Team 3",
    "icon": "🎯",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/721b8b5b05f14963b4266a51d8a59e73/",
    "launchUrl": "https://html5.gamedistribution.com/721b8b5b05f14963b4266a51d8a59e73/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Shooter",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "time-walker-survive",
    "name": "Time Walker: Survive",
    "icon": "⏳",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/b9bde9f7b60f44b6832384a50000dc72/",
    "launchUrl": "https://html5.gamedistribution.com/b9bde9f7b60f44b6832384a50000dc72/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Survivor",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "zombie-redemption",
    "name": "Zombie Redemption",
    "icon": "🧨",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://html5.gamedistribution.com/60fe1469f0cd4b4a8de22879939d5db7/",
    "launchUrl": "https://html5.gamedistribution.com/60fe1469f0cd4b4a8de22879939d5db7/",
    "sourceLabel": "GameDistribution",
    "shortNote": "",
    "category": "Action",
    "provider": "gamedistribution",
    "badge": null
  },
  {
    "id": "1v1-lol",
    "name": "1v1.LOL",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1547396115-32115ec66fb7?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/bloxdhop-io",
    "launchUrl": "https://www.crazygames.com/embed/bloxdhop-io",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Arcade",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "merc-zone",
    "name": "Merc Zone",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/merc-zone",
    "launchUrl": "https://www.crazygames.com/embed/merc-zone",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "crazy-roll-3d",
    "name": "Crazy Roll 3D",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/paperio-2",
    "launchUrl": "https://www.crazygames.com/embed/paperio-2",
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
    "imageUrl": "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1547396115-32115ec66fb7?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/madalin-stunt-cars-2",
    "launchUrl": "https://www.crazygames.com/embed/madalin-stunt-cars-2",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "city-car-driving",
    "name": "City Car Driving",
    "icon": "🕹️",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/city-car-driving-simulator-stunt-master",
    "launchUrl": "https://www.crazygames.com/embed/city-car-driving-simulator-stunt-master",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Simulation",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "top-speed-3d",
    "name": "Top Speed 3D",
    "icon": "🏎️",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/top-speed-racing-3d",
    "launchUrl": "https://www.crazygames.com/embed/top-speed-racing-3d",
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
    "imageUrl": "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/evo-world-io",
    "launchUrl": "https://www.crazygames.com/embed/evo-world-io",
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
    "imageUrl": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/skribbl-io",
    "launchUrl": "https://www.crazygames.com/embed/skribbl-io",
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
    "imageUrl": "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/words-of-wonders",
    "launchUrl": "https://www.crazygames.com/embed/words-of-wonders",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Puzzle",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "pixel-gun-apoc",
    "name": "Pixel Gun Apoc",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/pixel-gun-apocalypse-3",
    "launchUrl": "https://www.crazygames.com/embed/pixel-gun-apocalypse-3",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "forward-assault",
    "name": "Forward Assault",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/forward-assault-remix",
    "launchUrl": "https://www.crazygames.com/embed/forward-assault-remix",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "combat-online",
    "name": "Combat Online",
    "icon": "🔫",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/combat-online",
    "launchUrl": "https://www.crazygames.com/embed/combat-online",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "dead-zed",
    "name": "Dead Zed",
    "icon": "🔫",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
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
    "imageUrl": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/buildnow-gg",
    "launchUrl": "https://www.crazygames.com/embed/buildnow-gg",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Action",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "vortex-9",
    "name": "Vortex 9",
    "icon": "🔫",
    "access": "pro",
    "imageUrl": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/vortex-9",
    "launchUrl": "https://www.crazygames.com/embed/vortex-9",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Shooter",
    "provider": "crazygames",
    "badge": null
  },
  {
    "id": "polytrack",
    "name": "PolyTrack",
    "icon": "🏎️",
    "access": "free",
    "imageUrl": "https://images.unsplash.com/photo-1547396115-32115ec66fb7?auto=format&fit=crop&w=600&q=80",
    "embedUrl": "https://www.crazygames.com/embed/polytrack",
    "launchUrl": "https://www.crazygames.com/embed/polytrack",
    "sourceLabel": "CrazyGames",
    "shortNote": "",
    "category": "Racing",
    "provider": "crazygames",
    "badge": null
  }
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
    if (raw === "симулятор") return "Simulation";
    if (raw === "головоломка") return "Puzzle";
    if (raw === "платформер") return "Platformer";
    if (raw === "стратегия") return "Strategy";
    if (raw === "выживание") return "Survivor";
    const key = raw.replace(/[^a-z]+/g, "");
    return CATEGORY_LABELS[key] || "Arcade";
  }
  function normalizedArcadeNote(game, category) {
    const key = String(category || "").trim().toLowerCase().replace(/[^a-z]+/g, "");
    return CATEGORY_NOTES[key] || "Browser game slot with direct launch.";
  }
  const GAMES = RAW_GAMES.map((game) => {
    const category = normalizeArcadeCategory(game && game.category);
    return {
      ...game,
      category,
      shortNote: normalizedArcadeNote(game, category)
    };
  });
  const PAGE_SIZE = 15;
  const CATEGORY_COVERS = {
    action: "/assets/arcade/covers/action.webp",
    arcade: "/assets/arcade/covers/arcade.webp",
    crypto: "/assets/arcade/covers/crypto.webp",
    idle: "/assets/arcade/covers/idle.webp",
    platformer: "/assets/arcade/covers/platformer.webp",
    puzzle: "/assets/arcade/covers/puzzle.webp",
    racing: "/assets/arcade/covers/racing.webp",
    shooter: "/assets/arcade/covers/shooter.webp",
    simulation: "/assets/arcade/covers/simulation.webp",
    sports: "/assets/arcade/covers/sports.webp",
    strategy: "/assets/arcade/covers/strategy.webp",
    survivor: "/assets/arcade/covers/survivor.webp",
    generic: "/assets/arcade/covers/generic.webp"
  };
  function categoryCover(game) {
    const raw = String(game && game.category || "").toLowerCase().trim();
    const key = raw.replace(/[^a-z]+/g, "");
    return CATEGORY_COVERS[key] || CATEGORY_COVERS.generic;
  }
  function localGameCover(game) {
    try {
      const id = String(game && game.id || "").trim();
      if (!id) return categoryCover(game);
      return `/assets/arcade/covers/games/${encodeURIComponent(id)}.svg`;
    } catch {
      return categoryCover(game);
    }
  }
  function remoteCoverUrl(game) {
    try {
      const raw = String(game && game.imageUrl || "").trim();
      if (!raw) return "";
      const url = new URL(raw, window.location.origin);
      const host = String(url.hostname || "").toLowerCase();
      if (!/^https?:$/i.test(String(url.protocol || ""))) return "";
      if (host === "images.crazygames.com") return url.toString();
      return "";
    } catch {
      return "";
    }
  }
  function upgradeTileCovers(scope) {
    try {
      (scope || document).querySelectorAll("img[data-fallback-cover]").forEach((img) => {
        if (img.dataset.coverBound === "1") return;
        img.dataset.coverBound = "1";
        const fallback = String(img.getAttribute("data-fallback-cover") || "").trim();
        const remote = String(img.getAttribute("data-remote-cover") || "").trim();
        const swapToFallback = () => {
          if (fallback && img.getAttribute("src") !== fallback) img.setAttribute("src", fallback);
        };
        img.addEventListener("error", swapToFallback, { once: false });
        if (!img.complete || !img.naturalWidth) swapToFallback();
        if (remote && remote !== fallback) {
          const probe = new Image();
          probe.referrerPolicy = "no-referrer";
          probe.onload = () => {
            try { img.setAttribute("src", remote); } catch (_e) {}
          };
          probe.onerror = () => {};
          probe.src = remote;
        }
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

  function renderLibrary() {
    const list = filtered();
    const visible = visibleGames();
    const locked = lockedGame();
    const active = activeGame();
    const root = $("arcadeRoot");
    if (!root) return;

    root.innerHTML = `
      <section class="panel heroPanel">
        <div class="heroRow">
          <div>
            <div class="eyebrow">Live arcade shelf</div>
            <h1>Arcade</h1>
            <div class="heroText">Stable 50 game catalog with cleaner card copy, readable covers, and direct launch flow.</div>
          </div>
          <div class="planCard">
            <div id="planLabel" class="planMain">${esc(planLabel())}</div>
            <div id="planHandle" class="planSub">${esc(state.handle || "Guest slot")}</div>
          </div>
        </div>
      </section>
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
                <img src="${esc(localGameCover(game))}" data-fallback-cover="${esc(localGameCover(game))}" data-remote-cover="${esc(remoteCoverUrl(game))}" alt="${esc(game.name)}" loading="lazy" referrerpolicy="no-referrer"/>
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
