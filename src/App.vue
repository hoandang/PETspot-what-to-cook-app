<template>
  <div id="app" v-show="!isLoading">
    <Dashboard v-if="isLogin"/>
    <Login v-else/>
  </div>
</template>

<script>
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { Auth } from 'aws-amplify';

export default {
  name: 'App',
  components: { Login, Dashboard },
  data() 
  {
    return {
      isLogin: false,
      isLoading: true
    }
  },
  async created()
  {
    this.isLogin = (await Auth.currentCredentials()).authenticated;
    this.isLoading = false;
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
