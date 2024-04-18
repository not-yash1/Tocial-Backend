const User = require('../models/User');
const Post = require("../models/Post");
const crypto = require('crypto');
const {sendMail} = require('../middlewares/sendMail');
const cloudinary = require("cloudinary");

exports.register = async (req, res) => {

    try {

        const {name, email, password, username, avatar} = req.body;

        console.log(req.body)

        let user = await User.findOne({email});

        if(user) {
            return res.status(400).json({
            success: false,
            message: "User already exists"});
        }

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
        });

        user = await User.create({
            name,
            email,
            password,
            username,
            avatar: {public_id: myCloud.public_id, url: myCloud.secure_url},
            // avatar: {public_id: "myCloud.public_id", url: "myCloud.secure_url"},
            // bio: "Sample Bio"
        });

        const token = await user.generateToken();
        console.log(token);

        const options = {
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly: true,
        }

        res.status(201).cookie("token", token, options).json({
            success: true,
            user,
            token,
        });
 
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

exports.loginUser = async(req, res)=>{

    try {
        
        const {email, password} = req.body;
        
        //checking if user has given both email and password
        
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Enter both Email and Password"
            });
            // next(new ErrorHandler("Please Enter Email & Password", 400));
        }
        
        const user = await User.findOne({ email }).select("+password").populate("posts followers following");
        
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }
        
        const isMatch = await user.matchPassword(password);
        
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
            
        };

        const token = await user.generateToken();
        console.log(token);

        const options = {
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            user,
            token,
        });
        
        
    } catch (error) {
        console.log("Really Bad")
        res.status(500).json({
            success: false,
            message: error.message
        })
        
    }
    
};

