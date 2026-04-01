<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
    <div style="width:100%;max-width:400px;padding:16px">
      <div class="card" style="padding:32px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <img src="/logo.svg" width="40" height="40" alt="Linkora"/>
          <h1 style="font-size:28px;font-weight:800;color:var(--primary)">Linkora</h1>
        </div>
        <p style="color:var(--text-muted);margin-bottom:24px;font-size:14px">Connect with friends and the world</p>
        <form @submit.prevent="submit">
          <div style="margin-bottom:12px">
            <input v-model="form.email" class="input" type="email" placeholder="Email" required/>
          </div>
          <div style="margin-bottom:16px">
            <input v-model="form.password" class="input" type="password" placeholder="Password" required/>
          </div>
          <p v-if="error" style="color:var(--danger);font-size:13px;margin-bottom:12px">{{ error }}</p>
          <button class="btn btn-primary" style="width:100%;font-size:16px;padding:12px" :disabled="loading">
            {{ loading?'Signing in...':'Log In' }}
          </button>
        </form>
        <hr class="divider" style="margin:20px 0"/>
        <div style="text-align:center">
          <RouterLink to="/register" class="btn btn-secondary" style="font-size:14px">Create new account</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = useRouter(); const auth = useAuthStore();
const form = ref({ email: '', password: '' });
const error = ref(''); const loading = ref(false);
async function submit() {
  error.value = ''; loading.value = true;
  try { await auth.login(form.value.email, form.value.password); router.push('/'); }
  catch (e) { error.value = e.response?.data?.message || 'Login failed'; }
  finally { loading.value = false; }
}
</script>
