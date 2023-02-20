const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const helmet = require("helmet");
const { Issuer, Strategy } = require("openid-client");

const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};
const isLoggedIn = (req, res, next) => {
  // console.log(req.session);

  if (!req.user) {
    res.redirect("/");
    return;
  }

  next();
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

//Helmet midddleware
// app.use(helmet());

//Passport Middlewares
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  // console.log("-----------------------------");
  // console.log("serialize user");
  // console.log(user);
  // console.log("-----------------------------");
  done(null, user);
});

passport.deserializeUser((user, done) => {
  // console.log("-----------------------------");
  // console.log("deserialize user");
  // console.log(user);
  // console.log("-----------------------------");
  done(null, user);
});

Issuer.discover("http://localhost:9000/oidc").then(function (oidcIssuer) {
  var client = new oidcIssuer.Client({
    client_id: "Zu72QiCTlzAogmqCSr_-P",
    client_secret:
      "aykcnCVE8YqtkrPGBrGrgTu87M3kB0sCT1-cirm-CYLvN9a-6_FevnAYHmYSSnw7nd8t9KzWbXKKid9lrdVQiw",
    grant_types: ["refresh_token", "authorization_code"],
    redirect_uris: ["http://localhost:3030/login/callback"],
    response_types: ["code"],
    post_logout_redirect_uris: ["http://localhost:3030"],
  });

  passport.use(
    "oidc",
    new Strategy(
      { client, passReqToCallback: true },
      (req, tokenSet, userinfo, done) => {
        // console.log("tokenSet", tokenSet);
        // console.log("userinfo", userinfo);

        const result = {
          tokenSet: tokenSet,
          userinfo: userinfo,
          rahasia: client,
        };
        req.session.tokenSet = tokenSet;
        req.session.userinfo = userinfo;
        req.session.rahasia = client;

        return done(null, result);
      }
    )
  );
});

app.get("/login/callback", (req, res, next) => {
  passport.authenticate("oidc", {
    successRedirect: `/${uuidv4()}`,
    failureRedirect: "/",
  })(req, res, next);
});

app.get(
  "/",
  (req, res, next) => {
    console.log("-----------------------------");
    console.log("Login Handler Started");
    next();
  },
  passport.authenticate("oidc", { scope: "openid" })
);

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

app.get("/:room", isLoggedIn, (req, res) => {
  // console.log(req.user.userinfo.sub);
  res.render("room", {
    roomId: req.params.room,
    user: req.user.userinfo.sub,
    token: req.user.tokenSet.id_token,
    post_logout: req.user.rahasia.post_logout_redirect_uris,
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(userId);

    socket.join(roomId);

    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);

    socket.on("message", (message, image) => {
      io.to(roomId).emit("createMessage", message, image, userName);
    });

    socket.on("voice", function (data) {
      var newData = data.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];

      // console.log("voice ", newData);
      socket.broadcast.to(roomId).emit("send", newData);
    });
  });

  // socket.on("disconnect", function () {
  //   console.log("user keluar" + userId);

  //   io.to(roomId).emit("keluar", userId);
  // });
});

server.listen(3030, () => {
  console.log("running on port 3030");
});
