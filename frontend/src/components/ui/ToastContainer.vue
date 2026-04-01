<template>
  <Teleport to="body">
    <div style="position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none">
      <Transition name="fade" v-for="t in store.toasts" :key="t.id">
        <div :style="{
          background: t.type==='success'?'#42b72a':t.type==='error'?'#e41e3f':'#1877f2',
          color:'#fff', padding:'12px 18px', borderRadius:'10px', fontSize:'14px',
          fontWeight:'500', boxShadow:'0 4px 16px rgba(0,0,0,.2)',
          display:'flex', alignItems:'center', gap:'8px', minWidth:'240px', pointerEvents:'all'
        }">
          <span style="font-size:16px">{{ t.type==='success'?'✓':t.type==='error'?'✕':'ℹ' }}</span>
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
