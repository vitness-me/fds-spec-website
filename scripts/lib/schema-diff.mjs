/**
 * Structural comparison of two JSON documents, and of two JSON Schemas.
 *
 * Used by `scripts/schema-review.mjs` to turn a schema change into something a
 * reviewer can read: which properties were added, removed or changed (by where
 * they sit in the schema, not by line), which definitions moved, and a line
 * diff for the side-by-side view. Everything here is pure, so the self-test
 * can exercise it without a repository.
 */

/** The structural key fields a review highlights wherever they occur. */
export const KEY_FIELDS = ['fxi', 'fxe', 'fxm', 'fxmg'];

export const isPlainObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isPrimitive = (x) => x === null || typeof x !== 'object';

export function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (isPlainObject(a)) {
    if (!isPlainObject(b)) return false;
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

/** `a.b[0]["odd key"]`, or `(root)` for the empty path. */
export function formatPath(path) {
  if (!path.length) return '(root)';
  let out = '';
  for (const seg of path) {
    if (typeof seg === 'number') out += `[${seg}]`;
    else if (/^[A-Za-z_$][\w$-]*$/.test(seg)) out += out ? `.${seg}` : seg;
    else out += `[${JSON.stringify(seg)}]`;
  }
  return out;
}

/**
 * Index pairs aligning two arrays: equal elements are matched by longest common
 * subsequence, and the unmatched elements between two matches are paired by
 * position, so an insertion at the front reads as one addition rather than as
 * every element changing.
 */
function alignArrays(a, b) {
  const ka = a.map((x) => JSON.stringify(x));
  const kb = b.map((x) => JSON.stringify(x));
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = ka[i] === kb[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const pairs = [];
  let pendingA = [];
  let pendingB = [];
  const flush = () => {
    const common = Math.min(pendingA.length, pendingB.length);
    for (let k = 0; k < common; k++) pairs.push([pendingA[k], pendingB[k]]);
    for (const i of pendingA.slice(common)) pairs.push([i, null]);
    for (const j of pendingB.slice(common)) pairs.push([null, j]);
    pendingA = [];
    pendingB = [];
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j]) {
      flush();
      pairs.push([i++, j++]);
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) pendingA.push(i++);
    else pendingB.push(j++);
  }
  while (i < n) pendingA.push(i++);
  while (j < m) pendingB.push(j++);
  flush();
  return pairs;
}

/**
 * Every difference between two JSON values, by path.
 *
 * Each op is `{ op: 'add' | 'remove' | 'change', path, old?, new? }`. Arrays of
 * primitives (`required`, `enum`) compare as sets, with `item: true` on the op,
 * because a reviewer asks "is `fxi` now required", not "what is at index 3".
 * Their pure reordering is a `change` with `note: 'order'`. Arrays of objects
 * are aligned (see `alignArrays`); a removed element's path carries its old
 * index, an added one its new index.
 */
export function jsonDiff(a, b, base = []) {
  const ops = [];
  const walk = (x, y, path) => {
    if (deepEqual(x, y)) return;
    if (isPlainObject(x) && isPlainObject(y)) {
      for (const k of Object.keys(x)) if (!(k in y)) ops.push({ op: 'remove', path: [...path, k], old: x[k] });
      for (const k of Object.keys(y)) {
        if (!(k in x)) ops.push({ op: 'add', path: [...path, k], new: y[k] });
        else walk(x[k], y[k], [...path, k]);
      }
      return;
    }
    if (Array.isArray(x) && Array.isArray(y)) {
      if ([...x, ...y].every(isPrimitive)) {
        const kx = new Set(x.map((v) => JSON.stringify(v)));
        const ky = new Set(y.map((v) => JSON.stringify(v)));
        const removed = x.filter((v) => !ky.has(JSON.stringify(v)));
        const added = y.filter((v) => !kx.has(JSON.stringify(v)));
        for (const v of removed) ops.push({ op: 'remove', path, old: v, item: true });
        for (const v of added) ops.push({ op: 'add', path, new: v, item: true });
        if (!removed.length && !added.length) ops.push({ op: 'change', path, old: x, new: y, note: 'order' });
        return;
      }
      for (const [i, j] of alignArrays(x, y)) {
        if (i !== null && j !== null) walk(x[i], y[j], [...path, j]);
        else if (i !== null) ops.push({ op: 'remove', path: [...path, i], old: x[i] });
        else ops.push({ op: 'add', path: [...path, j], new: y[j] });
      }
      return;
    }
    ops.push({ op: 'change', path, old: x, new: y });
  };
  walk(a, b, base);
  return ops;
}

