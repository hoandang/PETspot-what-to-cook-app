<template>
  <div class="dashboard">

    <div class="flash" v-show="showFlash">
      <h4>{{flashMessage}}</h4>
    </div>

    <div class="header">
      <h3>Hi {{userInfo.name}}</h3>
      <p> <a @click.prevent="viewSearch" href="#">Search</a> </p>
      <p> <a @click.prevent="viewCookBook" href="#">View your cookbook</a> </p>
      <h4><a @click.prevent="signOut" href="#">Signout</a></h4>
    </div>

    <div v-if="showSearch">
      <form class="search" @submit.prevent="search">
        <h1>What to cook today?</h1>
        <p> <label>Add your incredients</label> </p>
        <p>
          <textarea class="ingredients" v-model="ingredients" placeholder="Milk, Chicken, Vanilla, Pasta, Tofu,..." required></textarea>
        </p>
        <p><button type="submit">Search</button></p>
      </form>

      <ul class="recipes">
        <li v-for="recipe in recipes" :key="recipe.id">
          <img :src="recipe.image">
          <p class="toolbar">
            <a :href="'https://www.google.com/search?q=' + recipe.title" target="_blank">View</a>
            <a v-if="!recipe.isAdded" @click.prevent="addToCookBook(recipe.id)" href="#">Add to your cookbook</a>
          </p>
          <div style="clear:both"></div>
          <h3 v-html="recipe.title"></h3>
        </li>
      </ul>
    </div>

    <div v-else>
      <h1 style="text-align:center">Your cookbook</h1>
      <ul class="recipes">
        <li v-for="recipe in cookBookRecipes" :key="recipe.id">
          <img :src="recipe.image">
          <p class="toolbar">
            <a :href="'https://www.google.com/search?q=' + recipe.title" target="_blank">View</a>
            <a v-if="!recipe.isShared" @click.prevent="shareRecipe(recipe.id)" href="#">Share this</a>
            <a v-else @click.prevent="unShareRecipe(recipe.id)" href="#"></a>
          </p>
          <div style="clear:both"></div>
          <h3 v-html="recipe.title"></h3>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify';

export default {
  name: 'Dashboard',
  data() 
  {
    return {
      cognitoUser: null,
      showFlash: false,
      flashMessage: '',
      ingredients: '',
      userInfo: {},
      recipes: [],
      cookBookRecipes: [],
      showSearch: true
    }
  },
  async created() 
  {
    const attribute = (await Auth.currentUserInfo()).attributes;
    this.userInfo = { 
      name: attribute.name,
      recipes: this.getCustomAttributes(attribute['custom:recipes']),
      sharedRecipes: this.getCustomAttributes(attribute['custom:sharedRecipes']),
      followers: this.getCustomAttributes(attribute['custom:followers'])
    };

    this.cognitoUser = await Auth.currentAuthenticatedUser();
  },
  methods: {
    viewSearch()
    {
      this.showSearch = true;
    },

    getCustomAttributes(attribute)
    {
      return attribute ? attribute.split(',') : [];
    },

    async search()
    {
      const response = await this.invoke('getRecipies', this.ingredients);
      const json = JSON.parse(JSON.parse(response.Payload).body);
      this.recipes = json.result.map(item => {
        return {
          id: item.id,
          title: item.fields.title[0],
          image: item.fields.image[0],
          isAdded: this.userInfo.recipes.includes(item.id)
        };
      });
    },

    showFlashMessage(message)
    {
      this.showFlash = true;
      this.flashMessage = message;
      setTimeout(() => this.showFlash = false, 4000);
    },

    async signOut()
    {
      await Auth.signOut();
      location.reload(true);
    },

    async addToCookBook(recipeId)
    {
      this.showFlashMessage('The recipe has been added to your cookbook');
      this.userInfo.recipes.push(recipeId);
      this.recipes.forEach(recipe => {
        if (recipe.id == recipeId) recipe.isAdded = true;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:recipes': this.userInfo.recipes.join(',') });
    },

    async viewCookBook()
    {
      const response = await this.invoke('getCookBook', this.userInfo.recipes.join(','));
      const json = JSON.parse(JSON.parse(response.Payload).body);
      this.cookBookRecipes = json.map(item => {
        return {
          id: item.Id,
          title: item.Title,
          image: item.Image,
          isShared: this.userInfo.sharedRecipes.includes(item.Id)
        };
      });
      this.showSearch = false;
    },

    async shareRecipe(recipeId)
    {
      this.userInfo.sharedRecipes.push(recipeId);
      this.cookBookRecipes.forEach(recipe => {
        if (recipe.id == recipeId) recipe.isShared = true;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:sharedRecipes': this.userInfo.sharedRecipes.join(',') });
    },

    async unShareRecipe(recipeId)
    {
      this.userInfo.sharedRecipes = this.userInfo.sharedRecipes.filter(recipe => recipe.id != recipeId);
      this.cookBookRecipes.forEach(recipe => {
        if (recipe.id == recipeId) recipe.isShared = false;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:sharedRecipes': this.userInfo.sharedRecipes.join(',') });
    }
  }
}
</script>

<style scoped>
.dashboard {
  position: relative;
}

.flash {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: green;
  color: white;
  text-align: center;
}

.header h3,
.header h4 {
  margin: 0;
}
.header a {
  text-decoration: none;
}
.ingredients {
  width: 30%;
  height: 50px;
}
@media (max-width: 640px){
  .ingredients {
    width: 50%;
  }
}
.search {
  text-align: center;
}

.recipes {
  list-style-type: none;
  margin: 0 auto;
}
.recipes li img {
  width: 300px;
  height: 200px;
}
.recipes li {
  float: left;
  margin: 1rem;
  width: 300px;
  height: 300px;
}
.recipes h3 {
  margin: 0;
  line-height: 1.3em;
}

.recipes .toolbar {
  margin: 0 0 1rem 0;
  display: flex;
  justify-content: space-between;
}

.recipes .toolbar a {
  margin: 0;
  padding: 0;
  font-size: .9rem;
}
</style>