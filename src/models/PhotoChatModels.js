const { PrismaClient } = require("@prisma/client");

const PhotoChatModels = new PrismaClient().photoChat;

module.exports = PhotoChatModels;