// ── JSON Schema structure ─────────────────────────────────────────────────────

/** Keywords whose value is a map of name → subschema. */
const MAP_KEYWORDS = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'];
/** Keywords whose value is one subschema. */
const ONE_KEYWORDS = [
  'items', 'additionalProperties', 'not', 'if', 'then', 'else', 'contains', 'propertyNames',
  'unevaluatedProperties', 'unevaluatedItems', 'additionalItems',
];
/** Keywords whose value is a list of subschemas. */
const LIST_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];

/** Calls `fn(node, path)` for every subschema, following schema keywords only. */
function visitSchemas(node, fn, path = []) {
  if (!isPlainObject(node)) return;
  fn(node, path);
  for (const kw of MAP_KEYWORDS) {
    if (isPlainObject(node[kw])) {
      for (const [name, sub] of Object.entries(node[kw])) visitSchemas(sub, fn, [...path, kw, name]);
    }
  }
  for (const kw of ONE_KEYWORDS) {
    if (Array.isArray(node[kw])) node[kw].forEach((s, i) => visitSchemas(s, fn, [...path, kw, i]));
    else visitSchemas(node[kw], fn, [...path, kw]);
  }
  for (const kw of LIST_KEYWORDS) {
    if (Array.isArray(node[kw])) node[kw].forEach((s, i) => visitSchemas(s, fn, [...path, kw, i]));
  }
}

/**
 * Every declared property in a schema, keyed by its JSON pointer:
 * `{ path, name, schema, required }`, where `required` reads the parent's
 * `required` list.
 */
export function collectProperties(schema) {
  const out = new Map();
  visitSchemas(schema, (node, path) => {
    if (!isPlainObject(node.properties)) return;
    const required = Array.isArray(node.required) ? node.required : [];
    for (const [name, sub] of Object.entries(node.properties)) {
      const p = [...path, 'properties', name];
      out.set(pointer(p), { path: p, name, schema: sub, required: required.includes(name) });
    }
  });
  return out;
}

const pointer = (path) => '/' + path.map((s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');

/**
 * A schema path as a reader names the property: `canonical.fxi`,
 * `$defs/exerciseRef.fxi`, `muscles[].fxm`, `oneOf[1].weight`.
 */
export function propertyLabel(path) {
  let out = '';
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    const next = path[i + 1];
    if (seg === 'properties') {
      out += out ? `.${next}` : String(next);
      i++;
    } else if ((seg === '$defs' || seg === 'definitions' || seg === 'patternProperties') && next !== undefined) {
      out += `${out ? '.' : ''}${seg}/${next}`;
      i++;
    } else if (seg === 'items' || seg === 'additionalItems' || seg === 'contains') {
      out += '[]';
    } else if (LIST_KEYWORDS.includes(seg) && typeof next === 'number') {
      out += `${out ? '.' : ''}${seg}[${next}]`;
      i++;
    } else if (seg === 'additionalProperties') {
      out += '{*}';
    } else {
      out += `${out ? '.' : ''}${seg}`;
    }
  }
  return out || '(root)';
}

/**
 * A subschema without the property definitions nested inside it.
 *
 * Comparing these decides whether a property *itself* changed. Without the
 * stripping, adding `canonical.fxi` would also report `canonical` as changed,
 * and every ancestor up to the root with it; with it, `canonical` changes only
 * when its own constraints do — a type, a pattern, its `required` list.
 */
export function withoutNestedProperties(node) {
  if (!isPlainObject(node)) return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'properties') continue;
    if (MAP_KEYWORDS.includes(k) && isPlainObject(v)) {
      out[k] = Object.fromEntries(Object.entries(v).map(([n, s]) => [n, withoutNestedProperties(s)]));
    } else if ((ONE_KEYWORDS.includes(k) || LIST_KEYWORDS.includes(k)) && Array.isArray(v)) {
      out[k] = v.map(withoutNestedProperties);
    } else if (ONE_KEYWORDS.includes(k)) {
      out[k] = withoutNestedProperties(v);
    } else out[k] = v;
  }
  return out;
}

