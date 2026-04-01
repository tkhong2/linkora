<template>
  <Teleport to="body">
    <div style="position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px">
      <Transition name="toast" v-for="t in store.toasts" :key="t.id">
        <div :style="{
          background: t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--danger)' : '#334155',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '220px',
          cursor: 'pointer'
        }" @click="store.remove(t.id)">
          <span>{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ t.message }}
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast';
const store = useToastStore();
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
</style>
