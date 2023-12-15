const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

app.use(express.json());

// Defining mongoose schemes 
const userSchema = new mongoose.Schema({
  username: {type: String},
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
});

//Defining mongoose models
const User = mongoose.model('User',userSchema);
const Course = mongoose.model('Course',courseSchema);
const Admin = mongoose.model('Admin',adminSchema);

// connect to mongoDB
mongoose.connect('mongodb+srv://admin:admin@clustercourseselling.ltgolkh.mongodb.net/courses', { useNewUrlParser: true, useUnifiedTopology: true, dbName: "courses" });

const secretKey = "SrujanNalam";

const generateJwt = (user) => {
  const payload = {username: user.username};
  return jwt.sign(payload, secretKey,{ expiresIn: '1h' });
}

const authJwt = (req, res, next) => {
  const authHeader = req.headers.auth;

  if(authHeader){
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
      if (err){
        console.log(err);
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    })
  }else{
    res.sendStatus(401)
  }
}


// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const { username, password } = req.header;
  const admin = await Admin.findOne({username});
  if (admin) {
    res.status(403).json({ message: 'Admin already exists' });
  }else{
    const admin = new Admin({username, password})
    admin.save();
    const token = generateJwt(admin);
    res.status(200).json({message: 'Admin is created Successfully',token})
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.header;
  const admin = await Admin.findOne({username, password});
  if(admin){
    const token = generateJwt(admin)
    res.status(200).json({message: "Admin loggin Successful",token})
  }else{
    res.status(403).json({message: "Admin loggin failed"})
  }
});

app.post('/admin/courses', authJwt, async(req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId',authJwt, async (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new: true});
  if (course){
    res.json({ message: 'Course updated successfully' });
  }else{
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses', authJwt, async (req, res) => {
  // logic to get all courses
  const courses = await Course.findOne({});
  res.json({courses})
});

// User routes
app.post('/users/signup', async (req, res) => {
  // logic to sign up user
  const {username, password} = req.header;
  const user = await User.findOne({username});
  if(user){
    res.status(403).json({ message: 'User already exists' });
  }else{
    const user = new User({username, password});
    user.save()
    const token = generateJwt(user);
    res.status(200).json({message: 'user is created Successfully',token})
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const {username, password} = req.header;
  const user = await User.findOne({username, password});
  if(user){
    const token = generateJwt(user)
    res.status(200).json({message: "User loggin Successful",token})
  }else{
    res.status(403).json({message: "User loggin failed"})
  }
});

app.get('/users/courses',authJwt, async(req, res) => {
  // logic to list all courses
  const courses = await Course.findOne({});
  res.json({courses})
});

app.post('/users/courses/:courseId', authJwt, async(req, res) => {
  // logic to purchase a course
  const course = await Course.findById(req.params.courseId);
  if(course){
    const user = await User.findOne({username: req.user.username});
    if(user){
      user.purchasedCourses.push(course);
      user.save()
      res.status(200).json({ message: 'Course successfully purchased' });
    }else{
      res.status(403).json({ message: 'User not found' });
    }
  }else{
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', authJwt, async(req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
