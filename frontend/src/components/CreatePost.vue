<template>
  <div class="card" style="margin-bottom:16px">
    <form @submit.prevent="submit">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <img :src="auth.user?.avatar || `https://ui-avatars.com/api/?name=${auth.user?.username}&background=6366f1&color=fff`"
          class="avatar" width="40" height="40" alt="avatar" />
        <textarea v-model="content" placeholder="What's on your mind?" rows="2"
          style="flex:1;resize:none;border-radius:20px;padding:10px 16px" />
      </div>

      <div v-if="preview" style="margin-top:10px;position:relative">
        <img :src="preview" style="width:100%;border-radius:10px;max-height:300px;object-fit:cover" alt="preview" />
        <button type="button" @click="clearImage"
          style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px">✕</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
        <label style="cursor:pointer;color:var(--text-muted);font-size:14px;display:flex;align-items:center;gap:6px">
          <input type="file" accept="image/*" style="display:none" @change="onFile" />
          📷 Photo
        </label>
        <button class="btn btn-primary btn-sm" :disabled="(!content.trim() && !imageFile) || loading">
          {{ loading ? 'Posting...' : 'Post' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import { useToastStore } from '@/stores/toast';

const emit = defineEmits(['posted']);
const auth = useAuthStore();
const toast = useToastStore();
const content = ref('');
const imageFile = ref(null);
const preview = ref('');
const loading = ref(false);

function onFile(e) {
  imageFile.value = e.target.files[0];
  preview.value = URL.createObjectURL(imageFile.value);
}

function clearImage() {
  imageFile.value = null;
  preview.value = '';
}

async function submit() {
  if (!content.value.trim() && !imageFile.value) return;
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('content', content.value);
    if (imageFile.value) fd.append('image', imageFile.value);
    const { data } = await api.post('/posts', fd);
    emit('posted', data);
    content.value = '';
    clearImage();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to create post');
  } finally {
    loading.value = false;
  }
}
</script>
