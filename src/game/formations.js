import { FleetFormation } from "../config/fleetConfig.js";

export function getFormationOffset(formation, slotIndex, spacing) {
  const rank = Math.ceil((slotIndex + 1) / 2);
  const side = slotIndex % 2 === 0 ? 1 : -1;

  switch (formation) {
    case FleetFormation.Line:
      return { x: 0, y: side * rank * spacing };
    case FleetFormation.Arrow:
      return { x: -rank * spacing, y: side * rank * spacing };
    case FleetFormation.Chevron:
      return { x: rank * spacing, y: side * rank * spacing };
    default:
      return { x: -(slotIndex + 1) * spacing, y: 0 };
  }
}
