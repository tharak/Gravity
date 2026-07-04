export function createCampaignState() {
  return { selectedRegion: undefined };
}

export function selectBattleRegion(campaign, region) {
  campaign.selectedRegion = Object.freeze({
    regionIndex: region.regionIndex,
    seed: region.seed,
    spaceMapSeed: region.spaceMapSeed
  });
  return campaign.selectedRegion;
}

export function getSelectedBattleRegion(campaign) {
  return campaign.selectedRegion;
}
