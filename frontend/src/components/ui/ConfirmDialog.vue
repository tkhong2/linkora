<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center"
        @click.self="$emit('cancel')">
        <div class="card" style="width:100%;max-width:360px;padding:24px;text-align:center">
          <p style="font-size:20px;margin-bottom:8px">{{ icon }}</p>
          <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">{{ title }}</h3>
          <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">{{ message }}</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
            <button class="btn btn-danger" @click="$emit('confirm')">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  icon: { type: String, default: '⚠️' },
  confirmText: { type: String, default: 'Delete' }
});
defineEmits(['confirm', 'cancel']);
</script>
