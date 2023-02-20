const socket = io("/");
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const userStatus = {
  microphone: false,
  mute: false,
  username: user,
  online: false,
};

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

// const user = prompt("Enter your name");
// const user = uuid();

socket.on("send", function (data) {
  // console.log("suaraaaa ", data);
  var audio = new Audio(data);
  audio.play();
});

var peer = new Peer({
  host: "127.0.0.1",
  port: 3030,
  path: "/peerjs",
  config: {
    iceServers: [
      { url: "stun:stun01.sipphone.com" },
      { url: "stun:stun.ekiga.net" },
      { url: "stun:stunserver.org" },
      { url: "stun:stun.softjoys.com" },
      { url: "stun:stun.voiparound.com" },
      { url: "stun:stun.voipbuster.com" },
      { url: "stun:stun.voipstunt.com" },
      { url: "stun:stun.voxgratia.org" },
      { url: "stun:stun.xten.com" },
      {
        url: "turn:192.158.29.39:3478?transport=udp",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        username: "28224511:1379330808",
      },
      {
        url: "turn:192.158.29.39:3478?transport=tcp",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        username: "28224511:1379330808",
      },
    ],
  },

  debug: 3,
});

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    var madiaRecorder = new MediaRecorder(stream);
    madiaRecorder.start();

    var audioChunks = [];

    madiaRecorder.addEventListener("dataavailable", function (event) {
      audioChunks.push(event.data);
    });

    madiaRecorder.addEventListener("stop", function () {
      var audioBlob = new Blob(audioChunks);

      audioChunks = [];

      var fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
      fileReader.onloadend = function () {
        if (!userStatus.microphone) return;

        var base64String = fileReader.result;
        // console.log("test suara", user, base64String);
        socket.emit("voice", base64String);
      };

      madiaRecorder.start();

      setTimeout(function () {
        madiaRecorder.stop();
      }, 1000);
    });

    setTimeout(function () {
      madiaRecorder.stop();
    }, 1000);

    // console.log("testtttt", stream);

    peer.on("call", (call) => {
      console.log("someone call me", call);
      call.answer(stream);
      const video = document.createElement("video");
      video.setAttribute("id", user);
      video.setAttribute("controls", true);

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  // console.log("I call someone" + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.setAttribute("id", userId);
  video.setAttribute("controls", true);

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  // console.log("my id is" + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();

    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let image = document.getElementById("image-container");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
    image.innerHTML = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    console.log("mati");
    userStatus.microphone = false;

    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    console.log("nyala");
    userStatus.microphone = true;

    // socket.emit("voice", uuid());

    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, image, userName) => {
  console.log(userName, message);

  if (!image === null) {
    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> 
        ${userName === user ? "me" : userName}</span> </b>
        <div class="image_message"></div>
        <span>${message} </span>
    </div>`;
  } else {
    {
      userName === user
        ? (messages.innerHTML =
            messages.innerHTML +
            `<div class="message" id="chatsaya">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "saya" : userName
        }</span> </b>
        <span>${message} </span>
    </div>`)
        : (messages.innerHTML =
            messages.innerHTML +
            `<div class="message">
      <b><i class="far fa-user-circle"></i> <span> ${
        userName === user ? "me" : userName
      }</span> </b>
      <span>${message} </span>
  </div>`);
    }
  }
});

// socket.on("keluar", (data) => {
//   console.log(`user ${data} keluar`);
//   // console.log(videoGrid.children.namedItem(data).remove());
//   // videoGrid.children.item(1).remove();
//   videoGrid.children.namedItem(data).remove();
// });