exports.logoutUser = async(req, res)=>{

    try {

        res.status(200).cookie("token", null, {
            expires: new Date(
                Date.now()),
                // httpOnly: true,
        }).json({
            success:true,
            message:"Logged out",
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.followAndUnfollowUser = async(req, res)=>{

    try {

        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);
        // console.log(req.user._id);

        if(!userToFollow){
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }


        // const postLikeIds = post.likes.map(like => like._id.toString());

        const followerIds = userToFollow.followers.map(follower => follower._id.toString());

        const userId = req.user._id.toString();
        // console.log(userId);

        if(followerIds.includes(userId)){

            const index = userToFollow.followers.indexOf(req.user._id);

            userToFollow.followers.splice(index, 1);

            await userToFollow.save();

            const index1 = loggedInUser.following.indexOf(req.params.id);

            loggedInUser.following.splice(index1, 1);

            await loggedInUser.save();

            return res.status(200).json({
                success: true,
                message: `Unfollowed ${userToFollow.username}`
            });

        } else {

            userToFollow.followers.push(req.user._id);

            loggedInUser.following.push(req.params.id);
    
            await userToFollow.save();
            await loggedInUser.save();

            return res.status(200).json({
                success: true,
                message: `Followed ${userToFollow.username}`
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.updatePassword = async(req, res)=>{

    try {
        
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword, confirmPassword } = req.body;

        if(!oldPassword || !newPassword || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password can not be empty"
            })
        }

        const isMatch = await user.matchPassword(oldPassword)

        if(newPassword !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password does not match"
            })
        }

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Old Password is Incorrect"
            })
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.updateProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);
        // console.log(req.user._id);

        const { name, email, username, avatar } = req.body

        if(!name || !email || !username){
            return res.status(400).json({
                success: true,
                message: "Name, Email or username can not be empty"
            })
        }

        // if(name === user.name){
        //     return res.status(400).json({
        //         success: true,
        //         message: "New name can not be same as previous"
        //     })
        // }

        // if(email === user.email){
        //     return res.status(400).json({
        //         success: true,
        //         message: "New email can not be same as previous"
        //     })
        // }

        user.name = name;
        user.username = username;
        user.email = email;

        
        // User Avatar: To Do
        if(avatar){

            await cloudinary.v2.uploader.destroy(user.avatar.public_id)

            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
            });

            user.avatar.public_id = myCloud.public_id;
            user.avatar.url = myCloud.secure_url;
        }

        user.save();

        res.status(200).json({
            success: true,
            message: "Profile Successfully Updated"
        })

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.deleteMyProfile = async (req, res) => {

    // console.log(req.user._id);
    try {

        // console.log(req.user._id);
        const user1 = await User.findById(req.user._id);
        // console.log(user1._id);

        // const Id = user._id;
        const posts = user1.posts;

        const followers = user1.followers;
        const followings = user1.following;

        // Removing Avatar from cloudinary
        await cloudinary.v2.uploader.destroy(user1.avatar.public_id)
        
        // Removing User from Followers' following
        for (let i = 0; i < followers.length; i++) {
            
            const follower = await User.findById(followers[i]);
            
            const index = follower.following.indexOf(user1._id);
            
            follower.following.splice(index, 1);
            await follower.save();
        }
        
        // Removing User from Following's followers
        for (let i = 0; i < followings.length; i++) {

            const following = await User.findById(followings[i]);

            const index = following.followers.indexOf(user1._id);

            following.followers.splice(index, 1);
            await following.save();
        }

        // Removing all comments of user from all the posts
        const allPosts = await Post.find();

        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for(let j = 0; j < post.comments.length; j++){
                // console.log("Each single comment: ", post.comments[j]);
                if(post.comments[j].user.toString()===user1._id.toString()){
                    post.comments.splice(j,1);
                    j-=1;
                }
            }

            // console.log("Without saving: ", post.comments)
            await post.save();
            // console.log("With saving: ", post.comments)
        }

        // Removing all likes of user from all the posts

        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for(let j = 0; j < post.likes.length; j++){
                if(post.likes[j].toString()===user1._id.toString()){
                    post.likes.splice(j,1);
                    j-=1;
                }
            }

            await post.save();
        }


        // let i=0;
        // while(posts.length){
        //     await Post.findByIdAndDelete(posts[i]);
        // }

        await User.findByIdAndDelete(req.user._id);

        // Logout User after deleting profile

        res.cookie("token", null, {
            expires: new Date(
                Date.now()),
                httpOnly: true,
        })


        // Delete all posts of the user
        // Removing all photos from cloudinary
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            await cloudinary.v2.uploader.destroy(post.image.public_id)
            await Post.findByIdAndDelete(posts[i]);  
        }

        res.status(200).json({
            success: true,
            message: "Profile Successfully Deleted"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.myProfile = async (req, res) => {
    
    try {

        const user = await User.findById(req.user._id).populate("posts followers following");

        res.status(200).json({
            success: true,
            user
        })

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.getUserProfile = async (req, res) => {

    try {

        const user = await User.findById(req.params.id).populate("posts followers following");

        if(!user){
            res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            user
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.getAllUsers = async (req, res) => {

    try {

        const users = await User.find({
            name: { $regex: req.query.name, $options: 'i' },
        });

        res.status(200).json({
            success: true,
            users,
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.forgotPassword = async (req, res) => {

    try {

        const user = await User.findOne({email:req.body.email});

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const resetToken = user.getResetPasswordToken();
        // console.log(resetToken);

        await user.save();

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this email, then please ignore it`;


        try{

            await sendMail({
                email: user.email,
                // to: user.email,
                subject: "Reset Password",
                message,
            })
            
            res.status(200).json({
                success:true,
                message: `Email sent to ${user.email} successfully`,
            })
            
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            
            await user.save();
            
            res.status(500).json({
                success: false,
                message: error.message
            })
        }

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.resetPassword = async (req, res) => {

    try {

        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });

        if(!user){
            return res.status(404).json({
                success: false,
                message: "Reset Password Token is invalid or has been expired"
            });
        }

        if(req.body.newPassword !== req.body.confirmPassword){
            return res.status(401).json({
                success: false,
                message: "Pasword Does not match"
            });
        }

        user.password = req.body.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password has been updated successfully",
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getMyPosts = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        const posts = [];

        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
            posts.push(post)
        }

        res.status(200).json({
            success: true,
            posts,
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

exports.getUserPosts = async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        const posts = [];

        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate("likes comments.user owner");
            posts.push(post);
        }

        res.status(200).json({
            success: true,
            posts,
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

}
