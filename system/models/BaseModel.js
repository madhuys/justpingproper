// system/models/BaseModel.js
const { Model } = require("objection");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

class BaseModel extends Model {
    $beforeInsert() {
        // Generate UUID for id if not provided
        this.id = this.id || uuidv4();

        // Set timestamps
        const now = new Date().toISOString();
        this.created_at = now;
        this.updated_at = now;
    }

    $beforeUpdate() {
        this.updated_at = new Date().toISOString();
    }

    static get useLimitInFirst() {
        return true;
    }

    static async findById(id) {
        try {
            return await this.query().findById(id);
        } catch (error) {
            logger.error(`Error finding ${this.name} by ID:`, error);
            throw error;
        }
    }

    static async findOne(filters) {
        try {
            return await this.query().where(filters).first();
        } catch (error) {
            logger.error(`Error finding ${this.name}:`, error);
            throw error;
        }
    }

    static async findAll(filters = {}) {
        try {
            return await this.query().where(filters);
        } catch (error) {
            logger.error(`Error finding all ${this.name}:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;
