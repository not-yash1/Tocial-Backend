const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const dotenv = require('dotenv')

const app = express();

dotenv.config({ path: "./config/config.env" })

app.use(
  cors({
    origin: [process.env.LOCAL_URL, process.env.WEB_URL],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

//Using middlewares
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Importing routes
const user = require("./routes/user");
const post = require("./routes/post");

// Using routes
app.use("/api/v1", user);
app.use("/api/v1", post);


module.exports = app;
