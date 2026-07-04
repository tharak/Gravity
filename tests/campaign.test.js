import assert from "node:assert/strict";
import test from "node:test";
import { SpaceMapModelConfig } from "../src/config/spaceMapConfig.js";
import { deriveRegionSeed } from "../src/core/random.js";
import {
  createCampaignState,
  getSelectedBattleRegion,
  hasConqueredAllRegions,
  isRegionConquered,
  markRegionConquered,
  resetCampaign,
  selectBattleRegion
} from "../src/game/campaign.js";

test("campaign records the selected battle region", () => {
  const campaign = createCampaignState();
  const region = {
    regionIndex: 4,
    seed: deriveRegionSeed(SpaceMapModelConfig.seed, 4),
    spaceMapSeed: SpaceMapModelConfig.seed
  };

  assert.equal(getSelectedBattleRegion(campaign), undefined);
  const selected = selectBattleRegion(campaign, region);
  assert.deepEqual(getSelectedBattleRegion(campaign), region);
  assert.equal(Object.isFrozen(selected), true);
});

test("campaign tracks conquered regions toward total victory", () => {
  const campaign = createCampaignState();

  assert.equal(isRegionConquered(campaign, 0), false);
  markRegionConquered(campaign, 0);
  markRegionConquered(campaign, 0);
  assert.equal(isRegionConquered(campaign, 0), true);
  assert.equal(isRegionConquered(campaign, 1), false);
  assert.equal(campaign.conqueredRegionIndexes.size, 1);
  assert.equal(hasConqueredAllRegions(campaign, SpaceMapModelConfig.regionCount), false);

  for (let index = 0; index < SpaceMapModelConfig.regionCount; index += 1) {
    markRegionConquered(campaign, index);
  }
  assert.equal(hasConqueredAllRegions(campaign, SpaceMapModelConfig.regionCount), true);
});

test("resetCampaign clears the selection and conquests", () => {
  const campaign = createCampaignState();
  selectBattleRegion(campaign, { regionIndex: 2, seed: 99, spaceMapSeed: 1 });
  markRegionConquered(campaign, 2);

  resetCampaign(campaign);

  assert.equal(getSelectedBattleRegion(campaign), undefined);
  assert.equal(campaign.conqueredRegionIndexes.size, 0);
  assert.equal(hasConqueredAllRegions(campaign, SpaceMapModelConfig.regionCount), false);
});
