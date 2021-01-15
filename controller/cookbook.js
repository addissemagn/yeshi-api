const cookbook = {
  getById: async (req, res, db) => {
    try {
      const cookbookId = req.params.id;
      const result = await db.getCookbook(cookbookId);
      res.send(result);
    } catch (err) {
      console.error(`ERROR: ${e.message}`);
      res.status(500).send({
        message: e.message,
      });
    }
  },
  addRecipe: async (req, res, db) => {
    try {
      const cookbookId = req.params.id;
      const { recipe } = req.body;

      const result = await db.addRecipeToCookbook(cookbookId, recipe);
      res.send(result);

    } catch (err) {
      console.error(`ERROR: ${e.message}`);
      res.status(500).send({
        message: e.message,
      });
    }
  },
  deleteRecipeByIndex: async(req, res, db) => {
    try {
      const cookbookId = req.params.id;
      const { recipeIndex } = req.body;
      const result = await db.deleteCookbookRecipe(cookbookId, recipeIndex);
      res.send(result)
    } catch (err) {
      console.error(`ERROR: ${e.message}`);
      res.status(500).send({
        message: e.message,
      });
    }
  }
};

module.exports = cookbook;
