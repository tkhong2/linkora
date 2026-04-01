<template>
  <div class="reaction-picker">
    <span v-for="r in reactions" :key="r.type" class="reaction-btn"
      :title="r.label" @click="$emit('pick', r.type)">{{ r.emoji }}</span>
  </div>
</template>
<script setup>
defineEmits(['pick']);
const reactions = [
  { type: 'like',  emoji: '👍', label: 'Like' },
  { type: 'love',  emoji: '❤️', label: 'Love' },
  { type: 'haha',  emoji: '😂', label: 'Haha' },
  { type: 'wow',   emoji: '😮', label: 'Wow' },
  { type: 'sad',   emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
];
</script>
