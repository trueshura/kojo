const util = require('util');

module.exports = async function(data) {

    const {plant, logger} = this;
    logger.debug(`Data: ${util.inspect(data, {depth: null, colors: true})}`);

    throw new Error('Charlie method');
};
