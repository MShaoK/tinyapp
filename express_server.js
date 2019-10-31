const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const express = require("express");

const app = express();
const PORT = 8080; 

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    urls:urlDatabase,
    user_id:req.cookies.user_id,
    user: users[req.cookies.user_id]
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
    }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id ,
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
  }
  res.render("register", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (urlDatabase[req.params.shortURL.charAt('http') > 0]) {
    res.redirect(`http://${longURL}`);
  } else {
    res.redirect(longURL);
  }
});

app.get("/login", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: req.cookies.user_id,
    user: users[req.cookies.user_id]
  }
  res.render("login", templateVars)  

})





//---------------------------POST--------------------------------------



app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newLongURL;
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
      "password": req.body.password
    }
  }
  res.cookie("user_id", users[randomID].id);
  res.redirect("/urls");
});

app.post("/login", (req,res) => {
  for (let accounts in users) {
    const user = users[accounts];
    if ( user.email === req.body.email ) {
      if ( user.password === req.body.password) {
        res.cookie("user_id", user.id);
      } else {
        res.status(403).send("error code 403");
      }
    } else {
      res.status(403).send("error code 403");
    }
  }


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