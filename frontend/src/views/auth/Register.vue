<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
    <div style="width:100%;max-width:400px;padding:16px">
      <div class="card" style="padding:32px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <img src="/logo.svg" width="36" height="36" alt="Linkora"/>
          <h1 style="font-size:24px;font-weight:800;color:var(--primary)">Join Linkora</h1>
        </div>
        <p style="color:var(--text-muted);margin-bottom:24px;font-size:14px">Join SocialNet today</p>
        <form @submit.prevent="submit">
          <div style="margin-bottom:12px"><input v-model="form.username" class="input" placeholder="Username" required minlength="3"/></div>
          <div style="margin-bottom:12px"><input v-model="form.email" class="input" type="email" placeholder="Email" required/></div>
          <div style="margin-bottom:16px"><input v-model="form.password" class="input" type="password" placeholder="Password (min 6 chars)" required minlength="6"/></div>
          <p v-if="error" style="color:var(--danger);font-size:13px;margin-bottom:12px">{{ error }}</p>
          <button class="btn btn-primary" style="width:100%;font-size:16px;padding:12px" :disabled="loading">
            {{ loading?'Creating...':'Sign Up' }}
          </button>
        </form>
        <p style="text-align:center;margin-top:16px;font-size:14px;color:var(--text-muted)">
          Already have an account? <RouterLink to="/login" style="color:var(--primary);font-weight:600">Log In</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = useRouter(); const auth = useAuthStore();
const form = ref({ username:'', email:'', password:'' });
const error = ref(''); const loading = ref(false);
async function submit() {
  error.value = ''; loading.value = true;
  try { await auth.register(form.value.username, form.value.email, form.value.password); router.push('/'); }
  catch (e) { error.value = e.response?.data?.message || 'Registration failed'; }
  finally { loading.value = false; }
}
</script>
