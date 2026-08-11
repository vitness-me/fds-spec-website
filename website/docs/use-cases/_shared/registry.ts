/**
 * The two closed vocabularies the use-case layer is built from.
 *
 * Both are read twice: once here, to render persona chips and family headings,
 * and once by `scripts/check-usecases.mjs`, which parses this file so a page
 * cannot name an audience or a family that does not exist. Keeping the lists in
 * one module is what makes that possible — a persona defined in the chip
 * renderer but not the gate, or the reverse, is exactly the drift the gate is
 * meant to prevent.
 *
 * The keys are the identifiers pages put in `usecase_audiences` and
 * `usecase_family` frontmatter. The values are the human labels. Add a persona
 * or a family by adding a line here; nothing else needs editing.
 */

/** Who a use case is for. Situations, not job titles. */
export const PERSONAS: Record<string, string> = {
  'app-developer': 'App developers',
  'platform-lead': 'Platform & product leads',
  'oem-engineer': 'Equipment & wearable engineers',
  'coach': 'Coaches & program authors',
  'researcher': 'Sports scientists & researchers',
  'athlete': 'People who own their training',
};

/**
 * Capability families, ordered foundational first.
 *
 * The order here is the order a reader should meet them: the shared library is
 * the vocabulary everything else is written in; prescription is the intent
 * primitives; composition is what the first two build up to.
 */
export const FAMILIES: Record<string, string> = {
  foundations: 'Foundations — the shared library',
  prescription: 'Prescription — the intent primitives',
  composition: 'Composition — sessions and plans',
};
