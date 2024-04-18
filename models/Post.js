const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    caption:{
        type:String,
    },
    image:{
        public_id: String,
        url: String,
        
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User_Soc"
    },
    createdAt:{
            type: Date,
            default: Date.now,
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User_Soc"
        },
        
    ],
    comments:[
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User_Soc"
            },
            comment:{
                type:String,
                required:true,
            },
        },
        
    ], 
});

module.exports = mongoose.model("Post", postSchema);