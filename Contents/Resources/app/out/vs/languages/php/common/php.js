/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", 'vs/base/common/objects', 'vs/editor/common/modes/supports', 'vs/editor/common/modes', 'vs/editor/common/modes/abstractMode', 'vs/editor/common/modes/abstractState', 'vs/editor/common/services/modeService', 'vs/editor/common/modes/supports/onEnter', 'vs/platform/instantiation/common/instantiation', 'vs/platform/thread/common/thread'], function (require, exports, objects, supports, Modes, abstractMode_1, abstractState_1, modeService_1, onEnter_1, instantiation_1, thread_1) {
    var bracketsSource = [
        { tokenType: 'delimiter.bracket.php', open: '{', close: '}', isElectric: true },
        { tokenType: 'delimiter.array.php', open: '[', close: ']', isElectric: true },
        { tokenType: 'delimiter.parenthesis.php', open: '(', close: ')', isElectric: true }
    ];
    var brackets = (function () {
        var MAP = Object.create(null);
        for (var i = 0; i < bracketsSource.length; i++) {
            var bracket = bracketsSource[i];
            MAP[bracket.open] = {
                tokenType: bracket.tokenType,
                bracketType: Modes.Bracket.Open
            };
            MAP[bracket.close] = {
                tokenType: bracket.tokenType,
                bracketType: Modes.Bracket.Close
            };
        }
        return {
            stringIsBracket: function (text) {
                return !!MAP[text];
            },
            tokenTypeFromString: function (text) {
                return MAP[text].tokenType;
            },
            bracketTypeFromString: function (text) {
                return MAP[text].bracketType;
            }
        };
    })();
    var delimiters = '+-*%&|^~!=<>(){}[]/?;:.,@';
    var separators = '+-*/%&|^~!=<>(){}[]"\'\\/?;:.,#';
    var whitespace = '\t ';
    var isKeyword = objects.createKeywordMatcher([
        'abstract', 'and', 'array', 'as', 'break',
        'callable', 'case', 'catch', 'cfunction', 'class', 'clone',
        'const', 'continue', 'declare', 'default', 'do',
        'else', 'elseif', 'enddeclare', 'endfor', 'endforeach',
        'endif', 'endswitch', 'endwhile', 'extends', 'false', 'final',
        'for', 'foreach', 'function', 'global', 'goto',
        'if', 'implements', 'interface', 'instanceof', 'insteadof',
        'namespace', 'new', 'null', 'object', 'old_function', 'or', 'private',
        'protected', 'public', 'resource', 'static', 'switch', 'throw', 'trait',
        'try', 'true', 'use', 'var', 'while', 'xor',
        'die', 'echo', 'empty', 'exit', 'eval',
        'include', 'include_once', 'isset', 'list', 'require',
        'require_once', 'return', 'print', 'unset',
        '__construct'
    ]);
    var isCompileTimeConstant = objects.createKeywordMatcher([
        '__CLASS__',
        '__DIR__',
        '__FILE__',
        '__LINE__',
        '__NAMESPACE__',
        '__METHOD__',
        '__FUNCTION__',
        '__TRAIT__'
    ]);
    var isPreDefinedVariable = objects.createKeywordMatcher([
        '$GLOBALS',
        '$_SERVER',
        '$_GET',
        '$_POST',
        '$_FILES',
        '$_REQUEST',
        '$_SESSION',
        '$_ENV',
        '$_COOKIE',
        '$php_errormsg',
        '$HTTP_RAW_POST_DATA',
        '$http_response_header',
        '$argc',
        '$argv'
    ]);
    var isDelimiter = function (character) {
        return delimiters.indexOf(character) > -1;
    };
    var isVariable = function (character) {
        return (character[0] === '$');
    };
    var PHPState = (function (_super) {
        __extends(PHPState, _super);
        function PHPState(mode, name, parent, whitespaceTokenType) {
            if (whitespaceTokenType === void 0) { whitespaceTokenType = ''; }
            _super.call(this, mode);
            this.name = name;
            this.parent = parent;
            this.whitespaceTokenType = whitespaceTokenType;
        }
        PHPState.prototype.equals = function (other) {
            if (other instanceof PHPState) {
                return (_super.prototype.equals.call(this, other) &&
                    this.name === other.name &&
                    this.whitespaceTokenType === other.whitespaceTokenType &&
                    abstractState_1.AbstractState.safeEquals(this.parent, other.parent));
            }
            return false;
        };
        PHPState.prototype.tokenize = function (stream) {
            stream.setTokenRules(separators, whitespace);
            if (stream.skipWhitespace().length > 0) {
                return { type: this.whitespaceTokenType };
            }
            return this.stateTokenize(stream);
        };
        PHPState.prototype.stateTokenize = function (stream) {
            throw new Error('To be implemented');
        };
        return PHPState;
    })(abstractState_1.AbstractState);
    exports.PHPState = PHPState;
    var PHPString = (function (_super) {
        __extends(PHPString, _super);
        function PHPString(mode, parent, delimiter, isAtBeginning) {
            if (isAtBeginning === void 0) { isAtBeginning = true; }
            _super.call(this, mode, 'string', parent, 'string.php');
            this.delimiter = delimiter;
            this.isAtBeginning = isAtBeginning;
        }
        PHPString.prototype.makeClone = function () {
            return new PHPString(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent), this.delimiter, this.isAtBeginning);
        };
        PHPString.prototype.equals = function (other) {
            if (other instanceof PHPString) {
                return (_super.prototype.equals.call(this, other) &&
                    this.delimiter === other.delimiter &&
                    this.isAtBeginning === other.isAtBeginning);
            }
            return false;
        };
        PHPString.prototype.tokenize = function (stream) {
            var readChars = this.isAtBeginning ? 1 : 0;
            this.isAtBeginning = false;
            while (!stream.eos()) {
                var c = stream.next();
                if (c === '\\') {
                    if (readChars === 0) {
                        if (stream.eos()) {
                            return { type: 'string.php', nextState: this.parent };
                        }
                        else {
                            stream.next();
                        }
                    }
                    else {
                        stream.goBack(1);
                        return { type: 'string.php' };
                    }
                }
                else if (c === this.delimiter) {
                    return { type: 'string.php', nextState: this.parent };
                }
                readChars += 1;
            }
            return { type: 'string.php' };
        };
        return PHPString;
    })(PHPState);
    exports.PHPString = PHPString;
    var PHPNumber = (function (_super) {
        __extends(PHPNumber, _super);
        function PHPNumber(mode, parent, firstDigit) {
            _super.call(this, mode, 'number', parent);
            this.firstDigit = firstDigit;
        }
        PHPNumber.prototype.makeClone = function () {
            return new PHPNumber(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent), this.firstDigit);
        };
        PHPNumber.prototype.equals = function (other) {
            if (other instanceof PHPNumber) {
                return (_super.prototype.equals.call(this, other) &&
                    this.firstDigit === other.firstDigit);
            }
            return false;
        };
        PHPNumber.prototype.tokenize = function (stream) {
            var character = this.firstDigit;
            var base = 10, isDecimal = false, isExponent = false;
            if (character === '0' && !stream.eos()) {
                character = stream.peek();
                if (character.toLowerCase() === 'x') {
                    base = 16;
                }
                else if (character.toLowerCase() === 'b') {
                    base = 2;
                }
                else if (character === '.') {
                    base = 10;
                }
                else if (abstractMode_1.isDigit(character, 8)) {
                    base = 8;
                }
                else {
                    return { type: 'number.php', nextState: this.parent };
                }
                stream.next();
            }
            while (!stream.eos()) {
                character = stream.peek();
                if (abstractMode_1.isDigit(character, base)) {
                    stream.next();
                }
                else if (base === 10) {
                    if (character === '.' && !isExponent && !isDecimal) {
                        isDecimal = true;
                        stream.next();
                    }
                    else if (character === 'e' && !isExponent) {
                        isExponent = true;
                        stream.next();
                        if (!stream.eos() && stream.peek() === '-') {
                            stream.next();
                        }
                    }
                    else {
                        break;
                    }
                }
                else if (base === 8 && abstractMode_1.isDigit(character, 10)) {
                    base = 10;
                    stream.next();
                }
                else {
                    break;
                }
            }
            var tokenType = 'number';
            if (base === 16)
                tokenType += '.hex';
            else if (base === 8)
                tokenType += '.octal';
            else if (base === 2)
                tokenType += '.binary';
            return { type: tokenType + '.php', nextState: this.parent };
        };
        return PHPNumber;
    })(PHPState);
    exports.PHPNumber = PHPNumber;
    var PHPLineComment = (function (_super) {
        __extends(PHPLineComment, _super);
        function PHPLineComment(mode, parent) {
            _super.call(this, mode, 'comment', parent, 'comment.php');
        }
        PHPLineComment.prototype.makeClone = function () {
            return new PHPDocComment(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent));
        };
        PHPLineComment.prototype.equals = function (other) {
            if (other instanceof PHPLineComment) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        PHPLineComment.prototype.tokenize = function (stream) {
            while (!stream.eos()) {
                var token = stream.next();
                if (token === '?' && !stream.eos() && stream.peek() === '>') {
                    stream.goBack(1);
                    return { type: 'comment.php', nextState: this.parent };
                }
            }
            return { type: 'comment.php', nextState: this.parent };
        };
        return PHPLineComment;
    })(PHPState);
    exports.PHPLineComment = PHPLineComment;
    var PHPDocComment = (function (_super) {
        __extends(PHPDocComment, _super);
        function PHPDocComment(mode, parent) {
            _super.call(this, mode, 'comment', parent, 'comment.php');
        }
        PHPDocComment.prototype.makeClone = function () {
            return new PHPDocComment(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent));
        };
        PHPDocComment.prototype.equals = function (other) {
            if (other instanceof PHPDocComment) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        PHPDocComment.prototype.tokenize = function (stream) {
            while (!stream.eos()) {
                var token = stream.next();
                if (token === '*' && !stream.eos() && !stream.peekWhitespace() && stream.peek() === '/') {
                    stream.next();
                    return { type: 'comment.php', nextState: this.parent };
                }
            }
            return { type: 'comment.php' };
        };
        return PHPDocComment;
    })(PHPState);
    exports.PHPDocComment = PHPDocComment;
    var PHPStatement = (function (_super) {
        __extends(PHPStatement, _super);
        function PHPStatement(mode, parent) {
            _super.call(this, mode, 'expression', parent);
        }
        PHPStatement.prototype.makeClone = function () {
            return new PHPStatement(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent));
        };
        PHPStatement.prototype.equals = function (other) {
            if (other instanceof PHPStatement) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        PHPStatement.prototype.stateTokenize = function (stream) {
            if (abstractMode_1.isDigit(stream.peek(), 10)) {
                return { nextState: new PHPNumber(this.getMode(), this, stream.next()) };
            }
            if (stream.advanceIfString('?>').length) {
                return { type: 'metatag.php', nextState: this.parent, bracket: Modes.Bracket.Close };
            }
            var token = stream.nextToken();
            if (isKeyword(token.toString().toLowerCase())) {
                return { type: 'keyword.php' };
            }
            else if (isCompileTimeConstant(token)) {
                return { type: 'constant.php' };
            }
            else if (isPreDefinedVariable(token)) {
                return { type: 'variable.predefined.php' };
            }
            else if (isVariable(token)) {
                return { type: 'variable.php' };
            }
            else if (token === '/') {
                if (!stream.eos() && !stream.peekWhitespace()) {
                    switch (stream.peekToken()) {
                        case '/':
                            return { nextState: new PHPLineComment(this.getMode(), this) };
                        case '*':
                            stream.nextToken();
                            return { nextState: new PHPDocComment(this.getMode(), this) };
                    }
                }
            }
            else if (token === '#') {
                return { nextState: new PHPLineComment(this.getMode(), this) };
            }
            else if (token === '"' || token === '\'') {
                return { nextState: new PHPString(this.getMode(), this, token) };
            }
            else if (brackets.stringIsBracket(token)) {
                return {
                    bracket: brackets.bracketTypeFromString(token),
                    type: brackets.tokenTypeFromString(token)
                };
            }
            else if (isDelimiter(token)) {
                return { type: 'delimiter.php' };
            }
            return { type: '' };
        };
        return PHPStatement;
    })(PHPState);
    exports.PHPStatement = PHPStatement;
    var PHPPlain = (function (_super) {
        __extends(PHPPlain, _super);
        function PHPPlain(mode, parent) {
            _super.call(this, mode, 'plain', parent);
        }
        PHPPlain.prototype.makeClone = function () {
            return new PHPPlain(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent));
        };
        PHPPlain.prototype.equals = function (other) {
            if (other instanceof PHPPlain) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        PHPPlain.prototype.stateTokenize = function (stream) {
            if (stream.advanceIfStringCaseInsensitive('<?php').length ||
                stream.advanceIfString('<?=').length || stream.advanceIfString('<%=').length ||
                stream.advanceIfString('<?').length || stream.advanceIfString('<%').length) {
                return {
                    type: 'metatag.php',
                    nextState: new PHPStatement(this.getMode(), new PHPEnterHTMLState(this.getMode(), this.parent)),
                    bracket: Modes.Bracket.Open
                };
            }
            stream.next();
            return { type: '' };
        };
        return PHPPlain;
    })(PHPState);
    exports.PHPPlain = PHPPlain;
    var PHPEnterHTMLState = (function (_super) {
        __extends(PHPEnterHTMLState, _super);
        function PHPEnterHTMLState(mode, parent) {
            _super.call(this, mode, 'enterHTML', parent);
        }
        PHPEnterHTMLState.prototype.makeClone = function () {
            return new PHPEnterHTMLState(this.getMode(), abstractState_1.AbstractState.safeClone(this.parent));
        };
        PHPEnterHTMLState.prototype.equals = function (other) {
            if (other instanceof PHPEnterHTMLState) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        return PHPEnterHTMLState;
    })(PHPState);
    exports.PHPEnterHTMLState = PHPEnterHTMLState;
    var PHPMode = (function (_super) {
        __extends(PHPMode, _super);
        function PHPMode(descriptor, instantiationService, threadService, modeService) {
            var _this = this;
            _super.call(this, descriptor, instantiationService, threadService);
            this.modeService = modeService;
            this.electricCharacterSupport = new supports.BracketElectricCharacterSupport(this, { brackets: bracketsSource });
            this.tokenizationSupport = new supports.TokenizationSupport(this, this, true, false);
            this.characterPairSupport = new supports.CharacterPairSupport(this, {
                autoClosingPairs: [{ open: '{', close: '}', notIn: ['string.php'] },
                    { open: '[', close: ']', notIn: ['string.php'] },
                    { open: '(', close: ')', notIn: ['string.php'] },
                    { open: '"', close: '"', notIn: ['string.php'] },
                    { open: '\'', close: '\'', notIn: ['string.php'] }
                ] });
            this.suggestSupport = new supports.SuggestSupport(this, {
                triggerCharacters: ['.', ':', '$'],
                excludeTokens: ['comment'],
                suggest: function (resource, position) { return _this.suggest(resource, position); } });
            this.onEnterSupport = new onEnter_1.OnEnterSupport(this.getId(), {
                brackets: [
                    { open: '(', close: ')' },
                    { open: '{', close: '}' },
                    { open: '[', close: ']' }
                ]
            });
        }
        PHPMode.prototype.asyncCtor = function () {
            return this.modeService.getOrCreateMode('text/html');
        };
        PHPMode.prototype.getInitialState = function () {
            // Because AbstractMode doesn't allow the initial state to immediately enter a nested
            // mode, we will enter a nested mode ourselves
            var htmlMode = this.modeService.getMode('text/html');
            var htmlState = htmlMode.tokenizationSupport.getInitialState();
            htmlState.setStateData(new PHPEnterHTMLState(this, null));
            return htmlState;
        };
        PHPMode.prototype.enterNestedMode = function (state) {
            return state instanceof PHPEnterHTMLState;
        };
        PHPMode.prototype.getNestedModeInitialState = function (myState) {
            // Recall previous HTML state, that was saved in .parent, and carried over by the PHP states
            // Also, prevent a .clone() endless loop by clearing the .parent pointer
            // (the result will have its stateData point to myState)
            var result = myState.parent;
            myState.parent = null;
            return {
                state: result,
                missingModePromise: null
            };
        };
        PHPMode.prototype.getLeavingNestedModeData = function (line, state) {
            // Leave HTML if <? is found on a line
            var match = /<\?/i.exec(line);
            if (match !== null) {
                return {
                    nestedModeBuffer: line.substring(0, match.index),
                    bufferAfterNestedMode: line.substring(match.index),
                    stateAfterNestedMode: new PHPPlain(this, null)
                };
            }
            return null;
        };
        PHPMode.prototype.onReturningFromNestedMode = function (myStateAfterNestedMode, lastNestedModeState) {
            // Record in .parent the last HTML state before we entered into PHP
            // The PHP states will take care of passing .parent along
            // such that when we enter HTML again, we can recover the HTML state from .parent
            myStateAfterNestedMode.parent = lastNestedModeState;
        };
        PHPMode.prototype.getCommentsConfiguration = function () {
            return { lineCommentTokens: ['//', '#'], blockCommentStartToken: '/*', blockCommentEndToken: '*/' };
        };
        PHPMode.prototype.getWordDefinition = function () {
            return PHPMode.WORD_DEFINITION;
        };
        PHPMode.WORD_DEFINITION = abstractMode_1.createWordRegExp('$-');
        PHPMode = __decorate([
            __param(1, instantiation_1.IInstantiationService),
            __param(2, thread_1.IThreadService),
            __param(3, modeService_1.IModeService)
        ], PHPMode);
        return PHPMode;
    })(abstractMode_1.AbstractMode);
    exports.PHPMode = PHPMode;
});
//# sourceMappingURL=php.js.map