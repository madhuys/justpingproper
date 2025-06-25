// api/Templates/index.js
const router = require("./route");
const Template = require("../../system/models/Template");
const TemplateComponent = require("../../system/models/TemplateComponent");
const TemplateButton = require("../../system/models/TemplateButton");
const TemplateMedia = require("../../system/models/TemplateMedia");
const TemplateProvider = require("../../system/models/TemplateProvider");

/**
 * Templates module exports
 *
 * Exposes router and model entities related to templates
 */
module.exports = {
    router,
    Template,
    TemplateComponent,
    TemplateButton,
    TemplateMedia,
    TemplateProvider,
};
