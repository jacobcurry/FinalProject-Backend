const {
  register,
  login,
  setAvatar,
  getAllUsers,
  editUser,
  getSearchedUsers,
  setFriend,
  getFriends,
  deleteFriend,
} = require("../controllers/userController");

const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/edituser/:id", editUser);
router.post("/setavatar/:id", setAvatar);
router.post("/setfriend/:id", setFriend);
router.get("/allusers/:id", getAllUsers);
router.get("/getfriends/:id", getFriends);
router.get("/searchusers/:id/:searchQuery", getSearchedUsers);
router.delete("/deletefriend/:userid/:friendid", deleteFriend);

module.exports = router;
