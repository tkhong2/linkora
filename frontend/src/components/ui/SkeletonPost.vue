<template>
  <div class="card post-card" style="padding:16px;margin-bottom:12px" v-for="i in count" :key="i">
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <div class="skeleton" style="width:42px;height:42px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="skeleton" style="height:14px;width:120px;margin-bottom:6px"></div>
        <div class="skeleton" style="height:12px;width:80px"></div>
      </div>
    </div>
    <div class="skeleton" style="height:14px;margin-bottom:6px"></div>
    <div class="skeleton" style="height:14px;width:80%;margin-bottom:12px"></div>
    <div class="skeleton" style="height:200px;border-radius:8px"></div>
  </div>
</template>
<script setup>
defineProps({ count: { type: Number, default: 3 } });
</script>
