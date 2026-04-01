<template>
  <div class="card" style="margin-bottom:12px;padding:12px 16px">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
      <img :src="auth.user?.avatar||avatar(auth.user?.username)" class="avatar" width="40" height="40" alt="me"/>
      <button class="input input-rounded" style="flex:1;text-align:left;cursor:pointer;color:var(--text-muted)" @click="open=true">
        What's on your mind, {{ auth.user?.username }}?
      </button>
    </div>
    <hr class="divider"/>
    <div style="display:flex;gap:4px">
      <label class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;cursor:pointer;color:#45bd62">
        <fa :icon="['fas', 'image']" /> Photo/Video
        <input type="file" accept="image/*,video/*" multiple style="display:none" @change="onFiles"/>
      </label>
      <button class="btn btn-ghost btn-sm" style="flex:1;color:#f7b928" @click="open=true">
        <fa :icon="['fas', 'face-grin-squint']" /> Feeling
      </button>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="open" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center" @click.self="close">
        <div class="card" style="width:100%;max-width:520px;padding:0;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">
            <h3 style="font-size:18px;font-weight:700">{{ editPost ? 'Edit Post' : 'Create Post' }}</h3>
            <button class="btn btn-ghost btn-sm" @click="close" style="font-size:16px;padding:6px 10px">
              <fa :icon="['fas', 'xmark']" />
            </button>
          </div>

          <div style="padding:16px 20px;max-height:70vh;overflow-y:auto">
            <div style="display:flex;gap:10px;margin-bottom:12px;align-items:center">
              <img :src="auth.user?.avatar||avatar(auth.user?.username)" class="avatar" width="40" height="40" alt="me"/>
              <span style="font-weight:600">{{ auth.user?.username }}</span>
            </div>

            <textarea v-model="content" class="input" rows="4" :placeholder="`What's on your mind?`"
              style="resize:none;border:none;font-size:18px;padding:0;background:transparent;margin-bottom:12px" autofocus></textarea>

            <!-- Image previews -->
            <div v-if="previews.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;margin-bottom:12px">
              <div v-for="(p,i) in previews" :key="i" style="position:relative">
                <img :src="p" style="width:100%;height:100px;object-fit:cover;border-radius:8px" alt="preview"/>
                <button @click="removeFile(i)" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer">✕</button>
              </div>
            </div>

            <label class="btn btn-secondary btn-sm" style="cursor:pointer">
              📷 Add Photos/Videos
              <input type="file" accept="image/*,video/*" multiple style="display:none" @change="onFiles"/>
            </label>
          </div>

          <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn-secondary" @click="close">Cancel</button>
            <button class="btn btn-primary" :disabled="(!content.trim()&&!files.length)||loading" @click="submit">
              {{ loading ? 'Posting...' : editPost ? 'Save' : 'Post' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const props = defineProps({ editPost: { type: Object, default: null } });
const emit  = defineEmits(['posted', 'updated']);

const auth    = useAuthStore();
const toast   = useToastStore();
const open    = ref(false);
const content = ref('');
const files   = ref([]);
const previews = ref([]);
const loading = ref(false);

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;

watch(() => props.editPost, (p) => {
  if (p) { content.value = p.content; open.value = true; }
});

function onFiles(e) {
  const newFiles = Array.from(e.target.files);
  files.value.push(...newFiles);
  newFiles.forEach(f => previews.value.push(URL.createObjectURL(f)));
  open.value = true;
  e.target.value = '';
}

function removeFile(i) {
  files.value.splice(i, 1);
  previews.value.splice(i, 1);
}

function close() {
  if (!props.editPost) { content.value = ''; files.value = []; previews.value = []; }
  open.value = false;
}

async function submit() {
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('content', content.value);
    files.value.forEach(f => fd.append('images', f));

    if (props.editPost) {
      const { data } = await api.put(`/posts/${props.editPost._id}`, fd);
      emit('updated', data);
      toast.success('Post updated');
    } else {
      const { data } = await api.post('/posts', fd);
      emit('posted', data);
      toast.success('Post created!');
    }
    close();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed');
  } finally {
    loading.value = false;
  }
}
</script>
