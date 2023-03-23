const { PrismaClient } = require("@prisma/client");

const RoomModels = new PrismaClient().room;

const createRoom = async (room_id, category) => {
  const findRoom = await RoomModels.findUnique({
    where: {
      room_id: room_id,
    },
  });

  if (findRoom) {
    // console.log("room sudah ada");
    return false;
  }

  await RoomModels.create({
    data: {
      room_id: room_id,
      category: category,
    },
  })
    .then((res) => {
      // console.log("berhasil " + res);
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  createRoom,
  RoomModels,
};
