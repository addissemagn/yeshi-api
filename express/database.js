const MongoClient = require('mongodb').MongoClient;

const PROD = process.env.PROD === "true";
const DB = {
  USERNAME: PROD ? process.env.PROD_DB_USERNAME : process.env.DEV_DB_USERNAME,
  PASS: PROD ? process.env.PROD_DB_PASS : process.env.DEV_DB_PASS,
  NAME: PROD ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME,
  CLUSTER: PROD ? process.env.PROD_DB_CLUSTER : process.env.DEV_DB_CLUSTER,
}

const connString = `mongodb+srv://${DB.USERNAME}:${DB.PASS}@cluster0.${DB.CLUSTER}.mongodb.net/${DB.NAME}?retryWrites=true&w=majority`;

const connectDatabase = async () => {
  try {
    const client = await MongoClient.connect(connString, { useUnifiedTopology: true });
    const db = client.db(process.env.DB_NAME);
    const usersCollection = db.collection('users');
    const cookbooksCollection = db.collection('cookbooks');
    console.log('Connected to DB')

    return { usersCollection, cookbooksCollection };
  } catch (err) { console.log(err); }
}

class RecipeManager {
  constructor(usersCollection, cookbooksCollection) {
    this.usersCollection = usersCollection;
    this.cookbooksCollection = cookbooksCollection;
  };

  async save(user) {
    try {
      const res = await this.usersCollection.insertOne(user);
      return res;
    } catch (err) { console.log(err); }
  };

  async getUser(username) {
    try {
      const res = await this.usersCollection.findOne({ username: username });
      return res;
    } catch (err) { console.log(err); }
  };

  async getCookbook(id) {
    try {
      const res = await this.cookbooksCollection.findOne({ cookbookId: id });
      return res;
    } catch (err) { console.log(err); }
  };

  // Append recipe to cookbook's recipe list
  async addRecipeToCookbook(id, recipe) {
    try {
      const res = await this.cookbooksCollection.update(
        { cookbookId: id },
        {
            $push: {
                recipies: recipe
            }
        }
      );
      return res;
    } catch (err) { console.log(err); }
  }

  // Currently replaces the whole list with a new one
  async updateGroceryList(username, list) {
    try {
      const res = await this.usersCollection.updateOne(
        { username: username },
        { $set: { "groceryList": list}}
      );
      return res;
    } catch (err) { console.log(err); }
  }

  // Currently replaces the whole list with a new one
  async updateInventoryList(username, list) {
    try {
      const res = await this.usersCollection.updateOne(
        { username: username },
        { $set: { "inventory": list}}
      );
      return res;
    } catch (err) { console.log(err); }
  }

  // Remove recipie in cookbook by id
  async deleteCookbookRecipe(cookbookId, recipeId) {
    try {
      const query = {}
      query[`recipies.${recipeId}`] = 1;

      // Place null value at recipe index
      await this.cookbooksCollection.updateOne({}, {$unset : query});

      // Remove null value from recipe array
      const res = await this.cookbooksCollection.updateOne({}, {$pull : {"recipies" : null}});
      return res;
    } catch (err) { console.log(err); }
  }
}

module.exports = {
    connectDatabase,
    RecipeManager,
}
