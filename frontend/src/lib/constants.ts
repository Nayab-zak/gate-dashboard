export const TERMINALS = ["T1", "T2", "T3"]; // TODO: replace with API
export const MOVETYPES = ["IN", "OUT"] as const;
export const DESIGS = ["EMPTY", "FULL", "EXP"] as const;

export type MoveType = typeof MOVETYPES[number];
export type Desig = typeof DESIGS[number];
