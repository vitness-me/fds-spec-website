// The header each structural key starts with, built from the version constants in alphabet.ts.
import { FXE_MAJOR, FXE_REV, FXI_MAJOR, FXI_REV, FXM_MAJOR, FXM_REV, FXMG_MAJOR, FXMG_REV } from './alphabet';

/** The exercise-key header without its S/N flag: `FXI=1.0`. */
export const FXI_HEADER = `FXI=${FXI_MAJOR}.${FXI_REV}`;
/** The equipment-key header without its S/N flag: `FXE=1.0`. */
export const FXE_HEADER = `FXE=${FXE_MAJOR}.${FXE_REV}`;
/** The muscle-key header: `FXM=1.0`. */
export const FXM_HEADER = `FXM=${FXM_MAJOR}.${FXM_REV}`;
/** The muscle-category-key header: `FXMG=1.0`. */
export const FXMG_HEADER = `FXMG=${FXMG_MAJOR}.${FXMG_REV}`;
/** The prefix every FXM 1.0 key starts with. */
export const FXM_PREFIX = `${FXM_HEADER}/`;
/** The prefix every FXMG 1.0 key starts with. */
export const FXMG_PREFIX = `${FXMG_HEADER}/`;
