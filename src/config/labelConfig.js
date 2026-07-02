export const LabelConfig = Object.freeze({
  appTitle: "Gravity",
  levelSelectTitle: "Choose Test Map",
  maps: Object.freeze({
    LevelSelect: "LevelSelect",
    ShipMovement: "ShipMovement",
    GravityTest: "GravityTest"
  }),
  controllerModes: Object.freeze({
    manual: "Manual",
    manualShort: "MAN",
    automatic: "Auto"
  }),
  readouts: Object.freeze({
    hp: "HP",
    worldNorth: "World N",
    worldNorthCanvas: "WORLD N"
  }),
  hud: Object.freeze({
    map: "Map",
    time: "Time",
    entities: "Entities",
    status: "Status"
  }),
  status: Object.freeze({
    auto: "Auto",
    chooseLevel: "Choose level",
    coasting: "Coasting",
    running: "Running",
    thrusting: "Thrusting"
  }),
  controls: Object.freeze({
    automaticDirection: "Automatic direction",
    gravitySimulator: "Gravity simulator",
    controllerMode: "Controller mode",
    shipBattery: "Ship battery",
    shipController: "Ship controller",
    shipEcList: "Ship Components",
    shipHealth: "Ship health",
    simulatorData: "Simulator data",
    acceleration: "Acceleration",
    accelerationDown: "Decrease acceleration",
    accelerationOrder: "Acceleration order",
    accelerationUp: "Increase acceleration",
    gun: "Gun",
    gunControl: "Gun control",
    gunAim: "Aim",
    gunAimManual: "Manual aim",
    gunAimAutomatic: "Automatic aim",
    gunShoot: "Shoot",
    gunShootManual: "Manual shoot",
    gunShootAutomatic: "Automatic shoot",
    testMaps: "Test maps",
    levelSelect: "Level select",
    locked: "LOCKED",
    thrusterSwitches: "Thruster switches",
    worldNorthReference: "World north reference"
  }),
  ecs: Object.freeze({
    empty: "No ship ECs",
    gun: "Gun",
    shield: "Shield",
    solarPanel: "Solar panel",
    thruster: "Thruster"
  }),
  gunModes: Object.freeze({
    manual: "MAN",
    automatic: "AUTO"
  }),
  speedOrders: Object.freeze({
    Stop: Object.freeze({ label: "STOP", ariaLabel: "Stop and stabilize" }),
    OneThird: Object.freeze({ label: "1/3", ariaLabel: "One-third acceleration" }),
    TwoThirds: Object.freeze({ label: "2/3", ariaLabel: "Two-thirds acceleration" }),
    Standard: Object.freeze({ label: "STD", ariaLabel: "Standard acceleration" }),
    Full: Object.freeze({ label: "FULL", ariaLabel: "Full acceleration" }),
    Flank: Object.freeze({ label: "FLANK", ariaLabel: "Flank acceleration" })
  }),
  directions: Object.freeze({
    North: Object.freeze({ label: "N", ariaLabel: "North" }),
    NorthEast: Object.freeze({ label: "NE", ariaLabel: "North east" }),
    East: Object.freeze({ label: "E", ariaLabel: "East" }),
    SouthEast: Object.freeze({ label: "SE", ariaLabel: "South east" }),
    South: Object.freeze({ label: "S", ariaLabel: "South" }),
    SouthWest: Object.freeze({ label: "SW", ariaLabel: "South west" }),
    West: Object.freeze({ label: "W", ariaLabel: "West" }),
    NorthWest: Object.freeze({ label: "NW", ariaLabel: "North west" })
  })
});
