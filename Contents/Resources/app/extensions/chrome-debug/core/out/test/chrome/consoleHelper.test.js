/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var assert = require('assert');
var testUtils = require('../testUtils');
var ConsoleHelper = require('../../src/chrome/consoleHelper');
suite('ConsoleHelper', function () {
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
    });
    function doAssert(message, expectedText, expectedIsError) {
        if (expectedIsError === void 0) { expectedIsError = false; }
        assert.deepEqual(ConsoleHelper.formatConsoleMessage(message), { text: expectedText, isError: expectedIsError });
    }
    suite('console.log()', function () {
        test('simple log', function () {
            doAssert(Console.makeLog('Hello'), 'Hello');
            doAssert(Console.makeLog('Hello', 123, 'world!'), 'Hello 123 world!');
        });
        test('basic format specifiers', function () {
            doAssert(Console.makeLog('%s, %d', 'test', 123), 'test, 123');
        });
        test('numeric format specifiers correctly', function () {
            doAssert(Console.makeLog('%d %i %f', 1.9, 324, 9.4), '1 324 9.4');
            doAssert(Console.makeLog('%d %i %f', -19, -32.5, -9.4), '-19 -33 -9.4');
            doAssert(Console.makeLog('%d %i %f', 'not', 'a', 'number'), 'NaN NaN NaN');
        });
        test('unmatched format specifiers', function () {
            doAssert(Console.makeLog('%s %s %s', 'test'), 'test %s %s');
            doAssert(Console.makeLog('%s %s end', 'test1', 'test2', 'test3'), 'test1 test2 end test3');
        });
        test('null/undefined cases', function () {
            doAssert(Console.makeLog('%s %s %s', null, undefined, 'test'), 'null undefined test');
            doAssert(Console.makeLog('test', null, undefined), 'test null undefined');
        });
        test('network error', function () {
            doAssert(Console.makeNetworkLog('neterror', 'myurl'), 'neterror (myurl)', true);
        });
        test('objects- waiting on VS Code bug 20343');
    });
    suite('console.assert()', function () {
        test("Prints params and doesn't resolve format specifiers", function () {
            doAssert(Console.makeAssert('Fail %s 123', 456), 'Assertion failed: Fail %s 123 456\n-  myFn @/script/a.js:4', true);
        });
    });
});
/**
 * Build the Chrome notifications objects for various console APIs.
 */
var Console;
(function (Console) {
    /**
     * Make a mock message of any type.
     * @param type - The type of the message
     * @param params - The list of parameters passed to the log function
     * @param overrideProps - An object of props that the message should have. The rest are filled in with defaults.
     */
    function makeMockMessage(type, params, overrideProps) {
        var message = {
            source: 'console-api',
            level: 'log',
            type: type,
            text: params[0],
            timestamp: Date.now(),
            line: 2,
            column: 13,
            url: 'file:///c:/page/script.js',
            executionContextId: 2,
            parameters: params.map(function (param) {
                var remoteObj = { type: typeof param, value: param };
                if (param === null) {
                    remoteObj.subtype = 'null';
                }
                return remoteObj;
            })
        };
        if (overrideProps) {
            for (var propName in overrideProps) {
                if (overrideProps.hasOwnProperty(propName)) {
                    message[propName] = overrideProps[propName];
                }
            }
        }
        return message;
    }
    function makeLog() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        return makeMockMessage('log', params);
    }
    Console.makeLog = makeLog;
    function makeAssert() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        var fakeStackTrace = {
            callFrames: [{ url: '/script/a.js', lineNumber: 4, functionName: 'myFn' }]
        };
        return makeMockMessage('assert', params, { level: 'error', stack: fakeStackTrace });
    }
    Console.makeAssert = makeAssert;
    function makeNetworkLog(text, url) {
        return makeMockMessage('log', [text], { source: 'network', url: url, level: 'error' });
    }
    Console.makeNetworkLog = makeNetworkLog;
})(Console || (Console = {}));

//# sourceMappingURL=consoleHelper.test.js.map
