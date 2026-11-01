# Fixing Good

> They fixed good. Then good fixed them.

A side-scrolling desert crime action game. You play **Jace Pinkett**, a small-time dealer who partners up with **Walter Black**, a bald, bespectacled chemistry teacher with a lot to prove. Cook in a beat-up RV, sell on the street, gear up at the pawn shop, and shoot your way through eight story chapters of gangs, cartels and bikers.

Everything is drawn and synthesized in code: every character, gun, explosion, sound effect and music note. There are no image or audio files.

## Play

- **Easiest:** open `dist/fixing-good.html` in any modern browser. It's one self-contained file and runs straight from disk.
- **From source:** open `index.html` directly, or serve the folder (`npm start` serves it at http://localhost:8080).

Progress saves automatically in the browser (localStorage).

## What's in it

**Story:** 8 chapters with in-engine cutscenes, voiced-by-text dialogue with character portraits, chapter title cards, and an ending with credits.

| # | Chapter | What happens |
|---|---|---|
| 1 | Cold Start | The first cook in the RV, then two local hoods want your product |
| 2 | Loco | A fist fight to impress Rafa, a double-cross, and a junkyard boss fight |
| 3 | Barrels | A night-time warehouse heist by flashlight, with takedowns and alarms |
| 4 | Highway to Nowhere | Ride the roof of the RV and fight off biker gangs at highway speed |
| 5 | The Twins | A motel ambush and two silent hitmen |
| 6 | Golden Hen | A meeting with a chicken magnate, then defend Walter in the superlab |
| 7 | Rancho Muerte | Storm a cartel ranch and take down Don Esteban |
| 8 | Last Ride | Chase the Dust Dogs, break Walter out, and get the M60 "trunk gun" |

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

**Trading and the hub**
- A county map with places to drive the RV between, with random biker ambushes and DEA checkpoints on the road.
- **Cooking:** a five-step minigame (heat, catalyst, stir, cool, break & bag). Purity drives the price. The chemistry is entirely fictional.
- **Street trading:** buyers with their own prices, haggling that can make them walk off, and undercover cops who ask too many questions.
- **Heat:** selling raises it. High heat brings DEA checkpoints; a lawyer can make it go away for a fee.
- **Shops:** guns, ammo, armor, medkits and throwables at Dusty's; precursor and lab gear at the Hardware Barn.
- **Upgrades:** faster reloads, hollow points, more health, brass knuckles, a wider cooking sweet spot.
- **Side jobs:** at The Dog House, generated bounty and turf-war missions that change every day.

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
js/story.js       all chapters, levels, cutscenes and dialogue
js/scenes.js      loading, menu, hub map, shops, trading, cooking, missions, ending
js/jobs.js        generated side jobs
js/main.js        game state, save/load, main loop
build.mjs         bundles everything into dist/fixing-good.html
check.mjs         syntax-checks every script
```

Dev shortcuts (append to the URL): `?level=junkyard`, `?scene=hub|cook|dusty|trade|jobs|ending`, `&god`, `&ch=4`, `&speed=3`.

## Note

Fixing Good is an original parody. All characters, places and organizations are fictional, and the "chemistry" in the cooking minigame is made up.

Font: [Oswald](https://fonts.google.com/specimen/Oswald) (SIL Open Font License), loaded from Google Fonts. Offline, the game falls back to a system font.
