require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();
const bodyParser = require('body-parser');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose
  .connect(
    "mongodb+srv://Monisha:Monivardhan12@cluster0.74djkap.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("mongoose connected!"));
//session setup
app.use(
  session({
    secret: "this is a secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.message - req.session.message;
  delete req.session.message;
  next();
});

app.use(express.static("uploads"));

app.set("view engine", "ejs");

app.use("", require("./routes/routes"));

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
