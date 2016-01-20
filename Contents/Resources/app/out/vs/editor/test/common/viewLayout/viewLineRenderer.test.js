/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'assert', 'vs/editor/common/viewLayout/viewLineRenderer'], function (require, exports, assert, viewLineRenderer_1) {
    suite('viewLineRenderer.renderLine', function () {
        function createPart(startIndex, type) {
            return {
                startIndex: startIndex,
                type: type
            };
        }
        function assertCharacterReplacement(lineContent, tabSize, expected, expectedCharOffsetInPart) {
            var _actual = viewLineRenderer_1.renderLine({
                lineContent: lineContent,
                tabSize: tabSize,
                stopRenderingLineAfter: -1,
                renderWhitespace: false,
                parts: [createPart(0, '')]
            });
            assert.equal(_actual.output.join(''), '<span><span class="token ">' + expected + '</span></span>');
            assert.deepEqual(_actual.charOffsetInPart, expectedCharOffsetInPart);
        }
        test('replaces spaces', function () {
            assertCharacterReplacement(' ', 4, '&nbsp;', [0, 1]);
            assertCharacterReplacement('  ', 4, '&nbsp;&nbsp;', [0, 1, 2]);
            assertCharacterReplacement('a  b', 4, 'a&nbsp;&nbsp;b', [0, 1, 2, 3, 4]);
        });
        test('escapes HTML markup', function () {
            assertCharacterReplacement('a<b', 4, 'a&lt;b', [0, 1, 2, 3]);
            assertCharacterReplacement('a>b', 4, 'a&gt;b', [0, 1, 2, 3]);
            assertCharacterReplacement('a&b', 4, 'a&amp;b', [0, 1, 2, 3]);
        });
        test('replaces some bad characters', function () {
            assertCharacterReplacement('a\0b', 4, 'a&#00;b', [0, 1, 2, 3]);
            assertCharacterReplacement('a' + String.fromCharCode(65279) + 'b', 4, 'a\ufffdb', [0, 1, 2, 3]);
            assertCharacterReplacement('a\u2028b', 4, 'a\ufffdb', [0, 1, 2, 3]);
            assertCharacterReplacement('a\rb', 4, 'a&#8203b', [0, 1, 2, 3]);
        });
        test('handles tabs', function () {
            assertCharacterReplacement('\t', 4, '&nbsp;&nbsp;&nbsp;&nbsp;', [0, 4]);
            assertCharacterReplacement('x\t', 4, 'x&nbsp;&nbsp;&nbsp;', [0, 1, 4]);
            assertCharacterReplacement('xx\t', 4, 'xx&nbsp;&nbsp;', [0, 1, 2, 4]);
            assertCharacterReplacement('xxx\t', 4, 'xxx&nbsp;', [0, 1, 2, 3, 4]);
            assertCharacterReplacement('xxxx\t', 4, 'xxxx&nbsp;&nbsp;&nbsp;&nbsp;', [0, 1, 2, 3, 4, 8]);
        });
        function assertParts(lineContent, tabSize, parts, expected, expectedCharOffsetInPart) {
            var _actual = viewLineRenderer_1.renderLine({
                lineContent: lineContent,
                tabSize: tabSize,
                stopRenderingLineAfter: -1,
                renderWhitespace: false,
                parts: parts
            });
            assert.equal(_actual.output.join(''), '<span>' + expected + '</span>');
            assert.deepEqual(_actual.charOffsetInPart, expectedCharOffsetInPart);
        }
        test('empty line', function () {
            assertParts('', 4, [], '<span>&nbsp;</span>', []);
        });
        test('uses part type', function () {
            assertParts('x', 4, [createPart(0, 'y')], '<span class="token y">x</span>', [0, 1]);
            assertParts('x', 4, [createPart(0, 'aAbBzZ0123456789-cC')], '<span class="token aAbBzZ0123456789-cC">x</span>', [0, 1]);
            assertParts('x', 4, [createPart(0, '"~!@#$%^&*()\'')], '<span class="token              ">x</span>', [0, 1]);
        });
        test('two parts', function () {
            assertParts('xy', 4, [createPart(0, 'a'), createPart(1, 'b')], '<span class="token a">x</span><span class="token b">y</span>', [0, 0, 1]);
            assertParts('xyz', 4, [createPart(0, 'a'), createPart(1, 'b')], '<span class="token a">x</span><span class="token b">yz</span>', [0, 0, 1, 2]);
            assertParts('xyz', 4, [createPart(0, 'a'), createPart(2, 'b')], '<span class="token a">xy</span><span class="token b">z</span>', [0, 1, 0, 1]);
        });
        test('overflow', function () {
            var _actual = viewLineRenderer_1.renderLine({
                lineContent: 'Hello world!',
                parts: [
                    createPart(0, '0'),
                    createPart(1, '1'),
                    createPart(2, '2'),
                    createPart(3, '3'),
                    createPart(4, '4'),
                    createPart(5, '5'),
                    createPart(6, '6'),
                    createPart(7, '7'),
                    createPart(8, '8'),
                    createPart(9, '9'),
                    createPart(10, '10'),
                    createPart(11, '11'),
                ],
                tabSize: 4,
                stopRenderingLineAfter: 6,
                renderWhitespace: true,
            });
            var expectedOutput = [
                '<span class="token 0">H</span>',
                '<span class="token 1">e</span>',
                '<span class="token 2">l</span>',
                '<span class="token 3">l</span>',
                '<span class="token 4">o</span>',
                '<span class="token 5">&nbsp;&hellip;</span>'
            ].join('');
            assert.equal(_actual.output.join(''), '<span>' + expectedOutput + '</span>');
            assert.deepEqual(_actual.charOffsetInPart, [
                0,
                0,
                0,
                0,
                0,
                1
            ]);
        });
        test('typical line', function () {
            var lineText = '\t    export class Game { // http://test.com     ';
            var lineParts = [
                createPart(0, 'block meta ts leading whitespace'),
                createPart(5, 'block declaration meta modifier object storage ts'),
                createPart(11, 'block declaration meta object ts'),
                createPart(12, 'block declaration meta object storage type ts'),
                createPart(17, 'block declaration meta object ts'),
                createPart(18, 'block class declaration entity meta name object ts'),
                createPart(22, 'block declaration meta object ts'),
                createPart(23, 'delimiter curly typescript'),
                createPart(24, 'block body declaration meta object ts'),
                createPart(25, 'block body comment declaration line meta object ts'),
                createPart(28, 'block body comment declaration line meta object ts detected-link'),
                createPart(43, 'block body comment declaration line meta object ts trailing whitespace'),
            ];
            var expectedOutput = [
                '<span class="token block meta ts leading whitespace">&rarr;&nbsp;&nbsp;&nbsp;&middot;&middot;&middot;&middot;</span>',
                '<span class="token block declaration meta modifier object storage ts">export</span>',
                '<span class="token block declaration meta object ts">&nbsp;</span>',
                '<span class="token block declaration meta object storage type ts">class</span>',
                '<span class="token block declaration meta object ts">&nbsp;</span>',
                '<span class="token block class declaration entity meta name object ts">Game</span>',
                '<span class="token block declaration meta object ts">&nbsp;</span>',
                '<span class="token delimiter curly typescript">{</span>',
                '<span class="token block body declaration meta object ts">&nbsp;</span>',
                '<span class="token block body comment declaration line meta object ts">//&nbsp;</span>',
                '<span class="token block body comment declaration line meta object ts detected-link">http://test.com</span>',
                '<span class="token block body comment declaration line meta object ts trailing whitespace">&middot;&middot;&middot;&middot;&middot;</span>'
            ].join('');
            var expectedOffsetsArr = [
                [0, 4, 5, 6, 7],
                [0, 1, 2, 3, 4, 5],
                [0],
                [0, 1, 2, 3, 4],
                [0],
                [0, 1, 2, 3],
                [0],
                [0],
                [0],
                [0, 1, 2],
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                [0, 1, 2, 3, 4, 5],
            ];
            var expectedOffsets = expectedOffsetsArr.reduce(function (prev, curr) { return prev.concat(curr); }, []);
            var _actual = viewLineRenderer_1.renderLine({
                lineContent: lineText,
                tabSize: 4,
                stopRenderingLineAfter: -1,
                renderWhitespace: true,
                parts: lineParts
            });
            assert.equal(_actual.output.join(''), '<span>' + expectedOutput + '</span>');
            assert.deepEqual(_actual.charOffsetInPart, expectedOffsets);
        });
    });
});
//# sourceMappingURL=viewLineRenderer.test.js.map