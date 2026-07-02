export const SpeedOrderConfig = Object.freeze({
  Stop: Object.freeze({ id: "stop", label: "STOP", speedLevel: 0, powerConsumptionWeight: 1 }),
  OneThird: Object.freeze({ id: "one-third", label: "1/3", speedLevel: 1 / 3, powerConsumptionWeight: 1 }),
  TwoThirds: Object.freeze({ id: "two-thirds", label: "2/3", speedLevel: 2 / 3, powerConsumptionWeight: 1 }),
  Standard: Object.freeze({ id: "standard", label: "STD", speedLevel: 0.82, powerConsumptionWeight: 1 }),
  Full: Object.freeze({ id: "full", label: "FULL", speedLevel: 1, powerConsumptionWeight: 1.25 }),
  Flank: Object.freeze({ id: "flank", label: "FLANK", speedLevel: 1.25, powerConsumptionWeight: 1.5 })
});

export const SpeedOrderList = Object.freeze(Object.values(SpeedOrderConfig));
