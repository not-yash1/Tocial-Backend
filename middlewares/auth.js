const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.isAuthenticated = async(req, res, next) => {
    
    try {

        const {token} = req.cookies;
        // console.log(token);

        if(!token){
            return res.status(401).json({
                message: "Please login first"
            });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decodedData.id);

        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }

};