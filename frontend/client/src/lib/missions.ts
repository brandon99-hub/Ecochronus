import recyclingIcon from "@assets/generated_images/recycling_mission_icon.png";
import treeIcon from "@assets/generated_images/tree_planting_mission_icon.png";
import cleanupIcon from "@assets/generated_images/cleanup_mission_icon.png";
import energyIcon from "@assets/generated_images/energy_saving_mission_icon.png";

const missionIcons: Record<string, string> = {
  recycling: recyclingIcon,
  tree: treeIcon,
  cleanup: cleanupIcon,
  energy: energyIcon,
  default: recyclingIcon,
};

export function getMissionIcon(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('recycle') || lowerTitle.includes('plastic')) return missionIcons.recycling;
  if (lowerTitle.includes('tree') || lowerTitle.includes('plant')) return missionIcons.tree;
  if (lowerTitle.includes('clean') || lowerTitle.includes('water')) return missionIcons.cleanup;
  if (lowerTitle.includes('energy') || lowerTitle.includes('power')) return missionIcons.energy;
  return missionIcons.default;
}

