# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style ship thruster test map.

The map contains one zoomed-in player ship. The player ship starts facing up and is drawn as a rectangle with seven numbered thruster entities drawn as circles on the hull. Thrusters apply force from their mounted location, so off-center thrusters rotate the ship through torque:

- Orange: main back thruster for forward movement, tuned to 10x the baseline thruster power
- Blue: front reverse thrusters
- Green: bottom side thrusters for upward movement
- Purple: top side thrusters for downward movement

The mobile controls use eight press-and-hold thruster buttons. Up, down, left, and right are larger than the diagonal buttons. Holding a button fires its mapped thrusters at full power. Current debug mapping:

- Up: 2 + 3
- Down: 1
- Right: 6 + 7
- Left: 4 + 5
- Up-right: 7
- Down-right: 6
- Down-left: 4
- Up-left: 5

When no button is held, the player ship automatically fires thrusters against its current velocity to stabilize to a stop. Stabilizing thrusters use the same thrust application path as button controls and pulse visually while active.

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
