const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const express = require("express");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; 

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  
};

const users = {};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!findUser(req.cookies.user_id, users)){
    res.clearCookie("user_id")
  }

  if (req.cookies.user_id === undefined) {
    res.body = "You are not logged in!";
  }
  let templateVars = {
    urls: urlsBelongsToUser(req.cookies.user_id, urlDatabase),
    user_id:req.cookies.user_id,
    user: users[req.cookies.user_id]
    }
  res.render("urls_index", templateVars);
  
});

app.get("/urls/new", (req, res) => {
  if (!findUser(req.cookies.user_id, users)){
    res.clearCookie("user_id")
  };
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
    }
  if (templateVars.user_id !== undefined) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/register");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!findUser(req.cookies.user_id, users)){
    res.clearCookie("user_id")
  };
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id ,
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  }
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (!findUser(req.cookies.user_id, users)){
    res.clearCookie("user_id")
  };
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
  }
  res.render("register", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // if (!findUser(req.cookies.user_id, users)){
  //   res.clearCookie("user_id")
  // };
  console.log(shortURL);
  const redirectLongURL = urlDatabase[req.params.shortURL].longURL;
  // if (urlDatabase[req.params.shortURL.charAt('http') > 0]) {
  //   res.redirect(`http://${redirectLongURL}`);
  // } else {
    res.redirect(redirectLongURL);
  // }
});

app.get("/login", (req, res) => {
  console.log(users);
  if (!findUser(req.cookies.user_id, users)){
    res.clearCookie("user_id")
  };
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
  }
  res.render("login", templateVars)  

})





//---------------------------POST--------------------------------------



app.post("/urls/new", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    user: req.cookies.user_id
  }
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].user) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].user){
    urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  }
  console.log(urlDatabase);
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});
app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  if (req.body.email === "" || req.body.password === "" || emailLookup(users, req.body.email)) {
    res.status(400).send("error code 400");
  } else {
    users[randomID] = {
      "id": randomID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password,10)
    }
    console.log(users[randomID]);
  }
  res.cookie("user_id", users[randomID].id);
  console.log(users, "user");
  res.redirect("/urls");
});

app.post("/login", (req,res) => {
  let rightAccount = false;
  for (let accounts in users) {
    const user = users[accounts];
    if ( user.email === req.body.email ) {
      if (bcrypt.compareSync(req.body.password,user.password)) {
        res.cookie("user_id", user.id);
        console.log(user);
      }
      rightAccount = true;
    } 
  }
  if (rightAccount === false) {
    res.status(403).send("error code 403");
  }
  console.log(users);

  // if ( emailLookup(users, req.body.email) ) {
  //   if ( users["id"]['password'] === req.body.password) {
  //     if (req.body.user_id) {
  //       res.status(400).send("error code 400");
  //     } else {
  //       res.cookie("user_id", users[accounts]);
  //     }
  //   }
  // }
  res.redirect("/urls");
})

//--------------------------Functions---------------------------


function generateRandomString() {
  let shortURL = "";
  let characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let urlLength = 6;
  for (let i = 0; i < urlLength; i++) {
    shortURL += characters.charAt(getRandomRange(0,35));
  }
  return shortURL;
}

function getRandomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function emailLookup(object, email){
  for( let accounts in object ) {
    if (object[accounts]["email"] === email) {
      return true;
    }
  }
  return false;
}

function findUser(user_id, users) {
  for (let account_id in users) {
    if (users[account_id].id === user_id) {
      return true;
    }
  }
  return false;
}

function urlsBelongsToUser(user_id,urlDatabase) {
  let userUrls = {};
  for (let url in urlDatabase) {
    if ( urlDatabase[url].user === user_id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}