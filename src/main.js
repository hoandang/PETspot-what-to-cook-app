import Vue from 'vue'
import App from './App.vue'
import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
import axios from 'axios'
import VueAxios from 'vue-axios'
import {Auth} from '@aws-amplify/auth'
import Lambda from 'aws-sdk/clients/lambda';

Amplify.configure(aws_exports);

Vue.config.productionTip = false;
Vue.use(VueAxios, axios);
Vue.mixin({
  methods: {
    async invoke(functionName, data = {})
    {
      const lambda = new Lambda({
        credentials: Auth.essentialCredentials(await Auth.currentCredentials()),
        region: this.AWS_REGION
      });
      return lambda.invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(data)
      }).promise();
    },
    unique(array)
    {
      return [...new Set(array)];
    }
  },
  data()
  {
    return {
      get AWS_REGION()
      {
        return aws_exports.Auth.region;
      }
    }
  }
});

new Vue({
  render: h => h(App),
}).$mount('#app');
