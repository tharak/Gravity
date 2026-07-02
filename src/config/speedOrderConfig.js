import { LabelConfig } from "./labelConfig.js";

export const SpeedOrderConfig = Object.freeze({
  Stop: Object.freeze({ id: "stop", label: LabelConfig.speedOrders.Stop.label, ariaLabel: LabelConfig.speedOrders.Stop.ariaLabel, speedLevel: 0, powerConsumptionWeight: 1 }),
  OneThird: Object.freeze({ id: "one-third", label: LabelConfig.speedOrders.OneThird.label, ariaLabel: LabelConfig.speedOrders.OneThird.ariaLabel, speedLevel: 1 / 3, powerConsumptionWeight: 1 }),
  TwoThirds: Object.freeze({ id: "two-thirds", label: LabelConfig.speedOrders.TwoThirds.label, ariaLabel: LabelConfig.speedOrders.TwoThirds.ariaLabel, speedLevel: 2 / 3, powerConsumptionWeight: 1 }),
  Standard: Object.freeze({ id: "standard", label: LabelConfig.speedOrders.Standard.label, ariaLabel: LabelConfig.speedOrders.Standard.ariaLabel, speedLevel: 0.82, powerConsumptionWeight: 1 }),
  Full: Object.freeze({ id: "full", label: LabelConfig.speedOrders.Full.label, ariaLabel: LabelConfig.speedOrders.Full.ariaLabel, speedLevel: 1, powerConsumptionWeight: 1.25 }),
  Flank: Object.freeze({ id: "flank", label: LabelConfig.speedOrders.Flank.label, ariaLabel: LabelConfig.speedOrders.Flank.ariaLabel, speedLevel: 1.25, powerConsumptionWeight: 1.5 })
});

export const SpeedOrderList = Object.freeze(Object.values(SpeedOrderConfig));
