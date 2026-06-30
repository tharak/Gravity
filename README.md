# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style gravity simulation rendered as colored circles:

- Blue: planet
- Green: resource planet
- Red: ship
- Gray: abandoned station

Planets and stations are static gravity sources. Ships are dynamic bodies affected by those gravity sources and by player thrust. The map uses a fixed whole-system view, and sunlight is a render-only direction used for planet shading. The player ship has a white outline. Drag the on-screen joystick on mobile or desktop to apply thrust.

## Run Locally

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Test

```sh
npm test
```

## Project Layout

- `src/core`: portable math primitives
- `src/ecs`: entity and component storage
- `src/game`: simulation orchestration and entity factories
- `src/systems`: ECS systems such as gravity and integration
- `src/rendering`: canvas camera and circle rendering
- `src/scenes`: starter world composition
- `tests`: physics and integration tests
