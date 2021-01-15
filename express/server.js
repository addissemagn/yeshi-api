'use strict';

require("dotenv").config();

const express = require("express"),
  serverless = require("serverless-http"),
  bodyParser = require("body-parser"),
  fileUpload = require("express-fileupload"),
  cors = require("cors"),
  aws = require("aws-sdk");

const auth = require("../middleware/auth"),
  user = require("../controller/user"),
  gcloud = require("../controller/gcloud"),
  cookbook = require("../controller/cookbook"),
  { connectDatabase, RecipeManager} = require ("./database");

const app = express(),
  router = express.Router();

// Configurations
aws.config.update({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: "us-east-1",
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
}));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('public'))
app.use('/public', express.static('public'))
app.use('/', router);
// Must route to Netlify Lambda
app.use('/.netlify/functions/server', router);

// Initialize/retrieve db wrapper class
let recipeManagerDb;
const getDb = async () => {
  if (!recipeManagerDb) {
    const { usersCollection, cookbooksCollection } = await connectDatabase();
    recipeManagerDb = new RecipeManager(usersCollection, cookbooksCollection);
  }
  return recipeManagerDb;
}

router.get('/', (req, res) => res.send('API is working!'));

// TODO: Add sign up endpoint
router.post('/login', async (req, res) => user.login(req, res, await getDb()));

// Get user by token
router.get('/user', auth, async (req, res) => user.get(req, res, await getDb()));

// Update grocery list for user, returns the modified user
router.patch('/list/groceries', auth, async (req, res) => user.updateGroceryList(req, res, await getDb()));

// Update inventory list for user, returns the modified user
router.patch('/list/inventory', auth, async (req, res) => user.updateInventory(req, res, await getDb()));

// Get cookbook by it's ID
router.get('/cookbook/:id', auth, async (req, res) => cookbook.getById(req, res, await getDb()));

// Add recipe to cookbook, returns modified cookbook
router.post('/cookbook/:id', auth, async (req, res) => cookbook.addRecipe(req, res, await getDb()));

// Delete recipe in cookbook by its INDEX in the list, returns modified cookbook
// TODO: Change to delete by ID
router.delete('/cookbook/:id', auth, async (req, res) => cookbook.deleteRecipeByIndex(req, res, await getDb()));

// Receives image and returns extracted recipe model using GCloud Vision for text recognition
router.post('/ocr/recipe', auth, gcloud.extractRecipe);

// Uploads image to S3 bucket, adds image URL to MongoDB document of the cookbook's specified recipe, returns modified cookook
// TODO: Refactor to controller
// TODO: Allow different captions for each photo in bulk upload
router.post("/cookbook/:cookbookId/upload", auth, async (req, res) => {
  await getDb();

  const { cookbookId } = req.params;
  const { recipeIndex, caption } = req.body;

  try {
    // TODO: Optimize bulk uploads, s3 upload might be limited but try to do only 1 write to MongoDB
    let updatedCookbook;

    for (const key of Object.keys(req.files)) {
      const buffer = req.files[key].data;
      var id = `img-${Date.now()}-${req.files[key].name}`;

      const result = await new aws.S3()
        .upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: id,
          Body: buffer,
          ACL: "public-read",
        })
        .promise();

      const image = {
        url: result.Location,
        caption,
      };

      updatedCookbook = await recipeManagerDb.addImageToRecipe(
        cookbookId,
        recipeIndex,
        image
      );
    }
    console.log(updatedCookbook);

    res.send({
      message: "File uploaded",
      cookbook: updatedCookbook,
    });
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    res.status(500).send({
      message: err.message,
    });
  }
});

module.exports = app;
module.exports.handler = serverless(app);
