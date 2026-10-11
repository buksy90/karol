// Custom blocks: {[id]: {name, body}} where body is a program list.

// Does this list call the target custom block, directly or through other custom blocks?
export function uses(list, target, customs, seen = new Set()) {
  for (const node of list) {
    if (node.type === 'call') {
      if (node.ref === target) return true;
      if (!seen.has(node.ref)) {
        seen.add(node.ref);
        if (customs[node.ref] && uses(customs[node.ref].body, target, customs, seen)) return true;
      }
    }
    if (node.children && uses(node.children, target, customs, seen)) return true;
  }
  return false;
}

// The custom blocks that may be offered in the library. While one is being edited,
// it and everything that contains it are hidden, so no block can end up inside itself.
export function offeredIds(customs, editingId) {
  return Object.keys(customs).filter(id =>
    editingId == null || (id !== editingId && !uses(customs[id].body, editingId, customs)));
}
