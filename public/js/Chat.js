var socket = io();

socket.on("connect", () => {
  socket.emit("join-room-chat", ROOM_ID, user, ROOM_CATEGORY);
});

// display initial user count when the first user joins the room
socket.on("init-user-count", function (usercount) {
  $(".user").text(usercount);
});

socket.on("user", (msg) => {
  $(".user").text(msg);
});

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let foto = $("#image-container");
let messages = document.querySelector(".messages");
let imageTest = document.querySelector("#photo");
const imageimage = $("#photo");
var sendFoto = "";

function batalSendImage(filename) {
  socket.emit("delete file", filename);
  foto.empty();
  sendFoto = "";
}

imageimage.on("change", () => {
  const file = imageimage[0].files[0];
  let filename = URL.createObjectURL(file);

  const reader = new FileReader();

  reader.readAsArrayBuffer(file);

  reader.onload = () => {
    socket.emit("send file", {
      name: file.name,
      data: reader.result,
      size: file.size,
      mimetype: file.type,
    });
  };

  socket.on("gambar", (file) => {
    console.log(file);
    sendFoto = file;

    const image = $("<img>").attr(
      "src",
      `http://localhost:3030/images/${file}`
    );

    const BatalSend = `<p class="batal-send-image" onclick="batalSendImage('${file}')">X</p>`;

    foto.html(image).append(BatalSend);
  });
});

send.addEventListener("click", async (e) => {
  if (text.value.length !== 0 && sendFoto != null) {
    socket.emit("message", text.value, sendFoto, ROOM_ID);

    // console.log(foto);
    text.value = await "";
    await foto.empty();
    sendFoto = await "";
  } else if (text.value.length === 0 && sendFoto === null) {
    return false;
  } else if (sendFoto.length != 0 && text.value.length === 0) {
    console.log(sendFoto.length);
    socket.emit("message", text.value, sendFoto, ROOM_ID);
    // console.log("test foto doang");
    await foto.empty();

    sendFoto = await "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value, sendFoto);
    text.value = "";

    foto.removeAttr("src");
  } else if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);

    text.value = "";
  }
});

socket.on("sendMessage", (message, sendFoto, userName) => {
  console.log({
    user: user,
    message: message,
    photo: sendFoto,
  });

  const data = {
    user: user,
    message: message,
    room_id: ROOM_ID,
  };

  fetch("http://localhost:3030/api/chat/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => console.log())
    .catch((error) => console.error(error));

  //   console.log(userName, message.length);
  //   console.log("foto ", sendFoto);

  if (sendFoto.length != 0 && message.length != 0) {
    // console.log("test foto dan text");

    {
      userName === user
        ? (messages.innerHTML =
            messages.innerHTML +
            `<div class="message" id="chatsaya">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <div class="image_message">
             <img src="http://localhost:3030/images/${sendFoto}" alt="Girl in a jacket" >
             </div>

        <span>${message} </span>
    </div>`)
        : (messages.innerHTML =
            messages.innerHTML +
            `<div class="message">
      <b><i class="far fa-user-circle"></i> <span> ${
        userName === user ? "me" : userName
      }</span> </b>
      <div class="image_message">
           <img src="http://localhost:3030/images/${sendFoto}" alt="Girl in a jacket" >
           </div>

      <span>${message} </span>
  </div>`);
    }
    return;
  } else if (sendFoto.length != 0 && message.length === 0) {
    console.log("test foto doang");
    {
      userName === user
        ? (messages.innerHTML =
            messages.innerHTML +
            `<div class="message" id="chatsaya">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <div class="image_message">
             <img src="http://localhost:3030/images/${sendFoto}" alt="Girl in a jacket" >
             </div>

    </div>`)
        : (messages.innerHTML =
            messages.innerHTML +
            `<div class="message">
      <b><i class="far fa-user-circle"></i> <span> ${
        userName === user ? "me" : userName
      }</span> </b>
      <div class="image_message">
           <img src="http://localhost:3030/images/${sendFoto}" alt="Girl in a jacket" >
           </div>

  </div>`);
    }
    return;
  } else {
    {
      userName === user
        ? (messages.innerHTML =
            messages.innerHTML +
            `<div class="message" id="chatsaya">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
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
    return;
  }
});

const dataRead = {
  filter: {
    room_id: ROOM_ID,
  },
};

fetch("http://localhost:3030/api/chat/read", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(dataRead),
})
  .then((response) => response.json())
  .then((data) =>
    data.query.map((e) => {
      {
        e.user === user
          ? (messages.innerHTML =
              messages.innerHTML +
              `<div class="message" id="chatsaya">
          <b><i class="far fa-user-circle"></i> <span> ${
            e.user === user ? "me" : e.user
          }</span> </b>
          <span>${e.message}</span>
      </div>`)
          : (messages.innerHTML =
              messages.innerHTML +
              `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          e.user === user ? "me" : e.user
        }</span> </b>
        <span>${e.message} </span>
    </div>`);
      }
      return;
    })
  )
  .catch((error) => console.error(error));
