const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'user_id',
  keys: ["dunno"]
}));

app.set("view engine", "ejs");

const urlDatabase = {
  
};

const users = {};

app.listen(PORT);


//--------------------------Get----------------------------------

app.get("/", (req, res) => {//redirect to urls if logged in otherwise to login
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!findUser(req.session.user_id, users)) { // if cookie does not belong to users clear it
    res.clearCookie("user_id");
  }
  let templateVars = { //sends template vars to be filled out by render
    urls: urlsBelongsToUser(req.session.user_id, urlDatabase), //only loads urls that belong to user
    user_id:req.session.user_id, 
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
  
});

app.get("/urls/new", (req, res) => {
  
  if (!findUser(req.session.user_id, users)) {
    res.clearCookie("user_id");
  }
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  if (templateVars.user_id !== undefined) { // if logged in, able to access /urls/new else redirect to login
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!findUser(req.session.user_id, users)) {
    res.clearCookie("user_id");
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL].user) { //error message if someone who doesnt own this accesses it
    res.status(300).send("You do not own this url");
  }
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id ,
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (!findUser(req.session.user_id, users)) {
    res.clearCookie("user_id");
  }
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});

app.get("/u/:shortURL", (req, res) => { //redirects to the long url
  const redirectLongURL = urlDatabase[req.params.shortURL].longURL;
  
  res.redirect(redirectLongURL);
});

app.get("/login", (req, res) => { //login page
  if (!findUser(req.session.user_id, users)) {
    res.clearCookie("user_id");
  }
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);

});





//---------------------------POST--------------------------------------



app.post("/urls/new", (req, res) => { // generates the short url for user id, sets long url and who it belongs to
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    user: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => { 
  if (req.session.user_id === urlDatabase[req.params.shortURL].user) { //if user owns this url, delete from database
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].user) { //if user owns url, able to change it
    urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/logout", (req, res) => { //clears cookies and logs out
  res.clearCookie("user_id");
  res.redirect("/urls");
});
app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (req.body.email === "" || req.body.password === "" || emailLookup(users, req.body.email)) { // throws error if account is already made or empty params
    res.status(400).send("error code 400");
  } else {
    users[randomID] = {
      "id": randomID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password,10)
    };
  }
  req.session.user_id = users[randomID].id;
  res.redirect("/urls");
});

app.post("/login", (req,res) => { //checks login credentials
  let rightAccount = false;
  for (let accounts in users) {
    const user = users[accounts];
    if (user.email === req.body.email) {
      if (bcrypt.compareSync(req.body.password,user.password)) {//hash password
        req.session.user_id = user.id;
      }
      rightAccount = true;
    }
  }
  if (rightAccount === false) {
    res.status(403).send("error code 403");
  }
  res.redirect("/urls");
});

//--------------------------Functions---------------------------


function generateRandomString() {   //generates alphanumeric String
  let shortURL = "";
  let characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let urlLength = 6;
  for (let i = 0; i < urlLength; i++) {
    shortURL += characters.charAt(getRandomRange(0,35));
  }
  return shortURL;
}

function getRandomRange(min, max) { //random number between 2 values
  return Math.random() * (max - min) + min;
}

function findUser(user_id, users) { //returns boolean if user_id is in users
  for (let account_id in users) {
    if (users[account_id].id === user_id) {
      return true;
    }
  }
  return false;
}

function urlsBelongsToUser(user_id,urlDatabase) { //returns object of all urls belonging to user
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].user === user_id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}

function emailLookup(object, email) { //returns boolean of whether email is in object or not
  for (let accounts in object) {
    if (object[accounts]["email"] === email) {
      return true;
    }
  }
  return false;
}
