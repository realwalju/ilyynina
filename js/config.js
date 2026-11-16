/* ===========================================================================
   SITE CONFIG - the only file to edit for day-to-day updates.

   Read on 2026-11-16 from her Twitch channel (bio, panels, social links,
   clips, sub emotes). Anything needing her word is marked CONFIRM.
   =========================================================================== */

window.SITE = {
  /* --- Identity ---------------------------------------------------------- */
  name: 'Nina',
  handle: 'ilyynina',
  twitchHandle: 'ilyynina',
  tagline: 'XSET Fortnite pro, full-time streamer and Milk Cup 2025 champion. Born and raised in Colorado, playing since Chapter 1 Season 3.',

  // From her stream titles ("code ninalol").                      CONFIRM
  creatorCode: 'ninalol',

  // Her Twitch profile picture, hot-linked for the prototype. Self-host
  // (and get her OK) before launch.
  avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/7aa23e71-8034-46f8-b8bd-b72e2fe7961b-profile_image-600x600.png',

  /* --- Follower goal -----------------------------------------------------
     Her own Twitch goal on 2026-11-16: 32,133 / 33,000. `saved` paints
     first; the live number is read from decapi.me at page load.            */
  goal: { target: 33000, saved: 32133, label: 'Road to 33K followers' },

  /* --- Contact: the business address in her Twitch bio. ------------------ */
  contact: { email: 'ilyynina1@gmail.com', label: 'Business & collab inquiries' },

  /* --- Live panel: 'auto' asks decapi.me, true/false forces a state. ----- */
  live: {
    status: 'auto',
    offlineTitle: "Nina isn't live right now.",
    offlineNote: 'She streams full time - follow on Twitch, or join the Discord where she posts when she goes live.',
    unknownTitle: "Can't tell if Nina is live right now.",
    unknownNote: 'The channel itself always knows - the link below goes straight there.',
  },

  /* --- Ticker under the hero --------------------------------------------- */
  ticker: ['XSET Fortnite', 'Milk Cup 2025 champion', 'Code ninalol', 'hi hi hi hi hi', 'Mastery Monday', 'Viewer 1v1s on !map', 'Grinding into FNCS'],

  /* --- Socials: the links on her Twitch About page. ----------------------- */
  socials: [
    { icon: 'twitch',    label: 'Twitch',    handle: 'ilyynina',   url: 'https://www.twitch.tv/ilyynina' },
    { icon: 'youtube',   label: 'YouTube',   handle: 'ilyynina',   url: 'https://www.youtube.com/channel/UCOhg8Vfk6DBjUG_l2KS0yyA' },
    { icon: 'tiktok',    label: 'TikTok',    handle: '@ilynina',   url: 'https://www.tiktok.com/@ilynina' },
    { icon: 'instagram', label: 'Instagram', handle: '@ilyynina1', url: 'https://www.instagram.com/ilyynina1/' },
    { icon: 'x',         label: 'X',         handle: '@ilyynina',  url: 'https://x.com/ilyynina' },
    { icon: 'discord',   label: 'Discord',   handle: 'Community',  url: 'https://discord.gg/Th8dskDK7v' },
  ],

  /* --- Link hub: visible partner links copied from her live Linktree. -----
     Checked 2026-11-16. Preserve the full destinations and offer wording.
     Private sponsorship contracts were not available for review.           */
  links: {
    source: 'https://linktr.ee/ilyynina',
    checked: '2026-11-16',
    partners: [
      {
        brand: 'Blacklyte',
        title: 'Blacklyte Athena Pro Gaming Chair | Code Nina10 for 10% off',
        url: 'http://blacklyte.com/Nina10',
      },
      {
        brand: 'Nanoleaf',
        title: "code 'nina10' for 15% off nanoleafs",
        url: 'https://us-shop.nanoleaf.me/products/shapes-black-hexagons-smarter-kit-9pk',
      },
    ],
  },

  /* --- Clips -------------------------------------------------------------
     Picked from her clips page. Several top clips are titled "t", "a" or
     ".....", so these are the ones a visitor can read. Titles tidied by me.
                                                                    CONFIRM */
  clips: [
    { slug: 'FaithfulEncouragingWhaleEleGiggle-QJtve6X4WnNr6ZEd', title: 'The 1v4', meta: '0:08 - 2.1K views' },
    { slug: 'GorgeousGiantArugulaFailFish-_wTqgLNC9WtiNyl2', title: 'Crazy as it gets', meta: '0:29 - 3.3K views' },
    { slug: 'CrunchyCrunchyPepperUncleNox-MVFqnZuq8N8rcqnj', title: 'Yaz, bro', meta: '0:17 - 2.5K views' },
    { slug: 'OptimisticDignifiedOctopusCurseLit-5y_pZ3_QXCAg2FjD', title: 'IRL Globals prac room', meta: '0:30 - with MiniMikaela' },
    { slug: 'ShyShySandpiperPoooound-fzpS2se008bO1Ilh', title: 'Nini floss', meta: '0:30 - this month' },
    { slug: 'SourCaringGnatHeyGuys-OxlRvISKRBfBcriD', title: 'Bunny bouncing', meta: '0:24 - this month' },
    // Watch page only (home shows the first six).
    { slug: 'SecretiveYummySpiderNotATK-4KHm2uXmeAncdh48', title: 'hi hi hi hi hi', meta: 'this week' },
    { slug: 'BraveWealthyTigerPrimeMe-dVTiFLKi5qo7KZbu', title: "I don't even want the token anymore", meta: 'this week' },
    { slug: 'InnocentFilthyAmazonDansGame-6d8CaBZpdSOjN9fV', title: 'First GTA 5 playthrough', meta: 'this week' },
  ],

  /* --- Highlights --------------------------------------------------------
     Milk Cup: reported by esports press and trackers (won with Vader at
     TwitchCon San Diego, Oct 2025). Liquipedia could not be read, so no
     prize figures or full placement list yet.                      CONFIRM */
  highlights: [
    { emote: 'Cup1', value: 'Champion', label: 'The Milk Cup 2025', note: 'Won the all-women Fortnite LAN with Vader at TwitchCon San Diego, and took season MVP.' },
    { emote: 'Xset', value: 'XSET',     label: 'Signed Fortnite pro', note: 'Repping XSET in every lobby, scrim and stream title.' },
    { emote: 'Fncs', value: 'FNCS',     label: 'On the grind', note: 'Last Chance Qualifiers, cash cups and Reload - most nights, live.' },
  ],

  /* --- Recent streams (Watch page) ----------------------------------------
     Her six newest broadcasts on 2026-11-16, titles trimmed to the part
     before the first " | ". Twitch deletes VODs after a while, so launch
     needs the same scheduled refresh the other sites use.                  */
  streams: [
    { id: '2930319954', title: 'short late night gta stream', when: 'Nov 15', length: '1h 23m', thumb: 'd2vi6trrdongqn/7902b2486d78f23f7292_ilyynina_321404319712_1794808966' },
    { id: '2930016510', title: '1v1ing viewers on !map -> heats VP', when: 'Nov 15', length: '5h 18m', thumb: 'd2vi6trrdongqn/464f1cfa60549bd7edec_ilyynina_321394796000_1794780360' },
    { id: '2929154977', title: 'Watching Reload heats into pirate token hunting', when: 'Nov 14', length: '8h 04m', thumb: 'd2vi6trrdongqn/14405cdb78be070a2877_ilyynina_321160244444_1794704412' },
    { id: '2927940168', title: 'Viewer 1v1s on new !map -> skin cup w Reet', when: 'Nov 13', length: '6h 51m', thumb: 'd2vi6trrdongqn/5160ba0f8fd2d56a2d4b_ilyynina_321142613852_1794603844' },
    { id: '2927392628', title: 'Late night stream into GTA 5', when: 'Nov 12', length: '3h 12m', thumb: 'd2vi6trrdongqn/5f8148d7c9349b24c174_ilyynina_321341620320_1794547715' },
    { id: '2926263933', title: 'hi hi hi hi hi hi hi hi hi hi', when: 'Nov 11', length: '9h 00m', thumb: 'd2nvs31859zcd8/89dcb6ba94adfc762094_ilyynina_319877622487_1794439881' },
  ],

  /* --- Chat commands -------------------------------------------------------
     The ones in every stream title. `copy` copies, `url` opens, neither
     just shows the hint.                                                   */
  commands: [
    { cmd: '!code',    hint: 'ninalol', copy: 'ninalol' },
    { cmd: '!discord', hint: 'join the community', url: 'https://discord.gg/Th8dskDK7v' },
    { cmd: '!map',     hint: 'her viewer 1v1 map - ask in chat' },
    { cmd: '!giveaway', hint: 'when one is running' },
  ],

  /* --- Chat lore -----------------------------------------------------------
     Quotes are real stream titles and clip names from her channel, read
     2026-11-16. The one-liners under them are mine and I only know what
     the titles say, not the stories - she should rewrite or cut freely.
                                                                    CONFIRM */
  lore: [
    { quote: 'hi hi hi hi hi hi hi hi hi hi', source: 'Stream title, Nov 11', note: 'Ten his. Nine hours. No further explanation was offered.' },
    { quote: 'i dont even want the token anymore', source: 'Stream title, Nov 10', note: 'Hour six of pirate token hunting will do that to a person.' },
    { quote: 'Nina likes sniffing sharpies', source: 'Clip title, by chat', note: 'Chat names the clips. Chat cannot be trusted.' },
    { quote: 't', source: 'Clip title, six times over', note: 'Half the top clips on the channel are named "t". The other half are "a" and ".".' },
    { quote: 'Mini Mikvelma x XSET Daphne', source: 'Stream title, Reload cash cup', note: 'The duo with MiniMikaela. Mystery solved: they were scrimming.' },
    { quote: 'Mastery Monday', source: 'Stream title, Mondays', note: 'Mondays are for getting better. And token hunting.' },
    { quote: 'NINA LEAKS INSANE NEW TECH', source: 'Clip title, by chat', note: 'It was not insane. It may not have been tech.' },
    { quote: 'Nina getting bullied', source: 'Clip title, by chat', note: 'A recurring genre.' },
    { quote: 'nini floss', source: 'Clip title, this month', note: 'Yes, the dance.' },
  ],

  /* --- Career (About page) -------------------------------------------------
     From setup.gg's timeline (which cites Liquipedia, Inven and XSET) and
     esports press. Liquipedia itself could not be read.            CONFIRM */
  timeline: [
    { date: 'Feb 2026', title: '2nd - Reddysh Rumble: Love & Legends', note: 'NA, with Muz.' },
    { date: 'Oct 2025', title: 'Champion - The Milk Cup 2025', note: 'With Vader, on stage at TwitchCon San Diego. $78,000 to the duo, and season MVP.', big: true },
    { date: 'Dec 2024', title: 'Champion - The Milk Cup: Winter Split', note: 'With Vader.' },
    { date: 'Oct 2024', title: '2nd - The Milk Cup finals', note: 'With Vader and vanessuh, two days after signing.' },
    { date: 'Oct 2024', title: 'Signed with XSET', note: 'Same roster page as Clix and MrSavage.' },
    { date: 'Oct 2023', title: 'Joined Limit Esports', note: 'First org.' },
    { date: '2018',     title: 'Dropped in for the first time', note: 'Chapter 1 Season 3.' },
  ],

  /* --- Gear + settings (Setup page) ----------------------------------------
     From prosettings.net (updated 2026-05-18) and setup.gg (2026-10-27).
                                                                    CONFIRM */
  gear: [
    ['Mouse', 'Razer Viper V4 Pro', 'White'],
    ['Keyboard', 'Wooting 60HE+', '60%, analog'],
    ['Monitor', 'ZOWIE XL2546K', '24.5", 240Hz'],
    ['Headset', 'beyerdynamic DT 990 Pro', 'Open-back'],
    ['Mousepad', 'Strata Liquid 03', 'The Mousepad Company'],
  ],
  settings: [
    ['DPI', '800'], ['X / Y sens', '6.5%'], ['Targeting', '38.3%'], ['Scope', '38.1%'],
    ['Build / edit', '100%'], ['Resolution', '1920x1080'], ['FPS cap', '240'], ['Rendering', 'Performance'],
    ['HUD scale', '70%'], ['View distance', 'Medium'], ['Textures', 'Low'], ['Edit on release', 'Off'],
  ],
  binds: [
    { group: 'Build', keys: [['Wall', 'Z'], ['Floor', 'X'], ['Stairs', 'C'], ['Roof', 'V'], ['Trap', 'L-Alt'], ['Edit', 'G'], ['Rotate', 'R']] },
    { group: 'Combat', keys: [['Pickaxe', '1'], ['Slot 1', 'M5'], ['Slot 2', 'M4'], ['Slot 3', '4'], ['Slot 4', '5'], ['Slot 5', 'Q'], ['Use', 'E']] },
    { group: 'Move', keys: [['Jump', 'Space'], ['Sprint', 'L-Shift'], ['Crouch', 'L-Ctrl']] },
  ],

  /* --- Photos: local copies of her own public Twitter photos. ------------
     Collected 2026-11-16. Each photo links to its original post; sourceImage
     keeps the original Twitter image URL for future replacement.           */
  photos: [
    {
      src: 'assets/photos/new-hair.jpg', width: 900, height: 1200,
      alt: 'Nina showing her new hairstyle.', caption: 'New hair',
      date: '2026-10-22', dateLabel: 'Oct 22, 2026',
      url: 'https://x.com/ilyynina/status/2113339664837091676',
      sourceImage: 'https://pbs.twimg.com/media/HVQXOWTa8AA5Xw7.jpg?name=orig',
    },
    {
      src: 'assets/photos/halloween.jpg', width: 900, height: 1200,
      alt: 'Nina in a deer costume for Halloween.', caption: 'Happy Halloween',
      date: '2026-11-01', dateLabel: 'Nov 1, 2026',
      url: 'https://x.com/ilyynina/status/2116686868217799147',
      sourceImage: 'https://pbs.twimg.com/media/HV_7e84WIAAYlih.jpg?name=orig',
    },
    {
      src: 'assets/photos/october.jpg', width: 1200, height: 900,
      alt: 'Nina taking a selfie in a leopard-print top.', caption: 'October camera roll',
      date: '2026-10-08', dateLabel: 'Oct 8, 2026',
      url: 'https://x.com/ilyynina/status/2108258055075008868',
      sourceImage: 'https://pbs.twimg.com/media/HUIJg7QacAAoRTV.jpg?name=orig',
    },
    {
      src: 'assets/photos/milk-cup-medal.jpg', width: 900, height: 1200,
      alt: 'Nina holding her Milk Cup champion medal.', caption: 'The Milk Cup, 2025',
      date: '2025-10-19', dateLabel: 'Oct 19, 2025',
      url: 'https://x.com/ilyynina/status/1979721646832603542',
      sourceImage: 'https://pbs.twimg.com/media/G3liV2ZWQAEcLDs.jpg?name=orig',
    },
  ],

  /* --- About: her own Twitch panel, lightly tidied. ---------------------- */
  about: [
    "My name is Nina! I'm born and raised in Colorado. I've been playing Fortnite since Chapter 1 Season 3, but I've been gaming since 2016.",
    "I stream full time, chasing content creation and a dream - and I go to college on the side, majoring in accounting.",
  ],
  facts: [
    { k: 'Home',     v: 'Colorado, USA' },
    { k: 'Team',     v: 'XSET' },
    { k: 'Game',     v: 'Fortnite, since C1 S3' },
    { k: 'Off-stream', v: 'Accounting major' },
  ],

  /* --- Setup: straight from her Twitch panels. --------------------------- */
  setup: [
    {
      name: 'Gaming PC',
      parts: [
        ['CPU', 'AMD Ryzen 7 9800X3D'],
        ['GPU', 'Gigabyte GeForce RTX 5070 Ti 16GB'],
        ['Board', 'MSI B850 Tomahawk'],
        ['RAM', 'V-Color Manta XSky 32GB 6000 CL30'],
        ['Storage', 'Samsung 990 Pro 2TB'],
        ['Cooler', 'NZXT Kraken Core 360 RGB'],
        ['PSU', 'Montech Century II 850W'],
        ['Case', 'Lian Li Lancool 207'],
      ],
    },
    {
      name: 'Streaming PC',
      parts: [
        ['CPU', 'Intel Core i9-13900KF'],
        ['GPU', 'Gigabyte Windforce OC RTX 4070 12GB'],
        ['Board', 'MSI MPG Z790I Edge WiFi'],
        ['RAM', 'TeamGroup T-Create Expert 32GB DDR5-7200'],
        ['Storage', 'SK Hynix Platinum P41 2TB'],
        ['Cooler', 'Deepcool LT720'],
        ['PSU', 'Corsair RM1000x'],
        ['Case', 'Lian Li Lancool III RGB'],
      ],
    },
  ],

  /* --- Emotes ------------------------------------------------------------
     Her official sub emotes (prefix ilyyni), hot-linked from Twitch's CDN
     for the prototype. [token suffix, emote id]. Seasonal ones left out.   */
  emotes: [
    ['Hi', 'b11e2e30a9eb4a7b8ecdf637123647ea'], ['Wave', 'a5aac981751145f187df4691f534d9f3'],
    ['Love', 'fe0a104c9fbb45c3bdf5c5cf56f4663b'], ['Dance', '3c0c72a3345e48f9a221401ab3284d0b'],
    ['W', 'e29af6f6bc11469ab0026e612f1b166f'], ['L', '20178ec7b6eb4fa0be245ea0125415b6'],
    ['Xset', '26c161db5d844982856a59b9322dd373'], ['Fncs', '56eb5101603e4d72801ef00da3f5377b'],
    ['Cup1', 'c63ae096619c401e97993db13f15a581'], ['Clip', '1302532d62ec40679aa4e78ba2a7b7a1'],
    ['Giggle', '7cce1ecc7088470984c913758d369af7'], ['Lol', '974da56ca8ef46cd81af39753418e9c9'],
    ['Bonk', '3b08bb5c42ba4aa4ada36299617260f4'], ['Rage', 'd83e8128a8ea4090ab2dd04a1e577c98'],
    ['Scream', '1ecc34347efb4956b4662284f62ed4d8'], ['Scared', '0b0564f6a2c14068bab4e21ddabe1196'],
    ['Sad1', '076a1d3d517945d694bf8eabfa4a8ace'], ['Clown', 'eb4df3871b084215b1de8fb9f359e1cf'],
    ['Kiss', 'c0f9697b7b3b42a29ac10c4ffff01bc1'], ['Hug1', '0f3a1ae24972432084b37e07bac7aec7'],
    ['Cuddle', '1ba8275c8daa4a75b42c6d9349da30a5'], ['Cozy1', '1e16960116544d87a81213cf093fd11e'],
    ['Coffee', '3a9eccdd743841a3abb771384abf245e'], ['NOM', '4387f34278cc44c88af1d3d07c8eff0c'],
    ['Froggy', '43cace78d3214c8cb520939b37f16069'], ['Hippo', '93c18b10014d476c91cca001b195d68c'],
    ['Rigby', '6cdaf0b208ca45b88cfd847ccb66f8fe'], ['Catdog', '9f8a89c5b93046ee93f8dcefdb7ada6a'],
    ['Cathug', '9db96b8b8a58431c8b78baf364373739'], ['Angel', '02048a05e1b9499c90ad1e843acf2d9c'],
    ['Howdy', 'b7c1dd18e261464d9477bbdada0b7b08'], ['Salute', 'f4ddfa7317bb49068ce8b25eabe1c409'],
    ['NightOwl', '7b8781b89fa0421e9a8301cb719ea84a'], ['Raid', 'e6dc0ff56fd24d8d9a485a3e9347df28'],
  ],
  // Emotes page only: seasonal and gift ones, kept off the rail.
  emotesExtra: [
    ['CFA', '535df20357fb43a3ae891b71b8190e24'], ['Hug2', '8190a13f55b34f29b02c44514c278b6d'],
    ['Gift1', '88215664b7084e20bf68d9abe4cc52d2'], ['Gift2', '6d43a27a58d04351ad94c9788217322f'],
    ['Xmas', '57e09b019b43456ea649637ba82fb8f8'], ['Nutcracker', 'f772c79ba3f0438aa5b59d8e92c2cac3'],
  ],
};
