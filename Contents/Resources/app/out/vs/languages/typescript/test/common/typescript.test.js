/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'assert', 'vs/languages/typescript/common/lib/typescriptServices', './features/utils', 'vs/languages/typescript/common/typescript.contribution'], function (require, exports, assert, ts, utils) {
    suite('TS - Mode', function () {
        test('Test parse "var watch;"', function () {
            var host = new utils.CompilerHost().add('file.ts', 'var watch;');
            var program = ts.createProgram(['file.ts'], { noLib: true }, host);
            program.getSemanticDiagnostics();
            assert.ok(!!program.getSourceFile('file.ts'));
        });
        test('Test parse "a.__proto__;"', function () {
            var host = new utils.CompilerHost().add('file.ts', 'a.__proto__');
            var program = ts.createProgram(['file.ts'], { noLib: true }, host);
            program.getSemanticDiagnostics();
            assert.ok(!!program.getSourceFile('file.ts'));
        });
        test('Test parse "var toString;"', function () {
            var host = new utils.CompilerHost().add('file.ts', 'var toString;');
            var program = ts.createProgram(['file.ts'], { noLib: true }, host);
            program.getSemanticDiagnostics();
            assert.ok(!!program.getSourceFile('file.ts'));
        });
    });
    suite('TypeScript - Language Service', function () {
        test('Test windows drive-letter filename', function () {
            var host = new utils.LanguageServiceHost().
                add('C:\\project\\stuff\\a.ts', 'export var v = 123;').
                add('C:\\project\\stuff\\b.ts', 'import a = require("./a");\nexport var b = a.v + 456;');
            var service = ts.createLanguageService(host, ts.createDocumentRegistry());
            var diag = service.getSemanticDiagnostics('C:\\project\\stuff\\b.ts');
            assert.equal(diag.length, 0);
        });
        // THIS will end-up in an endless loop
        test('Test UNC share filename', function () {
            var host = new utils.LanguageServiceHost().
                add('\\project\\stuff\\a.ts', 'export var v = 123;').
                add('\\project\\stuff\\b.ts', 'import a = require("./a");\nexport var b = a.v + 456;');
            var service = ts.createLanguageService(host, ts.createDocumentRegistry());
            var diag = service.getSemanticDiagnostics('\\project\\stuff\\b.ts');
            assert.equal(diag.length, 0);
        });
        // THIS will end-up in an endless loop
        test('Test unix filename', function () {
            var host = new utils.LanguageServiceHost().
                add('/api/project/stuff/a.ts', 'export var v = 123;').
                add('/api/project/stuff/b.ts', 'import a = require("./a");\nexport var b = a.v + 456;');
            var service = ts.createLanguageService(host, ts.createDocumentRegistry());
            var diag = service.getSemanticDiagnostics('/api/project/stuff/b.ts');
            assert.equal(diag.length, 0);
        });
        test('Test URL filename', function () {
            var host = new utils.LanguageServiceHost().
                add('http://localhost:9999/api/project/stuff/a.ts', 'export var v = 123;').
                add('http://localhost:9999/api/project/stuff/b.ts', 'import a = require("./a");\nexport var b = a.v + 456;');
            var service = ts.createLanguageService(host, ts.createDocumentRegistry());
            var diag = service.getSemanticDiagnostics('http://localhost:9999/api/project/stuff/b.ts');
            assert.equal(diag.length, 0);
        });
    });
});
//# sourceMappingURL=typescript.test.js.map