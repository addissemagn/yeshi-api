'use strict';

require("dotenv").config();

const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const {
  connectDatabase,
  RecipeManager
} = require("./database");
const auth = require("../middleware/auth");

const app = express();
const router = express.Router();

let recipeManagerDb;

const getDb = async () => {
  if (!recipeManagerDb) {
    const { usersCollection, cookbooksCollection } = await connectDatabase();
    recipeManagerDb = new RecipeManager(usersCollection, cookbooksCollection);
  }

  return recipeManagerDb;
}

router.get('/', (req, res) => {
  res.send('API is working!');
})

router.post('/login', async (req, res) => {
  recipeManagerDb = await getDb();
  const { username, password } = req.body;

  try {
    const user = await recipeManagerDb.getUser(username);

    if (!user) {
      return res.status(400).json({
        message: `User ${username} does not exist`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    const payload = {
      user: {
        username: user.username,
      },
    };

    console.log(`Logged in user: ${username}`)

    jwt.sign(
      payload,
      process.env.PRIVATE_KEY,
      {
        expiresIn: 3600,
      },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          token,
        });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Server Error"
    });
  }
})

router.get('/admin', auth, async (req, res) => {
  usersDb = await getDb();
  try {
    const admin = await usersDb.getAdmin(req.user.username);
    res.json({ username: admin.username });
  } catch (e) {
    res.send({ message: "Error fetching admin" });
  }
})

router.get('/user', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const { username } = req.user;
  const result = await recipeManagerDb.getUser(username);
  // TODO: Re-eval. It's a hash value but unnecessary to return
  delete result.password;
  res.send(result)
})

router.get('/cookbook/:id', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const id = req.params.id;
  const result = await recipeManagerDb.getCookbook(id);
  res.send(result);
})

router.post('/cookbook/:id', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const id = req.params.id;
  const { recipe } = req.body;

  const result = await recipeManagerDb.addRecipeToCookbook(id, recipe);
  res.send(result)
})

// Delete recipie in cookbook by it's ID
router.delete('/cookbook/:id', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const cookbookId = req.params.id;
  const { recipeId } = req.body;

  const result = await recipeManagerDb.deleteCookbookRecipe(cookbookId, recipeId);
  res.send(result)
})

router.patch('/list/groceries', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const { username } = req.user;
  const { list } = req.body;

  const result = await recipeManagerDb.updateGroceryList(username, list);
  res.send(result)
})

router.patch('/list/inventory', auth, async (req, res) => {
  recipeManagerDb = await getDb();
  const { username } = req.user;
  const { list } = req.body;

  const result = await recipeManagerDb.updateInventoryList(username, list);
  res.send(result)
})

router.get('/test', (req, res) => res.json({ route: req.originalUrl }));

var corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public'))
app.use('/public', express.static('public'))
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', router);

module.exports = app;
module.exports.handler = serverless(app);
