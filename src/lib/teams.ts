/** Teams available during profile setup. */
export const SETUP_TEAMS = [
  { value: "business-development", label: "business development" },
] as const;

export type SetupTeamValue = (typeof SETUP_TEAMS)[number]["value"];

export function isSetupTeam(value: string): value is SetupTeamValue {
  return SETUP_TEAMS.some((t) => t.value === value);
}

export function teamLabel(value: string): string {
  return SETUP_TEAMS.find((t) => t.value === value)?.label ?? value;
}