/** The subschema a local `#/…` reference points at, or undefined. */
export function resolveLocal(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;
  let node = root;
  for (const raw of ref.slice(2).split('/')) {
    const seg = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === null || typeof node !== 'object' || !(seg in node)) return undefined;
    node = node[seg];
  }
  return node;
}

/**
 * The facts a reviewer wants about one property definition. A local `$ref` is
 * followed (one hop at a time, cycles stopped), and what the property states
 * itself wins over what it inherits.
 */
export function describeProperty(entry, root) {
  let s = isPlainObject(entry.schema) ? entry.schema : {};
  const seen = new Set();
  while (root && typeof s.$ref === 'string' && !seen.has(s.$ref)) {
    seen.add(s.$ref);
    const target = resolveLocal(root, s.$ref);
    if (!isPlainObject(target)) break;
    const { $ref, ...own } = s;
    s = { ...target, ...own, $ref: target.$ref };
  }
  const via = [...seen][0];
  const itemType = isPlainObject(s.items) ? s.items.type ?? (s.items.$ref ? `ref ${s.items.$ref}` : undefined) : undefined;
  return {
    label: propertyLabel(entry.path),
    required: entry.required,
    type: s.type ?? (s.oneOf ? 'oneOf' : s.anyOf ? 'anyOf' : undefined),
    itemType,
    ref: via ?? s.$ref,
    pattern: s.pattern ?? (isPlainObject(s.items) ? s.items.pattern : undefined),
    format: s.format,
    enum: s.enum,
    const: s.const,
    description: s.description,
  };
}

/**
 * What changed between two versions of a schema, grouped the way a review reads it.
 *
 * - `added` / `removed`: property definitions present on one side only.
 * - `changed`: properties on both sides whose own constraints differ (see
 *   `withoutNestedProperties`), with the ops that differ.
 * - `definitions`: each `$defs` entry added, removed or changed, and for a
 *   changed one the properties it gained, lost or changed.
 * - `other`: changes outside every property and definition — `$id`, title,
 *   the root's `required`.
 * - `counts`: property additions, removals and changes, across the whole schema.
 */
