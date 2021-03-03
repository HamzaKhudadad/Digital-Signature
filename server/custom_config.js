// config.js
module.exports = {
  db: 'mongodb+srv://admin:123qwe@am-i-joking.szhng.mongodb.net/digitalSignatures?retryWrites=true&w=majority',
  // db_dev: 'mongodb://localhost:27017/digital-signature',
  db_dev: 'mongodb+srv://admin:123qwe@am-i-joking.szhng.mongodb.net/digitalSignatures?retryWrites=true&w=majority',
  JWT_SECRET: 'raja_hamza',
  'directory': __dirname,
  'options' :  {
	  provider: 'google',
	  httpAdapter: 'https',
	  apiKey: 'AIzaSyABUgL0EM0WtQY0OXjgEz4eowfVk-raUeo',
	  formatter: null
	}
};

