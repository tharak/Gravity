# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style ship thruster test map.

The map contains only one player ship. The ship is drawn as a rectangle with seven thruster entities drawn as circles on the hull:

- Orange: main back thruster for forward movement
- Blue: front reverse thrusters
- Green: bottom side thrusters for upward movement
- Purple: top side thrusters for downward movement

The joystick uses matching color sectors. Distance from the center controls thruster power percentage.

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
