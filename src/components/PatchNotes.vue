<script setup>
const typeConfig = {
    buff: { label: 'Buff', color: '#42B772' },
    nerf: { label: 'Nerf', color: '#EF4444' },
    update: { label: 'Update', color: '#E09F3E' },
    deleted: { label: 'Deleted', color: '#540B0E' },
    new: { label: 'New', color: '#3B82F6' }
}

const getTypeConfig = (type) => {
    const normalizedType = String(type || '').toLowerCase()
    return typeConfig[normalizedType] || { label: 'Update', color: '#E09F3E' }
}

defineProps({
    patchNotes: {
        type: Array,
        default: () => []
    }
})
</script>

<template>
    <h4 class="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        <span class="material-symbols-outlined text-sm">history_edu</span>
        Patch Notes Highlights
    </h4>

    <div
        v-if="patchNotes?.length"
        :class="[
            'grid gap-4 custom-scrollbar',
            patchNotes.length > 2 ? 'grid-cols-1 sm:grid-cols-2 max-h-[15rem] overflow-y-auto pr-1' : 'grid-cols-1 sm:grid-cols-2'
        ]"
    >
        <div
            v-for="(note, index) in patchNotes"
            :key="`${note.title || 'note'}-${index}`"
            class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors"
        >
            <div class="flex items-center gap-2 mb-2">
                <span
                    class="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm"
                    :style="{ backgroundColor: getTypeConfig(note.type).color }"
                >
                    {{ getTypeConfig(note.type).label }}
                </span>
                <h5 class="text-white font-bold text-sm uppercase italic">
                    {{ note.title || 'Patch Note' }}
                </h5>
            </div>
            <p class="text-slate-400 text-xs leading-relaxed">
                {{ note.description || 'No description available.' }}
            </p>
        </div>
    </div>
</template>