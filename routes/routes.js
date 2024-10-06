const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Employees = require("../models/employees");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");

router.get("/", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/create-user", async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await Employees.findOne({ email });
  if (existingUser) {
    return res.status(406).json({ message: "user exist" });
  } else {
    const Employee = new Employees({
      name: name,
      email: email,
      password: await bcrypt.hash(password, 12),
    });
    await Employee.save();
    res.render("login");
  }
});

router.post("/auth", async (req, res) => {
  const { email, password } = req.body;
  const Employee = await Employees.findOne({ email });
  if (Employee) {
    const isPasswordValid = await bcrypt.compare(password, Employee.password);
    if (isPasswordValid) {
      req.session.isAuth = true;
      req.session.Employee = Employee;
      res.render("index");
    } else {
      return res.status(406).json({ message: "Wrong Password" });
    }
  } else {
    return res.status(406).json({ message: "user does not exist" });
  }
});

// Image upload configuration
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // This should point to the uploads directory
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

// Insert a user into the database route
router.post("/add", upload, async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      req.session.message = {
        type: "danger",
        message: "Email already exists! Please use a different email.",
      };
      return res.redirect("/add"); // Redirect to the form again
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      designation: req.body.designation,
      gender: req.body.gender,
      course: req.body.course,
      image: req.file.filename,
    });

    await user.save(); // Save the user
    req.session.message = {
      type: "success",
      message: "User added successfully!",
    };
    res.redirect("/home");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

//get all users
router.get("/home", async (req, res) => {
  try {
    let user = await User.find(); // Fetch users from the database
    // Add this to check if users is being fetched correctly
    res.render("index", {
      title: "Home Page",
      user: user, // Pass the array of users to the template
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Render add user form
router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add users" });
});

//edit user
router.get("/edit/:id", async (req, res) => {
  try {
    let id = req.params.id; // use req.params instead of req.param (deprecated)
    const user = await User.findById(id);

    if (!user) {
      return res.redirect("/home");
    }

    res.render("edit_users", {
      title: "Edit User",
      user: user,
    });
  } catch (err) {
    res.redirect("/home");
  }
});

//update user route
const path = require("path");

router.post("/update/:id", upload, async (req, res) => {
  const id = req.params.id;
  let new_image = "";

  // Check if a new file was uploaded
  if (req.file) {
    new_image = req.file.filename;

    // Delete the old image
    try {
      fs.unlinkSync(path.join(__dirname, "uploads", req.body.old_image)); // Ensure the path is correct
    } catch (err) {
      console.error("Error deleting old image:", err);
    }
  } else {
    new_image = req.body.old_image; // Use the old image if no new file was uploaded
  }

  try {
    // Use async/await with findByIdAndUpdate
    const result = await User.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        designation: req.body.designation,
        gender: req.body.gender,
        course: req.body.course,
        image: new_image, // Use the new_image variable to update the image field
      },
      { new: true }
    ); // 'new: true' returns the updated document

    // Check if the user was found and updated
    if (!result) {
      return res
        .status(404)
        .json({ message: "User not found", type: "danger" });
    }

    req.session.message = {
      type: "success",
      message: "User updated successfully",
    };
    res.redirect("/home");
  } catch (err) {
    console.error("Error updating user:", err);
    res.json({ message: err.message, type: "danger" });
  }
});

// DELETE user by ID
router.get("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await User.findByIdAndDelete(id);

    if (result) {
      if (result.image) {
        fs.unlinkSync("./uploads/" + result.image); // Delete image if it exists
      }
      req.session.message = {
        type: "info",
        message: "User deleted successfully",
      };
    } else {
      req.session.message = {
        type: "warning",
        message: "User not found",
      };
    }

    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.json({ message: err.message });
  }
});

module.exports = router;
