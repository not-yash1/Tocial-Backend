const express = require("express"); 
const { createPost, likeAndUnlikePost, deletePost, getPostsOfFollowing, updateCaption, addComment, updateComment, deleteComment } = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.route("/post/upload").post(isAuthenticated, createPost);

router
.route("/post/:id")
.get(isAuthenticated, likeAndUnlikePost)
.put(isAuthenticated, updateCaption)
.delete(isAuthenticated, deletePost);

router.route("/posts").get(isAuthenticated, getPostsOfFollowing);

router.route("/post/comment/:id").post(isAuthenticated, addComment);

router.route("/post/comment/:id1/:id2").put(isAuthenticated, updateComment)
.delete(isAuthenticated, deleteComment);




module.exports = router;