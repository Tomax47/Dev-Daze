# Dev Daze

**Interactive zen playground — 14 modes · infinite vibes**

Dev Daze is basically a collection of 14 interactive visual modes you can just vibe with — particle effects, physics sims, fluid dynamics, all that stuff. Pick something from the menu, watch it do its thing, click around, move your mouse. No goal, no score. Just vibes.

Made it purely for fun.

---

## Modes

| Mode | What it does |
|---|---|
| Particle Nebula | Mouse-reactive particle system with color-shifting trails |
| Black Hole | Gravity well that pulls and consumes dots |
| Ripple Pool | Water ripple simulation you can click into |
| Gravity Dojo | N-body physics sim with draggable balls |
| Lava Lamp | Blobs floating around with buoyancy simulation |
| Sand Fall | Falling particles with collision and spreading |
| Kaleidoscope | Rotating symmetrical geometric patterns |
| Liquid | Full 2D liquid physics — water, drops, bubbles, bricks |
| Vibe Room | Click counter with confetti and ambient particles |
| Rain Glass | Raindrops streaming down a glass surface with refraction |
| Aurora | Gradient wave flow with simplex noise |
| Biolum Tide | Bioluminescent wave effect |
| Soap Bubbles | Floating bubbles with physics-based motion |
| Ember Glow | Particle flame and ember system |

---

## Stack

- [Next.js](https://nextjs.org/) — framework
- [React 19](https://react.dev/) — UI
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [Simplex Noise](https://github.com/jwagner/simplex-noise) — organic wave patterns
- [Canvas Confetti](https://github.com/catdad/canvas-confetti) — you'll know it when you see it
- HTML5 Canvas — all the visual modes run on it

---

## Running locally

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contributing

Contributions are welcome. New modes, fixes, improvements, whatever you think would be cool.

1. Fork the repo
2. Create a branch (`git checkout -b my-new-mode`)
3. Make your changes
4. Open a pull request

For new modes, add your component under `components/modes/`, wire it up in `app/page.tsx`, and add an icon to `components/ui/mode-icons.tsx`. Try to keep the canvas/RAF pattern consistent with the existing modes.

Feel free to tag yourself on your modes page, as long as the UI keeps clean.
