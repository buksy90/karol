// The program as data: a list of blocks, each {id, type, n?, cond?, children?, ref?}.
// `cond` is a condition block (a sensor, or a Not holding its own `cond`);
// `children` is the body of a container; `ref` is the custom block a call points at.

let seq = 0;
export const newId = () => 'b' + (++seq);

export function createNode(def, ref) {
  const node = { id: newId(), type: def.type };
  if (def.number) node.n = def.number.default;
  if (def.hasCond) node.cond = null;
  if (def.hasBody) node.children = [];
  if (ref != null) node.ref = ref;
  return node;
}

// Deep copy with fresh ids.
export function cloneNode(node) {
  const copy = { ...node, id: newId() };
  if (node.cond) copy.cond = cloneNode(node.cond);
  if (node.children) copy.children = node.children.map(cloneNode);
  return copy;
}
export const cloneList = list => list.map(cloneNode);

// Deep copy that keeps ids: what a run executes, so later edits do not reach it.
export const snapshot = list => JSON.parse(JSON.stringify(list));

// Where a block sits: in a list ({kind:'list', owner, list, index}) or in the
// condition slot of another block ({kind:'cond', owner}). `rootKey` names the top list.
export function locate(root, id, rootKey) {
  const inCond = owner => {
    if (!owner.cond) return null;
    if (owner.cond.id === id) return { kind: 'cond', owner, node: owner.cond };
    return inCond(owner.cond);
  };
  const inList = (list, owner) => {
    for (let index = 0; index < list.length; index++) {
      const node = list[index];
      if (node.id === id) return { kind: 'list', owner, list, index, node };
      const found = inCond(node) || (node.children && inList(node.children, node.id));
      if (found) return found;
    }
    return null;
  };
  return inList(root, rootKey);
}

export function findNode(root, id) {
  const hit = locate(root, id);
  return hit ? hit.node : null;
}

// Ids of the container blocks around a block, innermost first.
export function ancestors(root, id) {
  const walk = (list, path) => {
    for (const node of list) {
      if (node.id === id) return path;
      if (node.children) { const found = walk(node.children, [node.id, ...path]); if (found) return found; }
    }
    return null;
  };
  return walk(root, []) || [];
}

// Remove every call to a custom block, in place, at any depth.
export function stripCalls(list, ref) {
  for (let i = list.length - 1; i >= 0; i--) {
    const node = list[i];
    if (node.type === 'call' && node.ref === ref) list.splice(i, 1);
    else if (node.children) stripCalls(node.children, ref);
  }
}

// A selection must be one unbroken run of blocks in a single list.
export function isContiguous(indexes) {
  if (indexes.length < 2) return true;
  const sorted = [...indexes].sort((a, b) => a - b);
  return sorted[sorted.length - 1] - sorted[0] + 1 === sorted.length;
}
