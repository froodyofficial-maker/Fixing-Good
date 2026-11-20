# Fixing Good

> They fixed good. Then good fixed them.

A side-scrolling desert crime action game. You play **Jace Pinkett**, a small-time dealer who partners up with **Walter Black**, a bald, bespectacled chemistry teacher with a lot to prove. Cook in a beat-up RV, sell on the street, gear up at the pawn shop, and shoot your way through seventeen story chapters of gangs, cartels and bikers. Then keep playing in **Blue Sky Run**, an endless roguelite mode.

Everything is drawn and synthesized in code: every character, gun, explosion, sound effect and music note. There are no image or audio files.

## Two versions

| | How to play | What it is |
|---|---|---|
| **2D** | open `dist/fixing-good.html` | The original side-scroller |
| **2D demo** | open `dist/fixing-good-demo.html` | The first three chapters and a three-night Blue Sky Run |
| **3D** | open `3d/dist/fixing-good-3d.html` | A third-person shooter built on three.js: same story, characters, trading and cooking, all in 3D |

Both are single self-contained files that run straight from disk. The sections below describe the 2D version; the 3D version is described in [3D version](#3d-version).

## Play

- **Easiest:** open `dist/fixing-good.html` in any modern browser. It's one self-contained file and runs straight from disk.
- **From source:** open `index.html` directly, or serve the folder (`npm start` serves it at http://localhost:8080).

Progress saves automatically in the browser (localStorage).

## What's in it

**Story:** 17 chapters (about two and a half hours on a first playthrough) with in-engine cutscenes, portrait dialogue, choices and a post-credits scene. It's a dark story: people around Jace die, and Walter is not a good man. Whether he's really dead at the end is another question.

| # | Chapter | What happens |
|---|---|---|
| 1 | Cold Start | The first cook in the RV, then two local hoods want your product |
| 2 | Loco | A fist fight to impress Rafa, a double-cross, and a junkyard boss fight |
| 3 | Corners | Take Southside from Spider's crew with Nico, a kid from the projects, and meet the mother of a boy who sold your blue |
| 4 | Barrels | A night-time warehouse heist by flashlight, with takedowns and alarms |
| 5 | Highway to Nowhere | Ride the roof of the RV and fight off biker gangs at highway speed |
| 6 | Lena | Storm Spider's trap house for Lena, Jace's best friend since third grade, then the worst morning of his life, and her funeral |
| 7 | The Twins | A motel ambush and two silent hitmen |
| 8 | Morty | Someone torched your lawyer's strip mall. Fight El Gordo for him; Morty knows a guy who makes people disappear |
| 9 | Golden Hen | A meeting with a chicken magnate, then defend Walter in the superlab |
| 10 | Nico | Fenn sends a message. Hunt the killers; decide what happens to the one on his knees |
| 11 | Rancho Muerte | Storm a cartel ranch and take down Don Esteban |
| 12 | Thursday | Rob Fenn's armoured convoy from the roof of the RV |
| 13 | Checkmate | Kill Fenn and his enforcer, then hear what Walter really did the night Lena died |
| 14 | Brewer | Walter's brother-in-law has found you, and Walter has invited the Dust Dogs |
| 15 | Alone | No partner, no money: rebuild with your corners, then buy a crew |
| 16 | Chop Shop | Lead your hired guns through the Dust Dogs' chop shop and make Rook talk |
| 17 | Last Ride | Chase the Dust Dogs, storm the compound, and decide what to do with a dying Walter |

Later chapters ask for street results first: bags sold, reputation and cash. That's where the dealing comes in.

**Dialogue skipping:** press **Enter** (or click SKIP) to skip a conversation, or **Tab** (SKIP ALL) to skip every conversation for the rest of the mission. Settings has *Story dialogue: SKIP ALL* to skip them everywhere. Choices still appear.

**Gunplay**
- Six guns: M9 pistol, .357 Magnum, 12ga pump, Uzi, AKM and M60, plus Rafa's gold pistols.
- Fully animated reloads. Mags drop and bounce on the ground, the off hand fetches a fresh one from the belt, and slides get racked. The revolver swings out its cylinder and dumps brass. The shotgun loads shell by shell, and you can fire mid-reload. The M60 flips its feed cover and swaps the ammo box.
- Spent casings, muzzle flashes, tracers, recoil, hit markers and headshots (2.6×). Armor, and bullets that punch through cover and targets.
- Fire: Dragon's Breath incendiary shells, Molotovs, exploding barrels and propane tanks, burning enemies.
- Walter's Bang Crystals: thrown explosives.
- Gore (adjustable in Settings): blood spray and pools, exit-wound splatter on walls, verlet ragdolls, decapitations and dismemberment on heavy hits and explosions.

**Fights**
- Melee combo: jab → cross → kick. Kicks launch people.
- Silent one-punch takedowns on enemies who haven't spotted you.
- Dodge roll with invulnerability frames, crouch-behind-cover, one-way platforms.

**Dealing**
- **Five districts:** Downtown, Southside, University Row, the Route 9 truck stop and the Silver Spur casino strip. Each has its own prices, demand, cop presence and robbery risk. Selling a lot floods a market until it recovers.
- **Buyers:** regulars, hagglers, desperate users, rich kids, bulk buyers, undercover cops and robbers.
- **Negotiation:** set a quantity and an asking price, and they counter until their patience runs out.
  - *Read them* for tells, but you can misread a cop.
  - *Talk quality* (works if your purity is high).
  - *Apply pressure* (desperate buyers cave, others walk).
  - *Throw in a free bag*, or *walk away* as a bluff.
- **Fronting:** front product on credit at 130% for three days. Buyers who don't pay become collection jobs.
- **Risks:** an undercover cop costs you the bags and a lot of heat. Robbers pull a knife; fight them in an alley, or hand it over.
- **Cutting:** stretch 4 bags into 6. You get more bags, but lower purity, and buyers notice.
- **Reputation:** raises prices and brings more buyers. You gain it with good product and fair deals, and by answering turf wars.
- **Corner dealers:** hire them per district and keep them stocked. They sell every night and you get 70%. They can get arrested, robbed (which triggers a turf-war job) or start skimming if their loyalty drops.
- **Morning report:** shows what happened overnight. *The Operation* screen at the RV camp shows your crew and who owes you.

**The hub**
- A county map with places to drive the RV between, with random biker ambushes and DEA checkpoints on the road.
- **Cooking:** a five-step minigame (heat, catalyst, stir, cool, break & bag). Purity drives the price. The chemistry is entirely fictional.
- **Heat:** selling raises it. High heat brings DEA checkpoints and undercover buyers; a lawyer can make it go away for a fee.
- **Shops:** guns, ammo, armor, medkits and throwables at Dusty's; precursor and lab gear at the Hardware Barn.
- **Upgrades:** faster reloads, hollow points, more health, brass knuckles, a wider cooking sweet spot.
- **Side jobs:** at The Dog House, generated bounty and turf-war missions that change every day, plus collection and turf-defence jobs from your street business.

**Blue Sky Run (replayable mode):** an endless roguelite from the main menu, separate from your story save.
- Each night, pick one of three generated contracts: turf wars, bounties, hold-the-stash wave defence, or convoy runs on the RV roof.
- Contracts roll modifiers (Blackout, Bloodbath, Tough Crowd, Pincer, Powder Keg, Payday, Walter Rides Along) that raise the risk and the pay.
- Every fourth night is a boss night: Spider, Rafa, the Cortez twins, El Gordo, Gideon, Don Esteban, Rook, Fenn or Uncle Dutch.
- Between nights, pick one of three perks (Thick Skin, Hot Loads, Bloodlust, Volatile, Marksman, Dragon's Breath, new guns and more), reroll for cash, and restock at Dusty's van.
- One life, no checkpoints. Your score is based on nights, kills, headshots and cash. The **Daily Run** gives everyone the same seed for the day.

**Demo:** `dist/fixing-good-demo.html` has the first three chapters, the dealing districts they unlock, and a three-night Blue Sky Run. It saves separately from the full game.

**Presentation:** a loading screen, title menu, settings (volume, music, screen shake, gore level, difficulty), pause menu, checkpoints, a game-over/retry screen, and mission results.

## Controls

| Key | Action |
|---|---|
| A / D | Move |
| W / Space | Jump |
| S (hold) | Crouch (S + Space drops through platforms) |
| Shift | Dodge roll |
| Mouse | Aim |
| Left click | Shoot (hold for automatics) |
| R | Reload |
| F / Right click | Melee combo |
| 1–6, mouse wheel, Q | Switch weapon / last weapon |
| G | Throw Bang Crystal |
| V | Throw Molotov |
| H | Use medkit |
| E | Interact |
| Space / click | Advance dialogue |
| Enter / Tab | Skip this conversation / skip all dialogue this mission |
| 1 / 2 | Pick an option when a choice appears |
| Esc | Pause |

## Project layout

```
index.html        page shell; loads the scripts below in order
js/core.js        canvas, math, input, synthesized audio + music, settings
js/art.js         character renderer (IK limbs, faces, hats, glasses), portraits, guns, RV, props, scenery
js/weapons.js     weapon stats + the keyframed reload animation system
js/fx.js          particles, blood, decals, casings, dropped mags, dynamic lighting
js/actors.js      player/enemy/ally logic, AI, melee, ragdolls with dismemberment
js/level.js       level runtime: physics world, bullets, explosions, fire, scripting, HUD, dialogue
js/highway.js     the RV-roof highway chase mode and enemy vehicles
js/story.js       the original chapters, levels, cutscenes and dialogue
js/story2.js      the expanded story: new chapters, choices, endings
js/dealing.js     districts, buyers, negotiation, cutting, fronts, corner dealers, daily simulation
js/scenes.js      loading, menu, hub map, shops, trading, cooking, missions, ending
js/story3.js      the funeral, Morty, Thursday, Chop Shop, the ending and the post-credits scene
js/jobs.js        generated side jobs
js/run.js         Blue Sky Run (roguelite mode) and the demo's end screen
js/main.js        game state, save/load, main loop
build.mjs         bundles everything into dist/fixing-good.html and dist/fixing-good-demo.html
check.mjs         syntax-checks every script
```

Dev shortcuts (append to the URL): `?level=junkyard`, `?scene=hub|cook|dusty|trade|jobs|ending`, `&god`, `&ch=4`, `&speed=3`.

## Note

Fixing Good is an original parody. All characters, places and organizations are fictional, and the "chemistry" in the cooking minigame is made up.

Font: [Oswald](https://fonts.google.com/specimen/Oswald) (SIL Open Font License), loaded from Google Fonts. Offline, the game falls back to a system font.

## 3D version

`3d/` is a separate third-person build of the game.

- **Play:** open `3d/dist/fixing-good-3d.html`. Click the game to capture the mouse.
- **Look and feel:** an over-the-shoulder camera with aim-down-sights (hold right-click), sprint, crouch, jump and dodge-roll.
- **Characters:** procedural 3D characters built from the same looks as the 2D game (Walter's glasses and goatee, Jace's beanie). They have walk/run/strafe cycles, IK arms on the guns, and keyframed 3D reloads: mags drop and bounce, revolver brass spills, shells load one at a time, and the M60 gets a new ammo box.
- **Combat:** hitscan gunplay with tracers, muzzle flashes, casings, bullet holes and blood decals. Ragdolls can lose heads and limbs to heavy hits and explosions. There are exploding barrels, Molotov fires, Bang Crystals and the gun-mounted flashlight in the warehouse.
- **Content:** all eight chapters as 3D levels with in-engine cutscenes, plus the RV-roof highway chase where the desert streams past at speed. The title menu, RV camp, drives, street trading and the cook are 3D scenes; the hub map, shops and side jobs use the same screens as the 2D version.

| Key | Action |
|---|---|
| W A S D / Mouse | Move / look |
| Left click / Right click (hold) | Shoot / aim down sights |
| Shift / Space / C / X | Sprint / jump / crouch / dodge roll |
| R / F / E | Reload / melee combo / interact |
| 1–6, wheel, Q | Switch weapon |
| G / V / H | Bang Crystal / Molotov / medkit |
| Esc | Pause |

To rebuild after editing `3d/src/`, run these from `3d/`: `npm install`, then `node build.mjs`. Dev shortcuts: `?level=junkyard`, `?scene=hub|cook|trade|camp|drive|jobs|ending`, `&god`, `&ch=4`, `&speed=3`, `&lowres`.
