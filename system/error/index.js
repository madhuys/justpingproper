/**
 * @swagger
 * definitions:
 *   Error:
 *     type: object
 *     properties:
 *       statusCode:
 *         type: integer
 *       error:
 *         type: string
 *       message:
 *         type: string
 *   ErrorWithSuccess:
 *     type: object
 *     properties:
 *       statusCode:
 *         type: integer
 *       error:
 *         type: string
 *       message:
 *         type: string
 *       success:
 *         type: boolean
 */

module.exports = class bverror {
    // eslint-disable-next-line camelcase
    static process_error(e) {
        if (e.response) {
            return e.response.data;
        }
        if (e.request) {
            return e.request;
        }
        return e.message;
    }
};