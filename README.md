# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style ship thruster test map.

The map contains one zoomed-in player ship. The player ship starts facing up and is drawn as a rectangle with seven numbered thruster entities drawn as circles on the hull:

- Orange: main back thruster for forward movement
- Blue: front reverse thrusters
- Green: bottom side thrusters for upward movement
- Purple: top side thrusters for downward movement

The joystick has eight fixed upward-aligned slices: main back thruster, both front reverse thrusters, right top, left top, right bottom, left bottom, both left, and both right. Distance from the center sets power percentage. When the stick is released, the player ship automatically fires thrusters against its current velocity to stabilize to a stop.

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
