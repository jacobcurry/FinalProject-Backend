const postgres = require("../postgres.js");
const bcrypt = require("bcryptjs");

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const usernameData = await postgres.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (usernameData.rows.length > 0) {
      console.log("hi");
      return res.json({
        msg: "Username is already in use",
        status: false,
      });
    }
    const emailData = await postgres.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailData.rows.length > 0) {
      return res.json({
        msg: "Email is already in use",
        status: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await postgres.query(
      "INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING *",
      [username, email, hashedPassword]
    );
    return res.json({ user: user.rows[0], status: true });
  } catch (err) {
    next(err);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await postgres.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (user.rows.length === 0) {
      return res.json({ msg: "Incorrect username or password", status: false });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password
    );
    if (!isPasswordValid) {
      return res.json({ msg: "Incorrect username or password", status: false });
    }
    return res.json({ user: user.rows[0], status: true });
  } catch (err) {
    next(err);
  }
};

module.exports.editUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email } = req.body;
    const usernameCheck = await postgres.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      if (usernameCheck.rows[0].user_id !== userId) {
        return res.json({ msg: "Username already exists", status: false });
      }
    }

    const emailCheck = await postgres.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      if (emailCheck.rows[0].user_id !== userId) {
        return res.json({ msg: "Email already exists", status: false });
      }
    }
    const updatedUser = await postgres.query(
      "UPDATE users SET username = $1, email = $2 WHERE user_id = $3 RETURNING *",
      [username, email, userId]
    );
    return res.json({ user: updatedUser.rows[0], status: true });
  } catch (err) {
    next(err);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const avatarImage = req.body.image;
    const updatedUser = await postgres.query(
      "UPDATE users SET avatarimage = $1, isavatarimageset = $2 WHERE user_id = $3 RETURNING *",
      [avatarImage, true, userId]
    );
    return res.json({
      isSet: updatedUser.rows[0].isavatarimageset,
      image: updatedUser.rows[0].avatarimage,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const users = await postgres.query(
      "SELECT * FROM users WHERE user_id != $1",
      [userId]
    );
    return res.json(users.rows);
  } catch (err) {
    next(err);
  }
};

module.exports.getSearchedUsers = async (req, res, next) => {
  try {
    const searchQuery = req.params.searchQuery;
    const userId = parseInt(req.params.id);
    const users = await postgres.query(
      `SELECT * FROM users WHERE user_id != $1 AND username ILIKE '%${searchQuery}%'`,
      [userId]
    );
    return res.json(users.rows);
  } catch (err) {
    next(err);
  }
};

module.exports.setFriend = async (req, res, next) => {
  try {
    const friend_id = req.body.friend_id;
    const userId = parseInt(req.params.id);

    const userFriends = await postgres.query(
      "SELECT * from users WHERE user_id = $1",
      [userId]
    );

    let returnStatus = false;

    if (userFriends.rows[0].yourmessagedusers) {
      userFriends.rows[0].yourmessagedusers.map((id) => {
        if (friend_id === id) {
          returnStatus = true;
        }
      });
    }
    if (returnStatus) {
      return res.json({
        status: false,
        msg: "You already have messages with this person",
      });
    }

    const updatedUser = await postgres.query(
      "UPDATE users SET yourmessagedusers = ARRAY_APPEND(yourmessagedusers, $1) WHERE user_id = $2 RETURNING *",
      [friend_id, userId]
    );
    const updatedFriend = await postgres.query(
      "UPDATE users SET yourmessagedusers = ARRAY_APPEND(yourmessagedusers, $1) WHERE user_id = $2 RETURNING *",
      [userId, friend_id]
    );
    return res.json(updatedUser.rows);
  } catch (err) {
    next(err);
  }
};

module.exports.getFriends = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await postgres.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (!user.rows[0].yourmessagedusers) {
      return res.json({ status: false });
    }
    const friends = await postgres.query(
      "SELECT * FROM users WHERE user_id = ANY($1)",
      [user.rows[0].yourmessagedusers]
    );
    return res.json({ friends: friends.rows, status: true });
  } catch (err) {
    next(err);
  }
};

module.exports.deleteFriend = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userid);
    const friend_id = parseInt(req.params.friendid);

    const updatedUser = await postgres.query(
      "UPDATE users SET yourmessagedusers = array_remove(yourmessagedusers, $1) WHERE user_id = $2 RETURNING *",
      [friend_id, userId]
    );
    const updatedFriend = await postgres.query(
      "UPDATE users SET yourmessagedusers = array_remove(yourmessagedusers, $1) WHERE user_id = $2 RETURNING *",
      [userId, friend_id]
    );
    return res.json({ user: updatedUser.rows, friend: updatedFriend.rows });
  } catch (err) {
    next(err);
  }
};
