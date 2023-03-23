const greeting = document.getElementById("greeting");
greeting.innerText = `halo ${user.split("@")[0]}  `;

function BuatRoomVideoConference() {
  window.location.href = `/video/${generateOTP(9)}`;
}

function BuatRoomWalkieTalkie() {
  window.location.href = `/walkie-talkie/${generateOTP(9)}`;
}

function BuatRoomChat() {
  window.location.href = `/chat/${generateOTP(9)}`;
}

const JoinRoom = async () => {
  let numberRoom = prompt("room number ");
  if (numberRoom === null) {
    return false;
  }

  console.log(numberRoom);

  showModal(numberRoom);
};

const JoinRoomWalkieTalkie = async () => {
  let numberRoom = prompt("room number ");
  if (numberRoom === null) {
    return false;
  }

  window.location.href = `/walkie-talkie/${numberRoom}`;
};

// Menampilkan modal
const showModal = (numberRoom) => {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("modal").style.display = "block";

  console.log(true);

  // Menutup modal setelah 5 detik
  setTimeout(function () {
    hideModal();
  }, 5000);

  window.location.href = `/${numberRoom}`;
};

// Menyembunyikan modal
function hideModal() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("modal").style.display = "none";
}

// GENERATE OTP
function generateOTP(length) {
  // Membuat list karakter yang akan digunakan untuk OTP
  const chars = "0123456789";

  let otp = "";
  for (let i = 0; i < length; i++) {
    // Memilih karakter secara acak dari list
    const randomIndex = Math.floor(Math.random() * chars.length);
    const randomChar = chars[randomIndex];
    // Menambahkan karakter ke OTP
    otp += randomChar;
    // Menambahkan tanda '-' setelah tiga karakter
    if ((i + 1) % 3 === 0 && i < length - 1) {
      otp += "-";
    }
  }
  return otp;
}

function addDash(input) {
  return input.replace(/(.{3})/g, "$1-").replace(/-$/, "");
}

fetch("http://localhost:3030/api/room/read")
  .then((response) => response.json())
  .then((data) =>
    data.query.map((e) => {
      const roomChat = document.querySelector(".room_chat");

      // Create the <a> element and set its attributes
      const roomLink = document.createElement("a");
      roomLink.href = `/chat/${e.room_id}`;
      roomLink.textContent = e.room_id;

      // Append the <a> element to the room_chat element
      roomChat.appendChild(roomLink);
    })
  )
  .catch((error) => console.error(error));

console.log("test");
