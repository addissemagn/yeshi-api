const bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");

const user = {
  login: async (req, res, db) => {
    const { username, password } = req.body;

    try {
      const user = await db.getUser(username);

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
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
      });
    }
  },
  get: async (req, res, db) => {
    const { username } = req.user;
    const result = await db.getUser(username);
    // TODO: Re-eval. It's a hash value but unnecessary to return
    delete result.password;
    res.send(result);
  },
  updateGroceryList: async (req, res, db) => {
    const { username } = req.user;
    const { list } = req.body;

    const result = await db.updateGroceryList(username, list);
    res.send(result)
  },
  updateInventory: async (req, res, db) => {
    const { username } = req.user;
    const { list } = req.body;

    const result = await db.updateInventoryList(username, list);
    res.send(result)
  }
};

module.exports = user;
