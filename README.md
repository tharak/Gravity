# Gravity

Browser gravity simulator for a future space game with ships, planets, resources, and combat.

The current milestone is a dependency-free ECS-style ship thruster test map.

The map contains one zoomed-in player ship. The player ship starts facing up and is drawn as a rectangle with seven numbered thruster entities drawn as circles on the hull. Thrusters apply force from their mounted location, so off-center thrusters rotate the ship through torque:

- Orange: main back thruster for forward movement, tuned to 10x the baseline thruster power
- Blue: front reverse thrusters
- Green: bottom side thrusters for upward movement
- Purple: top side thrusters for downward movement

The cockpit has a manual mode and an automatic mode. In manual mode each thruster has an on/off switch (or the WASD keys for thruster groups), and the acceleration order (STOP through FLANK, stepped with Q/E) sets the throttle sent to every enabled thruster. In automatic mode the pilot picks a compass heading and the autopilot rotates the ship and fires the main thruster. The STOP order stabilizes linear and angular motion.

Every ship also mounts a gun equipment component (EC). The gun has separate aim and shoot modes: manual aim follows the mouse or touch position on the canvas while automatic aim tracks the nearest ship; manual shoot fires while Space or a touch on the canvas is held, while automatic shoot fires whenever a ship is within range. Projectiles are world entities that inherit the ship's velocity, curve under gravity, and damage whatever they hit — showing damage popups and stressing the target's ECs. Each shot drains battery energy and heats the gun; near its heat tolerance the gun holds fire (the barrel turns red) and resumes shooting once it has cooled down.

The ship battery's capacity scales with the map size. The main thruster consumes 3 units per second at full power, each other thruster consumes 1 unit per second, and the battery recharges from the ship (1 unit per second) plus its solar panel (3 units per second). If the selected thrusters request more energy than the battery has available, thrust is scaled down to match the available charge. Collisions and material stress damage the hull and its equipment components (ECs).

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
- `src/config`: model, view, and UI label tuning values
- `src/game`: simulation orchestration, entity factories, and shared world queries
- `src/systems`: ECS systems such as gravity and integration
- `src/input`: player input state and control bindings
- `src/rendering`: canvas camera and world rendering
- `src/ui`: HUD, ship status panel, and label DOM helpers
- `src/scenes`: test map composition
- `src/styles`: app stylesheet
- `tests`: physics and integration tests
