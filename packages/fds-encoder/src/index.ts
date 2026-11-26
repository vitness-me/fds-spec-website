// @vitness/fds-encoder: the structural keys of the Fitness Data Standard. Check, write, compare and build exercise
// (FXI), equipment (FXE), muscle (FXM) and muscle category (FXMG) keys, and match keyed records across catalogs.

export { checkKey, compareKeys, keyType, KeyError, writeKey } from './keys';
export type { CheckedKey, KeyComparison, KeyResult, KeyType } from './keys';

export { parseFxe, parseFxi, standardFxe, standardFxi } from './syntax';
export type { FxeConfig, Issue, ParsedFxe, ParsedFxi } from './syntax';
export type { LayerRelation } from './compare';

export { crossCheck, mainEquipment } from './crosscheck';
export type { MainEquipment } from './crosscheck';

export { expandFxm, formatFxm, FXM_PREFIX, FXM_VOCABULARY, fxmTerm, parseFxm } from './fxm';
export type { FxmKey, FxmVocabulary, ParsedFxm } from './fxm';
export {
  buildFxmgIndex, expandFxmg, expandMuscleKey, FXMG_PREFIX, FXMG_VOCABULARY, fxmgCategoriesOf, fxmgKeys, fxmgMembers, fxmgTerm, fxmInFxmg,
  parseFxmg,
} from './fxmg';
export type { FxmgKey, FxmgTerm, FxmInFxmg, ParsedFxmg } from './fxmg';

export { match, nameSimilarity } from './match';
export type { Candidate, MatchEntry, MatchOptions, MatchResult } from './match';

export { checkRecord, KEY_FIELDS, matchEntryOf, recordKeys } from './records';
export type { KeyField, RecordCheck, RecordIssue, RecordKey } from './records';

export { AnswerError, build, buildWith, InternalError, openOptions } from './builder/build';
export type { Answer, Answers, Built, Entry, Provider } from './builder/build';
export { FACTS, FLOW, QUESTION_BY_ID, QUESTIONS } from './builder/flow';
export type { Cond, FactId, FlowOption, FlowQuestion } from './builder/flow';
export { answersText, askRows, startAsk, stepAsk } from './builder/ask';
export type { AskRow, AskState, AskStep } from './builder/ask';

export { buildRegistries } from './registries';
export type { Registry } from './registries';

export * as codes from './alphabet';
export { FXM_MUSCLES } from './fxm-alphabet';
export type { Anchor, FxmMuscle, FxmPart } from './fxm-alphabet';
export { FXMG_ACTIONS, FXMG_SETS } from './fxmg-alphabet';
export type { FxmgAction, FxmgMember, FxmgSet } from './fxmg-alphabet';
export { ACTION_PRIME_MOVERS } from './movers';
