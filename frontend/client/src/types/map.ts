export interface RegionNode {
  id: string;
  name: string;
  corruptionLevel: number;
  missions: string[];
  status: "SAFE" | "UNSTABLE" | "CRITICAL";
  completedMissions: number;
  totalMissions: number;
}

