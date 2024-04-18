const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { Schema } = mongoose;

const userSchema = new Schema({

    name:{
        type:String,
        required:[true, "Please Enter your name"],
        maxLength:[30, "Name can not exceed 30 characters"],
        minLength:[4, "Name should have at least 4 characters"],
    },
    avatar:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    email:{
        type:String,
        required:[true, "Please Enter your Email"],
        unique: true,
        // validate:[validator.isEmail, "Please Enter a valid Email"]
    },
    password:{
        type:String,
        required:[true, "Please Enter your password"],
        mainLength:[8,"Pasword must contain at least 8 characters"],
        select:false,
    },
    username:{
        type:String,
        required:true,
        unique: true
    },
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    followers:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User_Soc"
        }
    ],
    following:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User_Soc"
        }
    ],

    resetPasswordToken: String,
    resetPasswordExpire: Date, 
});

userSchema.pre("save", async function(next) {

    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
})

userSchema.methods.matchPassword = async function(enterPassword){

    const isMatch = await bcrypt.compare(enterPassword, this.password);

    return await bcrypt.compare(enterPassword, this.password);
}

userSchema.methods.generateToken = function (){
    return jwt.sign({id:this._id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE,
    });
};

userSchema.methods.getResetPasswordToken = function(){

    //Generating Token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hashing and adding to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15*60*1000;

    return resetToken;

    // return await bcrypt.compare(enterPassword, this.password);
}

module.exports = mongoose.model("User_Soc", userSchema);