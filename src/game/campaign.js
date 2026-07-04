export function createCampaignState() {
  return { selectedRegion: undefined, conqueredRegionIndexes: new Set() };
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

export function markRegionConquered(campaign, regionIndex) {
  campaign.conqueredRegionIndexes.add(regionIndex);
}

export function isRegionConquered(campaign, regionIndex) {
  return campaign.conqueredRegionIndexes.has(regionIndex);
}

export function hasConqueredAllRegions(campaign, regionCount) {
  return campaign.conqueredRegionIndexes.size >= regionCount;
}

export function resetCampaign(campaign) {
  campaign.selectedRegion = undefined;
  campaign.conqueredRegionIndexes.clear();
}
