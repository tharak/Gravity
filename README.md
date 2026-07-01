# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style ship thruster test map.

The map contains one zoomed-in player ship. The player ship starts facing up and is drawn as a rectangle with seven numbered thruster entities drawn as circles on the hull. Thrusters apply force from their mounted location, so off-center thrusters rotate the ship through torque:

- Orange: main back thruster for forward movement, tuned to 10x the baseline thruster power
- Blue: front reverse thrusters
- Green: bottom side thrusters for upward movement
- Purple: top side thrusters for downward movement

The mobile controls now let the pilot choose exactly which thrusters receive power. Each thruster has an on/off switch, and the power slider controls the throttle sent to every enabled thruster.

The ship starts with a 100-unit battery. The main thruster consumes 3 units per second at full power, each other thruster consumes 1 unit per second, and the battery recharges by 1 unit per second. If the selected thrusters request more energy than the battery has available, thrust is scaled down to match the available charge.

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
