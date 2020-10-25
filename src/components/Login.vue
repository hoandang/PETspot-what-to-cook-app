<template>
  <div>
    <div v-show="showLogin" class="login" v-cloak>
      <h1>Sign In</h1>
      <form @submit.prevent="signIn">
        <input placeholder="email" type="email" v-model="email" required>
        <input placeholder="password" type="password" v-model="password" required>
        <button type="submit">Sign In</button>
      </form>
      <a @click.prevent="showLogin = false" href="#">Signup</a>
    </div>
    <div v-show="!showLogin" class="login" v-cloak>
      <h1>Sign Up</h1>
      <form @submit.prevent="signUp">
        <input placeholder="email" type="email" v-model="email" required>
        <input placeholder="password" type="password" v-model="password" required>
        <button type="submit">Sign Up</button>
      </form>
      <a @click.prevent="showLogin = true" href="#">Signin</a>
    </div>

    <h4 v-cloak v-show="errorMessage.length > 0" class="error">{{errorMessage}}</h4>
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
      password: '',
      showLogin: true,
      errorMessage: ''
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
        this.errorMessage = error.message;
      }
    },
    async signUp()
    {
      try {
        await Auth.signUp({ 
          username: this.email,
          password: this.password
        });
        alert('Successfully signup, please login');
      } 
      catch (error) 
      {
        this.errorMessage = error.message;
      }
    }
  }
}
</script>

<style scoped>
.login {
  text-align: center;
} 
.error {
  color:red;
  text-align: center;
}
</style>