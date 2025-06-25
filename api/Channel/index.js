// api/Channel/index.js
const routes = require("./route");
const Channel = require("../../system/models/Channel");
const BusinessChannel = require("../../system/models/BusinessChannel");

module.exports = {
    routes,
    Channel,
    BusinessChannel,
};
