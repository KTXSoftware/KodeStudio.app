/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var assert = require('assert');
var mockery = require('mockery');
var testUtils = require('../../testUtils');
var MODULE_UNDER_TEST = '../../../adapter/sourceMaps/pathUtilities';
suite('PathUtilities', function () {
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
        // Set up mockery
        mockery.enable({ warnOnReplace: false, useCleanCache: true });
        mockery.registerAllowables([MODULE_UNDER_TEST, 'url', 'http', 'fs', '../../webkit/utilities']);
        testUtils.win32Mocks();
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
        mockery.deregisterAll();
        mockery.disable();
    });
    suite('getAbsSourceRoot()', function () {
        var GEN_PATH = 'c:\\project\\webroot\\code\\script.js';
        var GEN_URL = 'http://localhost:8080/code/script.js';
        var ABS_SOURCEROOT = 'c:\\project\\src';
        var WEBROOT = 'c:/project/webroot';
        var getAbsSourceRoot;
        setup(function () {
            getAbsSourceRoot = require(MODULE_UNDER_TEST).getAbsSourceRoot;
        });
        test('handles file:/// sourceRoot', function () {
            assert.equal(getAbsSourceRoot('file:///' + ABS_SOURCEROOT, WEBROOT, GEN_PATH), 'c:\\project\\src');
        });
        test('handles /src style sourceRoot', function () {
            assert.equal(getAbsSourceRoot('/src', WEBROOT, GEN_PATH), 'c:\\project\\webroot\\src');
        });
        test('handles ../../src style sourceRoot', function () {
            assert.equal(getAbsSourceRoot('../../src', WEBROOT, GEN_PATH), 'c:\\project\\src');
        });
        test('handles src style sourceRoot', function () {
            assert.equal(getAbsSourceRoot('src', WEBROOT, GEN_PATH), 'c:\\project\\webroot\\code\\src');
        });
        test('handles runtime script not on disk', function () {
            assert.equal(getAbsSourceRoot('../src', WEBROOT, GEN_URL), 'c:\\project\\webroot\\src');
        });
        test('when no sourceRoot specified and runtime script is on disk, uses the runtime script dirname', function () {
            assert.equal(getAbsSourceRoot('', WEBROOT, GEN_PATH), 'c:\\project\\webroot\\code');
        });
        test('when no sourceRoot specified and runtime script is not on disk, uses the runtime script dirname', function () {
            assert.equal(getAbsSourceRoot('', WEBROOT, GEN_URL), 'c:\\project\\webroot\\code');
        });
        test('strips a trailing slash and uses lowercase drive letter', function () {
            assert.equal(getAbsSourceRoot('/src/', WEBROOT, 'C:' + GEN_PATH.substr(1)), 'c:\\project\\webroot\\src');
        });
    });
});

//# sourceMappingURL=pathUtilities.test.js.map
