const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Note = require("./models/Notes");
const cookieParser = require('cookie-parser');
const User = require("./models/Users"); 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const session = require('express-session');
require('dotenv').config();
const app = express();
const CLIENT_URL = 'https://snazzy-gnome-5048d5.netlify.app/';


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.CONNECTION_ID);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}


app.use(
  cors({
    origin: "https://main--snazzy-gnome-5048d5.netlify.app/",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: process.env.SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {

  User.findById(id)
    .then(user => {
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    })
    .catch(err => {
      return done(err);
    });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://keeper-api-3hra.onrender.com/auth/google/callback",
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      existingUser.displayName = profile.displayName;
      existingUser.displayImage = profile.picture;
      await existingUser.save();
      return done(null, existingUser);
    }else {
      const newUser = new User({
        googleId: profile.id,
        displayName: profile.displayName

      });
    
      try {
        await newUser.save();
        console.log("User Added");
        return done(null, newUser);
      } catch (err) {
        console.error("Error saving user:", err);
        return done(err);
      }
    } 
  }catch (err) {
    return done(err);
  }
}));

app.get("/logout",(req,res)=>{
  if(req.user)
  {
  req.logout(()=>{
    res.status(200).json("ok");
  });
  }
})

app.get("/userImage",async (req,res)=>{
  const currUser = req.user;
  if(req.user)
  {
    const user = await User.findOne({ googleId: currUser.googleId });
    const picture = user.displayImage;
    res.json({image: picture});
  }
})

app.put("/edit",(req,res)=>{
    if(req.user)
    {
      const {googleId} = req.user;
      const {title, content,noteId} = req.body;
      Note.updateOne({_id: noteId }, { $set: { title: title,content: content }}).
      then(async (result)=>{
        if(result.modifiedCount >0)
        {
          res.status(200);
        }
      });
     
    }
});


app.get("/auth/google", 
passport.authenticate('google', { scope: ['email', 'profile'] })
);
app.get("/auth/google/callback",
passport.authenticate("google", {
  successRedirect: CLIENT_URL,
  failureRedirect: "/login/failed",
})
);


app.post("/", async (req, res) => {
  const { title, content } = req.body.note;
  const user = req.user;
  const {googleId} = user;
  if(user)
  {
  try {
    const noteData = await Note.create({ title, content, "user": googleId});
    const notes = await Note.find({user: googleId});
    res.json(notes);
  } catch (error) {
    res.status(500).json(error);
  }
}
else
{
   res.status(500).json({error:"User not login in."});
}
});



app.get("/getNotes",async (req, res) => {
  const googleId = req.user?.googleId;
  if(req.user){
    const userNotes = await Note.find({user: googleId});
    res.status(200).json({
      success: true,
      message: "successfull",
      notes: userNotes,
   });
  }else
  {
    res.status(500).json({error: "user not loged in."});
  }
});


app.post("/delete/:id", async (req, res) => {
  const googleId = req.user.googleId;
  if(req.user)
  {
  try {
    await Note.deleteOne({_id: req.params.id,user: googleId});
    const note = await Note.find({user: googleId});
    res.json(note).status(200);
  } catch (error) {
    res.status(500).json(error);
  }
 }
});

connectDB().then(() => {
  app.listen(4000, () => {
      console.log("listening for requests");
  })
});
