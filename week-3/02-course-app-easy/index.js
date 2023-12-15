const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.json());
app.use(bodyParser.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminAuth = (req, res, next) => {
  const { username, password } = req.headers;

  const admin = ADMINS.find(a => a.username === username && a.password === password);
  // console.log(admin.username + " " + admin.password);
  if(admin){
    next();
  }else{
    res.status(403).json({"message":"Admin auth failed"})
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const { username, password } = req.headers;
  const existingUser = ADMINS.find(a => a.username ===  username)
  if(existingUser){
    res.status(403).json({"messaage":"admin already exists"})
  }else{
    ADMINS.push({ username, password });
    console.log(ADMINS);
    res.status(200).json({"message":"Admin created successfully"})
  }
});

app.post('/admin/login',adminAuth, (req, res) => {
  // logic to log in admin
  res.status(200).json({"message":"Logged in successfully"})
});

app.post('/admin/courses',adminAuth, (req, res) => {
  // logic to create a course
  const course = req.body;
  course.Id = Math.floor(Math.random() * 1000);
  COURSES.push(course)
  console.log(COURSES);
  res.status(200).json({ "message": 'Course created successfully', "courseId": course.Id})
});

app.put('/admin/courses/:courseId',adminAuth, (req, res) => {
  // logic to edit a course
  const id = parseInt(req.params.courseId);
  console.log(id);
  const course = COURSES.find(c => c.Id === id);
  if(course){
    Object.assign(course,req.body);
    res.status(200).json({"message":"Course updated successfully"})
  }else{
    res.status(404).json({"message":"Course not found"})
  }
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  res.status(200).json({"course":COURSES})
});

// User routes

userAuth = (req,res,next) => {
  const {username, password} = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password)
  if(user){
    next()
  }else{
    res.status(403).json({"message": "User Auth failed"})
  }
}

app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const {username, password} = req.headers;
  const user = USERS.find(u => u.username === username)
  if(user){
    res.status(403).json({"message": "User already exists"})
  }else{
    USERS.push({username, password})
    console.log(USERS);
    res.status(200).json({"message": "User successfully created!!!"})
  }
});

app.post('/users/login', userAuth,(req, res) => {
  // logic to log in user
  res.status(200).json({"message": "User successfully loggedIn!!!"})
});

app.get('/users/courses', userAuth,(req, res) => {
  // logic to list all courses
  res.status(200).json({"course":COURSES})
});

app.post('/users/courses/:courseId',userAuth, (req, res) => {
  // logic to purchase a course
  const id = parseInt(req.params.courseId);
  const course = COURSES.find(c => id === c.id && c.published);
  if(course){
    req.user.purchasedCourses.push(id)
    res.status(200).json({"message": "User successfully purchased course"})
  }else{
    res.status(404).json({"message": "course is not available"})
  }
});

app.get('/users/purchasedCourses', userAuth,(req, res) => {
  // logic to view purchased courses
  const purchasedCourseId = req.user.purchasedCourses;
  const purchasedCourse = []
  for(let i=0; i<purchasedCourseId.length;i++){
    const course = COURSES.find(c => c.Id === purchasedCourseId[i])

    if(course){
      purchasedCourse.push(course)
    }
  }
  res.status(200).json({courses: purchasedCourse})
});

const PORT = 3017
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
