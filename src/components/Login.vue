<template>
  <div class="login">
    <h1>Sign In</h1>
    <form @submit.prevent="signIn">
      <input placeholder="email" type="email" v-model="email" required>
      <input placeholder="password" type="password" v-model="password" required>
      <button type="submit">Sign In</button>
    </form>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify';

export default {
  name: 'Login',
  data() 
  {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    async signIn() 
    {
      try
      {
        await Auth.signIn(this.email, this.password);
        location.reload(true);
      }
      catch(error) 
      {
        console.log(error);
      }
    }
  }
}
</script>

<style scoped>
.login {
  text-align: center;
} 
</style>