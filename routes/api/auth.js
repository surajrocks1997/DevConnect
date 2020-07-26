const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const axios = require("axios");

const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route   GET     api/auth
// @desc    Get Logged-In User
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/movies/:year", async (req, res) => {
    const year = req.params.year;
    const response = await axios.get("https://jsonmock.hackerrank.com/api/movies?Year=" + year);

    const data = response.data.data;
    const arr = [];

    data.map(myData => {
      // console.log(myData.Title);
      arr.push(myData.Title);
    })

    // console.log(arr);
    console.log(arr.join("\n"));
    res.status(201).json({ msg: "Running" });

});

router.get("/movies/name/:str", async(req, res) => {
  const str = req.params.str;
  const response = await axios.get("https://jsonmock.hackerrank.com/api/movies/search/?Title=" + str);

  const myData = response.data;
  const arr = [];
  myData.data.map(data => {
    arr.push(data.Title);
  })
  
  if(myData.total_pages > 1) {
    for(let i=2; i<= myData.total_pages; i++){
      const newRes = await axios.get("https://jsonmock.hackerrank.com/api/movies/search/?Title=" + str + "&page=" + i);

      const newPageData = newRes.data;
      newPageData.data.map(data => {
        arr.push(data.Title);
      })
    }
  }

  const sorted = arr.sort();
  console.log(sorted.join("\n"));
  
  res.status(201).json({ msg: "Running!!" });

})

// @route   POST    api/auth
// @desc    Authenticate User and Get Token
// @access  Public
router.post(
  "/",
  [
    check("email", "Please Include a valid Email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
