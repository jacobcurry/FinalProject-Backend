const postgres = require("../postgres.js");

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await postgres.query(
      "INSERT INTO messages (message, users, sender) VALUES ($1,$2,$3) RETURNING *",
      [message, [from, to], from]
    );
    if (data.rows.length > 0) {
      const userFriends = await postgres.query(
        "SELECT * from users WHERE user_id = $1",
        [to]
      );

      let returnStatus = false;

      if (userFriends.rows[0].yourmessagedusers) {
        userFriends.rows[0].yourmessagedusers.map((id) => {
          if (from === id) {
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
        [from, to]
      );
      return res.json({ msg: "Message added successfully" });
    }
    return res.json({ msg: "Failed to add message to database" });
  } catch (err) {
    next(err);
  }
};

module.exports.getAllMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const allMessages = await postgres.query(
      "SELECT * FROM messages WHERE users = $1 OR users = $2 ORDER BY message_id ASC",
      [
        [from, to],
        [to, from],
      ]
    );
    const projectMessages = allMessages.rows.map((msg) => {
      return {
        fromSelf: msg.sender === from,
        message: msg.message,
      };
    });
    res.json(projectMessages);
  } catch (err) {
    next(err);
  }
};
