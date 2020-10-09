const {assert} = require('chai');
const sinon = require('sinon');
const Plant = require('./index');
const Logger = require('./lib/logger');
const errorWrapper=require('./lib/errorWrapper');
const pack = require('./package.json');

describe('Kojo', function() {
    describe('Plant', () => {

        const methodAcalledSpy = sinon.spy();
        const options = {
            subsDir: './test_plant/subscribers',
            modulesDir: './test_plant/modules'
        };
        let plant;

        before(async function() {
            plant = new Plant('test-plant', options, pack);
            await plant.ready();
            plant.set('config', 'config');
        });

        it('loads modules available to each other', async () => {
            plant.module('alpha').on('aCalled', methodAcalledSpy);
            const result = await plant.module('alpha').methodA([]);
            assert.equal(result, 'bravo');
        });

        it('lets modules to emit events', (done) => {
            assert.isTrue(methodAcalledSpy.calledOnce);
            done();
        });

        it('loads _config and extras', async () => {
            const config = await plant.module('alpha').methodB();
            assert.equal(config, 'config');
        });

        it('checks whether plant accessible inside methods (with 2 params)', async function() {
            plant.set('variable', 12);
            const result = await plant.module('charlie').methodA(3);
            assert.equal(result, 36);
        });

        it('checks exception logging (with 2 params)', async function() {
            try {
                await plant.module('charlie').methodA();
            } catch (error) {
                // Just to mark test passed. You should see the error logged
            }
        });

        it('should NOT call plant error handler', async () => {
            try {
                await plant.module('charlie').methodThrows();
            } catch (error) {
                assert.strictEqual(error.message, 'Charlie method');
            }
        });

        it('should set plant logger errorHandlers', async () => {
            plant.setErrorHandler(sinon.fake());
        });

        it('should use class method as handler', async () => {
            const handler=sinon.fake();
            class A{
                constructor(props) {
                    this._msg='this is ok'
                }
                errorHandler(err){
                    handler(this._msg);
                }
            }
            const a=new A();
            plant.setErrorHandler(a.errorHandler.bind(a));

            try {
                await plant.module('charlie').methodThrows();
            } catch (error) {
                assert.isOk(handler.calledOnce);
                assert.strictEqual(error.message, 'Charlie method');
                const [handlerParam]=handler.args[0];
                assert.strictEqual(handlerParam, 'this is ok');
            }
        });

        it('should call module error handler', async () => {
            const handler = sinon.fake();
            plant.setErrorHandler(handler);
            try {
                await plant.module('charlie').methodThrows();
            } catch (error) {
                assert.isOk(handler.calledOnce);
                assert.strictEqual(error.message, 'Charlie method');
            }
        });

        it('should call subscriber error handler', async () => {
            const handler = sinon.fake();
            plant.setErrorHandler(handler);
            try {
                plant.emit('test');
            } catch (error) {
                assert.isOk(handler.calledOnce);
                assert.strictEqual(error.message, 'subsC called');
            }
        });

        it('should change logger level', async () => {
            plant.changeLogLevel('error');
        });
    });

    describe('Logger', function() {
        it('should wrap error logger with additional handler', async () => {
            const errorHandler = sinon.fake();
            const logger = Logger('instanceName', 'moduleName', 'methodName');
            errorWrapper(logger, errorHandler);

            logger.error('test');

            assert.isOk(errorHandler.calledOnce);
        });
    });
});