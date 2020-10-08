/**
 *
 * @param {Logger} logger - @see logger.js
 * @param {Function} errorHandler
 * @private
 */

module.exports= (logger, errorHandler) => {
    const fOrigHandler=logger.error;
    logger.error= (...args) => {
        errorHandler(...args);
        fOrigHandler(...args);
    }
}