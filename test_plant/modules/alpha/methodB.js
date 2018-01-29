module.exports = async function () {

    const {plant, logger} = this;

    const config = plant.get('config');
    logger.debug(`called`);
    return config;
};
