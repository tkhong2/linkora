<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="src" style="position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:1000;display:flex;align-items:center;justify-content:center"
        @click.self="$emit('close')">
        <button @click="$emit('close')"
          style="position:absolute;top:16px;right:20px;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:24px;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
        <img :src="src" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px" alt="image"/>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
defineProps({ src: String });
defineEmits(['close']);
</script>
