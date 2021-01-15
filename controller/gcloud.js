const vision = require("@google-cloud/vision"),
  util = require("../util");

const gcloud = {
  extractRecipe: async (req, res) => {
    try {
      const path = req.files.image.data;

      const client = new vision.ImageAnnotatorClient({
        credentials: JSON.parse(process.env.GOOGLE_CLOUD_KEY),
      });

      // Performs text detection on the image file
      const [result] = await client.textDetection(path);

      // TODO: 1. Error handling, 2. Image enhancements
      const detections = result.textAnnotations;
      const lines = detections.length > 0 && detections[0].description;

      const recipe = util.textToRecipeObject(lines);
      res.send(recipe);
    } catch (err) {
      console.log(err);
    }
  },
};

module.exports = gcloud;
