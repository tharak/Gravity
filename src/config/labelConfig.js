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
    fuel: "FUEL",
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
    entityColors: "Entity colors",
    gravitySimulator: "Gravity simulator",
    controllerMode: "Controller mode",
    shipBattery: "Ship battery",
    shipController: "Ship controller",
    shipFuel: "Ship fuel",
    shipHealth: "Ship health",
    simulatorData: "Simulator data",
    speed: "Speed",
    speedOrder: "Speed order",
    testMaps: "Test maps",
    levelSelect: "Level select",
    locked: "LOCKED",
    thrusterSwitches: "Thruster switches",
    worldNorthReference: "World north reference"
  }),
  speedOrders: Object.freeze({
    Stop: Object.freeze({ label: "STOP", ariaLabel: "Stop and stabilize" }),
    OneThird: Object.freeze({ label: "1/3", ariaLabel: "One-third speed" }),
    TwoThirds: Object.freeze({ label: "2/3", ariaLabel: "Two-thirds speed" }),
    Standard: Object.freeze({ label: "STD", ariaLabel: "Standard speed" }),
    Full: Object.freeze({ label: "FULL", ariaLabel: "Full speed" }),
    Flank: Object.freeze({ label: "FLANK", ariaLabel: "Flank speed" })
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
  }),
  legend: Object.freeze({
    ship: "Ship",
    main: "Main",
    reverse: "Reverse",
    sideUp: "Up side",
    sideDown: "Down side"
  })
});
