// api/Broadcast/index.js
const router = require("./route");
const Broadcast = require("../../system/models/Broadcast");
const BroadcastMessage = require("../../system/models/BroadcastMessage");
const service = require("./service");

module.exports = {
    router,
    Broadcast,
    BroadcastMessage,
    service,
};
