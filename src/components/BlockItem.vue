<script setup lang="ts">
import { computed } from 'vue';
import type { ProgramNode } from '../logic/types.ts';
import { defs } from '../blocks/index.ts';
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import { useExecutionStore } from '../stores/execution.ts';
import { useCustomBlocksStore } from '../stores/customBlocks.ts';
import BlockList from './BlockList.vue';
import ConditionSlot from './ConditionSlot.vue';

// Renders any block from its definition. `library` blocks are the templates in the
// library (no body shown); `ghost` is the floating copy that follows the pointer.
const props = defineProps<{
  node: ProgramNode;
  library?: boolean;
  ghost?: boolean;
}>();

const t = useT();
const ui = useUiStore(), exec = useExecutionStore(), custom = useCustomBlocksStore();

const def = computed(() => defs[props.node.type]);
const count = computed(() => exec.counts[props.node.id]);
const callName = computed(() => { const c = custom.blocks[props.node.ref!]; return c ? c.name : '?'; });

function glowEnded() {
  if (ui.landed === props.node.id) ui.landed = null;
}
</script>

<template>
  <div
    class="block"
    :class="[def.classes, {
      ghost,
      sel: ui.selected.includes(node.id),
      ok: exec.ok[node.id],
      err: exec.err[node.id],
      active: exec.current === node.id,
      landed: ui.landed === node.id,
    }]"
    :data-id="node.id"
    :data-type="node.type"
    :data-ref="node.ref"
    @animationend.self="glowEnded"
  >
    <template v-if="def.kind === 'call'">⚙ {{ callName }}</template>
    <template v-else-if="def.hasBody">
      <div class="hd">{{ def.icon }}<span>{{ t(def.labelKey) }}</span>{{ ' ' }}<template v-if="def.number"><input v-model="node.n" type="number" :min="def.number.min" :max="def.number.max">{{ ' ' }}</template><template v-if="def.suffixKey"><span>{{ t(def.suffixKey) }}</span>{{ ' ' }}</template><ConditionSlot v-if="def.hasCond" :owner="node" :library="library" /><span v-if="def.hasCounter" :key="count ? count.key : 0" class="cnt" :class="{ pop: !!count }" :style="count ? { animationDuration: count.duration } : null">{{ count ? count.text : '' }}</span></div>
      <BlockList v-if="!library" :list="node.children!" :owner="node.id" />
    </template>
    <template v-else>{{ def.icon }}<span>{{ t(def.labelKey) }}</span><template v-if="def.number">{{ ' ' }}<input v-model="node.n" type="number" :min="def.number.min" :max="def.number.max"></template><template v-if="def.hasCond">{{ ' ( ' }}<ConditionSlot :owner="node" :library="library" />{{ ' )' }}</template></template>
  </div>
</template>
