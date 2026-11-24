// @vitness/fds-encoder: the FDS structural descriptors FXI, FXE and FXM, as a library.
export {
  FXE_MAJOR, FXE_REV, FXI_MAJOR, FXI_REV, FXI_RULES, FXM_MAJOR, FXM_REV, GENERIC, UNKNOWN,
} from './alphabet.js';
export type { FxeKind, FxiLayer } from './alphabet.js';
export { canonicalFxe, canonicalFxi, parseFxe, parseFxi, standardFxe, standardFxi } from './syntax.js';
export type { FxeConfig, Issue, ParsedFxe, ParsedFxi } from './syntax.js';
export { compare, compareFxe, compareFxi } from './compare.js';
export type { CompareResult, LayerRelation, Relation } from './compare.js';
export { crossCheck, mainEquipment } from './crosscheck.js';
export { checkRow, OWNER_PROVENANCES, PROVENANCES, rowsOf, UNSPECIFIED_GAP } from './rows.js';
export type { Provenance, Row, RowCheck } from './rows.js';
export { autoMatchRefusal, checkMatchRow, match, nameSimilarity } from './match.js';
export type { Candidate, MatchOptions, MatchResult, MatchRow } from './match.js';
export {
  canonicalFxm, checkMuscleRow, createFxmVocabulary, expandFxm, formatFxm, gradeFxm, parseFxm, readFxmVocabulary,
} from './fxm.js';
export type { Anchor, FxmGroup, FxmKey, FxmMuscle, FxmPart, FxmVocabulary, MuscleRow, ParsedFxm } from './fxm.js';
export { NO_WORDS, patchedLayers, readWordSet, WordSetError } from './words.js';
export type { MovementWord, WordAsk, WordQuestion, WordSet } from './words.js';
export { createFlow, DEFAULT_FLOW, publishedQuestions } from './flow.js';
export type { Cond, Flow, FlowOption, FlowQuestion } from './flow.js';
export { AnswerError, build, builtFrom, buildWith, InternalError, rowMeta } from './build.js';
export type { Answer, Answers, Built, Entry, RowMeta, WordsCited } from './build.js';
export { checkCollisions, readLibrary } from './collide.js';
export type { Collision, Gap, LibraryEntry } from './collide.js';
export { askRows, startAsk, stepAsk } from './ask.js';
export type { AskMode, AskRow, AskState, AskStep } from './ask.js';
export { loadWordSet, readJson } from './load.js';
