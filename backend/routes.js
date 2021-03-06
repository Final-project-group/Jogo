const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Post = require("./models/Post");
const User = require("./models/User");
const Event = require("./models/Event");

/**ALL OUR BACKEND ROUTES */

router.get("/", (req, res) => {
  res.json({ serverWorking: true });
});

router.get("/get-the-user", authorize, async (req, res) => {
  let user = await User.findById(res.locals.user._id);
  res.json(user);
});

// These two are broken / incomplete ATM
router.get("/get-all-users", async (req, res) => {
  let users = await User.find();
  res.json(users);
});

// Create user with email
router.post("/create-user", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (!user) {
    user = await User.create(req.body);
  } else {
    res.json({ err: "User already exists." });
  }

  jwt.sign(
    { user },
    "secret key",
    { expiresIn: "3000000min" },
    (err, token) => {
      res.json({ user, token });
    }
  );
});

router.post("/sign-in-user", async (req, res) => {
  console.log(req.body);
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.json({ err: "No user with that email exists." });
  }
  if (user.password !== req.body.password) {
    res.json({ err: "Wrong password." });
  }

  jwt.sign(
    { user },
    "secret key",
    { expiresIn: "3000000min" },
    (err, token) => {
      res.json({ user, token });
    }
  );
  // res.json(user)
});

router.post("/edit-event", authorize, async (req, res) => {
  let updatedEvent = req.body;
  // console.log(updatedEvent);
  // console.log(updatedEvent.members);

  Event.findOneAndUpdate(
    { _id: updatedEvent._id },
    {
      location: updatedEvent.location,
      date: updatedEvent.date,
      sport: updatedEvent.sport,
      level: updatedEvent.level,
      age: updatedEvent.age,
      spots: updatedEvent.spots,
      image: updatedEvent.image,
      eventName: updatedEvent.eventName,
      description: updatedEvent.description,
    },
    { new: true }
  )
    .populate("memberIds")
    .then((event) => {
      console.log("joined", User);
      res.json(event);
    });
});

router.post("/leave-event", authorize, async (req, res) => {
  let updatedEvent = req.body;

  Event.findOneAndUpdate(
    { _id: updatedEvent._id },
    { members: updatedEvent.members, memberIds: updatedEvent.memberIds },
    { new: true }
  )
    .populate("memberIds")
    .then((user) => {
      console.log("left", Event.members);
      res.json(user);
    });
});

router.post("/delete-event", authorize, async (req, res) => {
  let deletedEvent = req.body;

  Event.deleteOne({ _id: deletedEvent._id }, function (err) {
    if (err) console.log(err);
    console.log("Successful deletion");
  });
});

router.post("/add-post", authorize, async (req, res) => {
  let newPost = req.body;
  console.log(req.body);
  newPost.userId = res.locals.user._id;
  newPost.userInfo = res.locals.user;

  Post.create(newPost).then((post) => {
    res.json(post);
  });
});
router.post("/delete-post", authorize, async (req, res) => {
  let deletedPost = req.body;
  console.log(deletedPost._id);

  Post.deleteOne({ _id: deletedPost._id }, function (err) {
    if (err) console.log(err);
    console.log("Successful deletion");
  });
});

router.get("/all-the-posts", (req, res) => {
  Post.find()
    .populate("userId")
    .then((posts) => {
      res.json(posts);
    });
});

router.post("/add-details", authorize, async (req, res) => {
  let updatedUser = req.body;
  updatedUser.userId = res.locals.user._id;
  User.findOneAndUpdate(
    { _id: updatedUser.userId },
    {
      country: updatedUser.currentUser.country,
      sports: updatedUser.currentUser.sports,
    },
    { new: true }
  )
    .populate("memberIds")
    .then((user) => {
      res.json(user);
    });
});

router.post("/add-event", authorize, async (req, res) => {
  let newEvent = req.body;
  newEvent.creator = res.locals.user;
  Event.create(req.body).then((event) => {
    res.json(event);
  });
});

router.post("/join-event", authorize, async (req, res) => {
  let updatedEvent = req.body;
  Event.updateOne(
    { _id: updatedEvent._id },
    { members: updatedEvent.members },
    function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        console.log("Updated MEMBERS : ", docs);
      }
    }
  ).populate("memberIds");
});

router.get("/all-the-events", (req, res) => {
  Event.find()
    .populate("memberIds")
    .then((posts) => {
      res.json(posts);
    });
});

router.get("/get-event-details/:dynamicId", (req, res) => {

  Event.findOne({ _id: req.params.dynamicId })
    .populate("memberIds")
    .then((event) => {
      res.json(event);
    });
});

router.post("/authenticate", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (!user) {
    user = await User.create(req.body);
  }

  jwt.sign(
    { user },
    "secret key",
    (err, token) => {
      res.json({ user, token });
    }
  );
});

//Middle ware >>> Put this in the middle of any route where you want to authorize
function authorize(req, res, next) {
  let token = req.headers.authorization.split(" ")[1]; //Token from front end
  if (token) {
    jwt.verify(token, "secret key", (err, data) => {
      if (!err) {
        res.locals.user = data.user; //Set global variable with user data in the backend
        next();
      } else {
        res.status(403).json({ message: err });
        //throw new Error({ message: "ahhh" })
      }
    });
  } else {
    res.status(403).json({ message: "Must be logged in!" });
  }
}

module.exports = router;
