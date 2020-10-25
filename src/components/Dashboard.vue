<template>
  <div class="dashboard">

    <div class="flash" v-show="showFlash">
      <h4>{{flashMessage}}</h4>
    </div>

    <div class="loading" v-show="showLoading">
      <h2>Loading....</h2>
    </div>

    <ul class="header">
      <li> <h3>Hi {{userInfo.name}}</h3> </li>
      <li> <a @click="viewSearch" href="#">Search</a> </li>
      <li> <a @click="viewFeed" href="#feed">Public Feed</a> </li>
      <li> <a @click="viewFollowees" href="#followees">Find Followees</a> </li>
      <li> <a @click="viewCookBook" href="#cookbook">Your CookBook</a> </li>
      <li> <h4><a @click.prevent="signOut" href="#">Signout</a></h4> </li>
    </ul>

    <div style="clear:both"></div>

    <div v-if="showCookBook" v-cloak>
      <h1 class="heading">Your CookBook</h1>
      <ul class="recipes">
        <li v-for="recipe in cookBookRecipes" :key="recipe.id">
          <img :src="recipe.image">
          <p class="toolbar">
            <a :href="'https://www.google.com/search?q=' + recipe.title" target="_blank">View</a>
            <a v-if="!recipe.isShared" @click.prevent="shareRecipe(recipe.id)" href="#">Share</a>
            <a v-else @click.prevent="unShareRecipe(recipe.id)" href="#">Unshare</a>
          </p>
          <div style="clear:both"></div>
          <h3 v-html="recipe.title"></h3>
        </li>
      </ul>
    </div>

    <div class="feed" v-else-if="showFeed" v-cloak>
      <h1 class="heading">Your feed</h1>
      <h3 class="heading" v-if="!hasFollowees">You haven't followed anyone yet</h3>
      <div v-else v-for="(followee,index) in feed" :key="index">
        <h3 class="followee_name">{{followee.name}}'s recipes</h3>
        <ul class="recipes">
          <li v-for="recipe in followee.recipes" :key="recipe.id">
            <img :src="recipe.image">
            <p class="toolbar">
              <a :href="'https://www.google.com/search?q=' + recipe.title" target="_blank">View</a>
              <a v-if="!recipe.isAdded" @click.prevent="addToCookBook(recipe.id)" href="#">Add to your cookbook</a>
            </p>
            <div style="clear:both"></div>
            <h3 v-html="recipe.title"></h3>
          </li>
        </ul>
        <div style="clear:both"></div>
      </div>
    </div>

    <div v-else-if="showSearch" v-cloak>
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

    <div class="followees" v-else-if="showFollowees">
      <h3>Follow people may share the same interest with you</h3>
      <ul>
        <li v-for="followee in followees" :key="followee.email">
          <a v-if="followee.isFollowed" @click.prevent="unfollow(followee.email)" href="#">Unfollow</a> 
          <a v-else @click.prevent="follow(followee.email)" href="#">Follow</a> 
          - {{followee.name}} (shared <span v-html="followee.sharedRecipes.length"></span> recipes)
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
      followees: [],
      cookBookRecipes: [],
      showSearch: false,
      showCookBook: false,
      showFeed: false,
      showLoading: false,
      showFollowees: false,
      feed: []
    }
  },
  computed: {
    hasFollowees() 
    {
      return this.userInfo.followees.length > 0;
    }
  },
  async created() 
  {
    const attribute = (await Auth.currentUserInfo()).attributes;
    this.userInfo = { 
      name: attribute.name,
      email: attribute.email,
      recipes: this.getCustomAttributes(attribute['custom:recipes']),
      sharedRecipes: this.getCustomAttributes(attribute['custom:sharedRecipes']),
      followees: this.getCustomAttributes(attribute['custom:followees'])
    };

    this.cognitoUser = await Auth.currentAuthenticatedUser();
    this.switchView();
  },
  methods: {
    switchView()
    {
      const hash = window.location.hash;
      if (hash == '#cookbook')
      {
        this.viewCookBook();
      }
      else if (hash == '#feed')
      {
        this.viewFeed();
      }
      else if (hash == '#followees')
      {
        this.viewFollowees();
      }
      else
      {
        this.viewSearch();
      }
    },

    async viewFollowees()
    {
      this.showLoading = true;
      const response = await this.invoke('getFollowees', this.userInfo.email);
      this.followees = JSON.parse(JSON.parse(response.Payload).body).map(f => {
        return {
          name: f.name,
          email: f.email,
          sharedRecipes: f.sharedRecipes,
          isFollowed: this.userInfo.followees.includes(f.email)
        }
      });
      this.showSearch = false;
      this.showFeed = false;
      this.showCookBook = false;
      this.showFollowees = true;
      this.showLoading = false;
    },

    viewSearch()
    {
      this.showSearch = true;
      this.showCookBook = false;
      this.showFeed = false;
      this.showFollowees = false;
    },

    getCustomAttributes(attribute)
    {
      return attribute ? attribute.split(',') : [];
    },

    async search()
    {
      this.showLoading = true;
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
      this.showLoading = false;
    },

    showFlashMessage(message)
    {
      this.showFlash = true;
      this.flashMessage = message;
      setTimeout(() => this.showFlash = false, 3000);
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
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:recipes': this.unique(this.userInfo.recipes).join(',') });
    },

    async viewCookBook()
    {
      this.showLoading = true;
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
      this.showLoading = false;
      this.showSearch = false;
      this.showCookBook = true;
      this.showFeed = false;
      this.showFollowees = false;
    },

    async shareRecipe(recipeId)
    {
      this.userInfo.sharedRecipes.push(recipeId);
      this.cookBookRecipes.forEach(recipe => {
        if (recipe.id == recipeId) recipe.isShared = true;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:sharedRecipes': this.unique(this.userInfo.sharedRecipes).join(',') });
    },

    async unShareRecipe(recipeId)
    {
      this.userInfo.sharedRecipes = this.userInfo.sharedRecipes.filter(recipe => recipe != recipeId);
      this.cookBookRecipes.forEach(recipe => {
        if (recipe.id == recipeId) recipe.isShared = false;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:sharedRecipes': this.unique(this.userInfo.sharedRecipes).join(',') });
    },

    async viewFeed()
    {
      this.showLoading = true;
      const response = await this.invoke('getFeed', this.userInfo.followees);
      this.feed = JSON.parse(JSON.parse(response.Payload).body);
      this.showSearch = false;
      this.showCookBook = false;
      this.showFeed = true;
      this.showLoading = false;
    },

    async follow(followeeEmail)
    {
      this.userInfo.followees.push(followeeEmail);
      this.followees.forEach(f => {
        if (f.email == followeeEmail) f.isFollowed = true;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:followees': this.unique(this.userInfo.followees).join(',') });
    },

    async unfollow(followeeEmail)
    {
      this.userInfo.followees = this.userInfo.followees.filter(f => f != followeeEmail);
      this.followees.forEach(f => {
        if (f.email == followeeEmail) f.isFollowed = false;
      });
      await Auth.updateUserAttributes(this.cognitoUser, { 'custom:followees': this.unique(this.userInfo.followees).join(',') });
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

.header {
  list-style-type: none;
  display: flex;
  align-items: center;
}
.header li {
  margin-right: 1rem;
}

.header h3,
.header h4 {
  margin: 0;
}
.header a {
  text-decoration: none;
}
.header a:hover {
  text-decoration: underline;
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

.loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
}
.heading {
  text-align: center;
}

.followees h3 {
  margin-left: 1rem;
}

.feed h3.followee_name {
  margin: 0 0 0 3.5rem;
}
</style>