export function summarizeSchemaChange(oldSchema, newSchema) {
  const before = collectProperties(oldSchema ?? {});
  const after = collectProperties(newSchema ?? {});

  const added = [...after].filter(([k]) => !before.has(k)).map(([, e]) => describeProperty(e, newSchema));
  const removed = [...before].filter(([k]) => !after.has(k)).map(([, e]) => describeProperty(e, oldSchema));
  const changed = [];
  for (const [k, e] of after) {
    const old = before.get(k);
    if (!old) continue;
    const ops = jsonDiff(withoutNestedProperties(old.schema), withoutNestedProperties(e.schema));
    if (ops.length || old.required !== e.required) {
      changed.push({ label: propertyLabel(e.path), ops, requiredBefore: old.required, requiredAfter: e.required });
    }
  }

  const defsOf = (s) => (isPlainObject(s?.$defs) ? s.$defs : {});
  const oldDefs = defsOf(oldSchema);
  const newDefs = defsOf(newSchema);
  const definitions = [];
  const underDef = (list, name) => list.filter((p) => p.label.startsWith(`$defs/${name}.`) || p.label.startsWith(`$defs/${name}[`));
  for (const name of new Set([...Object.keys(oldDefs), ...Object.keys(newDefs)])) {
    const inOld = name in oldDefs;
    const inNew = name in newDefs;
    if (inOld && inNew && deepEqual(oldDefs[name], newDefs[name])) continue;
    const status = !inOld ? 'added' : !inNew ? 'removed' : 'changed';
    definitions.push({
      name,
      status,
      shape:
        status === 'changed'
          ? undefined
          : describeProperty({ path: ['$defs', name], schema: inNew ? newDefs[name] : oldDefs[name], required: false }, inNew ? newSchema : oldSchema),
      added: underDef(added, name),
      removed: underDef(removed, name),
      changed: underDef(changed, name),
      ops: inOld && inNew ? jsonDiff(withoutNestedProperties(oldDefs[name]), withoutNestedProperties(newDefs[name])) : [],
    });
  }

  const rootOnly = (s) => {
    const { $defs, definitions: _d, ...rest } = isPlainObject(s) ? s : {};
    return withoutNestedProperties(rest);
  };
  const other = jsonDiff(rootOnly(oldSchema), rootOnly(newSchema));

  return {
    added,
    removed,
    changed,
    definitions,
    other,
    counts: { added: added.length, removed: removed.length, changed: changed.length },
  };
}

// ── Line diff ────────────────────────────────────────────────────────────────

/**
 * A line diff of two texts: `[{ type: 'eq' | 'del' | 'add', a?, b? }]`, where `a`
 * and `b` are zero-based line indexes. Myers' algorithm on the part between the
 * common prefix and suffix, so a few changes in a long schema stay cheap.
 */
export function diffLines(aText, bText) {
  const a = aText.split('\n');
  const b = bText.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const out = [];
  for (let i = 0; i < start; i++) out.push({ type: 'eq', a: i, b: i });
  for (const op of myers(a.slice(start, endA), b.slice(start, endB))) {
    out.push({ type: op.type, a: op.a === undefined ? undefined : op.a + start, b: op.b === undefined ? undefined : op.b + start });
  }
  for (let i = 0; i < a.length - endA; i++) out.push({ type: 'eq', a: endA + i, b: endB + i });
  return out;
}

const MAX_EDITS = 3000;

function myers(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  if (max === 0) return [];
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = -1;
  for (let d = 0; d <= max && found < 0; d++) {
    // The trace grows by one vector per edit; past this many edits the texts
    // share too little for alignment to help, so show them as replaced.
    if (d > MAX_EDITS) {
      return [...a.map((_, i) => ({ type: 'del', a: i })), ...b.map((_, j) => ({ type: 'add', b: j }))];
    }
    // Only diagonals -d-1..d+1 can be read back for this step.
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
  }
  const ops = [];
  let x = n;
  let y = m;
  for (let d = found; d >= 0; d--) {
    const at = (kk) => trace[d][kk + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : at(prevK);
    const prevY = d === 0 ? 0 : prevX - prevK;
    while (x > prevX && y > prevY) ops.push({ type: 'eq', a: --x, b: --y });
    if (d > 0) {
      if (x === prevX) ops.push({ type: 'add', b: --y });
      else ops.push({ type: 'del', a: --x });
    }
  }
  return ops.reverse();
}

/** Each occurrence of a key field in a document: `{ path, key, value }`. */
export function keyFieldOccurrences(doc, keys = KEY_FIELDS) {
  const out = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) node.forEach((x, i) => walk(x, [...path, i]));
    else if (isPlainObject(node)) {
      for (const [k, v] of Object.entries(node)) {
        if (keys.includes(k)) out.push({ path: [...path, k], key: k, value: v });
        walk(v, [...path, k]);
      }
    }
  };
  walk(doc, []);
  return out;
}
