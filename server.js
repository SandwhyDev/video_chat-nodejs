const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { Issuer, Strategy } = require("openid-client");
const fs = require("fs");
const { ExpressPeerServer } = require("peer");
const path = require("path");

const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const opinions = {
  debug: true,
  port: 3030,
};
const isLoggedIn = (req, res, next) => {
  // console.log(req.session);

  if (!req.user) {
    res.redirect("/");
    return;
  }

  next();
};

app.use("/peer", ExpressPeerServer(server, opinions));
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
  done(null, user);
});

passport.deserializeUser((user, done) => {
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
    successRedirect: `/home`,
    failureRedirect: "/",
  })(req, res, next);
});

app.get(
  "/",
  (req, res, next) => {
    next();
  },
  passport.authenticate("oidc", { scope: "openid" })
);

app.get("/home", isLoggedIn, (req, res) => {
  // console.log(req.user.userinfo.sub);
  res.render("home", {
    user: req.user.userinfo.sub,
    token: req.user.tokenSet.id_token,
    post_logout: req.user.rahasia.post_logout_redirect_uris,
    allowed: true,
  });
});

app.get("/:room", isLoggedIn, (req, res) => {
  // console.log(req.user.userinfo.sub);
  res.render("room", {
    roomId: req.params.room,
    user: req.user.userinfo.sub,
    token: req.user.tokenSet.id_token,
    post_logout: req.user.rahasia.post_logout_redirect_uris,
  });
});

// app.get("/", (req, res) => {
//   // console.log(req.user.userinfo.sub);
//   res.render("test");
// });

const rooms = {};
const joinRequests = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName, stream) => {
    // Jika room belum memiliki host, maka user yang bergabung akan menjadi host
    if (!rooms[roomId]) {
      rooms[roomId] = { host: userName, participants: [] };
    }

    // Dapatkan informasi host untuk room saat ini
    const hostroom = rooms[roomId].host;

    // Tambahkan user ke daftar participants
    if (hostroom === userName) {
      rooms[roomId].participants.push({ id: userId, name: userName });
    }

    socket.join(roomId);
    socket.join(userId);
    socket.join(userName);

    setTimeout(() => {
      socket
        .to(roomId)
        .broadcast.emit(
          "user-connected",
          userId,
          userName,
          roomId,
          hostroom,
          stream
        );
    }, 1000);

    socket.on("send file", (file) => {
      const fileName = uuidv4() + "." + file.mimetype.split("/")[1];
      const fileData = Buffer.from(new Uint8Array(file.data));

      fs.writeFile(`./public/images/${fileName}`, fileData, async (err) => {
        if (err) {
          console.log(err);
          return;
        }

        console.log("File saved:");
      });
      io.to(userId).emit("gambar", fileName);
    });

    socket.on("message", (message, image) => {
      io.to(roomId).emit("createMessage", message, image, userName);
    });

    socket.on("delete file", (file) => {
      console.log(file);

      if (fs.existsSync(path.join(__dirname, `./public/images/${file}`))) {
        fs.unlinkSync(path.join(__dirname, `./public/images/${file}`));
      }
    });

    socket.on("ijin masuk", (message, userAllow, idUser) => {
      let participantUser = rooms[roomId].participants;

      if (message === true) {
        rooms[roomId].participants.push({ id: idUser, name: userAllow });
      }
      io.to(userAllow).emit("finale", message, userAllow, participantUser);
      socket.to(roomId).emit("participants", participantUser);
    });

    socket.on("ask-join", async (userId, userName) => {
      // Jika user belum meminta bergabung, maka simpan datanya
      if (!joinRequests[userId]) {
        joinRequests[userId] = true;

        // Kirim pesan ke host room
        await io.to(hostroom).emit("ijin host", userId, userName);
      }
    });

    socket.on("disconnect", () => {
      // Hapus user dari daftar participants
      rooms[roomId].participants = rooms[roomId].participants.filter(
        (participant) => participant.id !== userId
      );

      // Emit event user-disconnected ke semua user di room
      socket.to(roomId).broadcast.emit("user-disconnected", userId, userName);
    });
  });
});

server.listen(3030, () => {
  console.log("running on port 3030");
});
