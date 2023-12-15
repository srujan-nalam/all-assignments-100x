const { clear } = require('console');
const express = require('express');
const app = express();
const fs = require('fs')
const jwt = require('jsonwebtoken')

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// reading data from files
try{
  ADMINS = JSON.parse(fs.readFileSync('admins.json','utf8'));
  COURSES = JSON.parse(fs.readFileSync('courses.json','utf8'));
  USERS = JSON.parse(fs.readFileSync('users.json','utf8'));
}catch{
  ADMINS = [];
  USERS = [];
  COURSES = [];
}

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
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.headers;
  const exAdmin = ADMINS.find(a => a.username === admin.username);
  if(exAdmin){
    res.status(403).json({"message": "Admin Already exists"});
  }else{
    ADMINS.push(admin);
    fs.writeFileSync('admins.json', JSON.stringify(ADMINS))
    const token = generateJwt(admin);
    res.status(200).json({message: 'Admin is created Successfully',token})
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const admin = req.headers;
  const exAdmin = ADMINS.find(a => a.username === admin.username && a.password === admin.password);
  if(exAdmin){
    const token = generateJwt(admin)
    res.status(200).json({message: "Admin loggin Successful",token})
  }else{
    res.status(403).json({message: "Admin loggin failed"})
  }
});

app.post('/admin/courses', authJwt,(req, res) => {
  // logic to create a course
  const course = req.body;
  course.id = COURSES.length + 1
  COURSES.push(course)
  fs.writeFileSync('courses.json',JSON.stringify(COURSES));
  res.status(200).json({message: "Course created successfully",CourseID:course.id})
});

app.put('/admin/courses/:courseId', authJwt, (req, res) => {
  // logic to edit a course
  const id = parseInt(req.params.courseId);
  const course = COURSES.find(c => c.id == id);
  if(course){
    Object.assign(course,req.body);
    fs.writeFileSync('courses.josn',JSON.stringify(COURSES));
    res.status(200).json({"message":"Course updated successfully"})
  }else{
    res.status(404).json({"message":"Course not found"})
  }
});

app.get('/admin/courses', authJwt, (req, res) => {
  // logic to get all courses
  res.status(200).json({"course":COURSES})
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.headers;
  const exuser = USERS.find(u => u.username === user.username);
  if(exuser){
    res.status(403).json({message:"User already exists"});
  }else{
    USERS.push(user);
    fs.writeFileSync('users.json',JSON.stringify(USERS));
    const token = generateJwt(user);
    res.status(200).json({message: 'user is created Successfully',token})
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const user = req.headers;
  const exUser = USERS.find(u => u.username === user.username && u.password === user.password);
  if(exUser){
    const token = generateJwt(user)
    res.status(200).json({message: "User loggin Successful",token})
  }else{
    res.status(403).json({message: "User loggin failed"})
  }
});

app.get('/users/courses', authJwt,(req, res) => {
  // logic to list all courses
  res.status(200).json({"course":COURSES})
});

app.post('/users/courses/:courseId', authJwt, (req, res) => {
  // logic to purchase a course
  const id = parseInt(req.params.courseId);
  const course = COURSES.find(c => c.id === id)
  if(course){
    const user = USERS.find( u => u.username === req.user.username)
    if(user){
      if(!user.purchasedCourses){
        user.purchasedCourses = []
      }
      user.purchasedCourses.push(course);
      fs.writeFileSync('users.json',JSON.stringify(USERS))
      res.status(200).json({message: "Course purchased successfully"})
    }else{
      res.status(403).json({ message: 'user does not exist' });
    }
  }else{
    res.status(404).json({ message: 'course does not exist' })
  }
});

app.get('/users/purchasedCourses',authJwt, (req, res) => {
  // logic to view purchased courses
  const user = USERS.find( u => u.username === req.user.username)
  if(user){
    res.status(200).json({purchasedCourses:user.purchasedCourses})
  }else{
    res.status(403).json({ message: 'user does not exist' });
  }
});

const PORT = 3004;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});