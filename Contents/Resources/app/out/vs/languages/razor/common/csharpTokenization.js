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
define(["require", "exports", 'vs/base/common/objects', 'vs/editor/common/modes', 'vs/languages/html/common/html', 'vs/languages/vsxml/common/vsxml', 'vs/editor/common/modes/abstractState', 'vs/editor/common/modes/abstractMode', 'vs/languages/razor/common/razorTokenTypes'], function (require, exports, objects, Modes, htmlMode, VSXML, abstractState_1, abstractMode_1, razorTokenTypes) {
    var htmlTokenTypes = htmlMode.htmlTokenTypes;
    var punctuations = '+-*%&|^~!=<>/?;:.,';
    var separators = '+-*/%&|^~!=<>(){}[]\"\'\\/?;:.,';
    var whitespace = '\t ';
    var brackets = (function () {
        var bracketsSource = [
            { tokenType: 'punctuation.bracket.cs', open: '{', close: '}', isElectric: true },
            { tokenType: 'punctuation.array.cs', open: '[', close: ']', isElectric: true },
            { tokenType: 'punctuation.parenthesis.cs', open: '(', close: ')', isElectric: true },
            { tokenType: 'punctuation.angle.cs', open: '<', close: '>', isElectric: false }
        ];
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
    var isKeyword = objects.createKeywordMatcher([
        'abstract', 'as', 'async', 'await', 'base', 'bool',
        'break', 'by', 'byte', 'case',
        'catch', 'char', 'checked', 'class',
        'const', 'continue', 'decimal', 'default',
        'delegate', 'do', 'double', 'descending',
        'explicit', 'event', 'extern', 'else',
        'enum', 'false', 'finally', 'fixed',
        'float', 'for', 'foreach', 'from',
        'goto', 'group', 'if', 'implicit',
        'in', 'int', 'interface', 'internal',
        'into', 'is', 'lock', 'long',
        'new', 'null', 'namespace', 'object',
        'operator', 'out', 'override', 'orderby',
        'params', 'private', 'protected', 'public',
        'readonly', 'ref', 'return', 'switch',
        'struct', 'sbyte', 'sealed', 'short',
        'sizeof', 'stackalloc', 'static', 'string',
        'select', 'this', 'throw', 'true',
        'try', 'typeof', 'uint', 'ulong',
        'unchecked', 'unsafe', 'ushort', 'using',
        'var', 'virtual', 'volatile', 'void',
        'while', 'where', 'yield',
        'model', 'inject' // Razor specific
    ]);
    var ispunctuation = function (character) {
        return punctuations.indexOf(character) > -1;
    };
    var CSState = (function (_super) {
        __extends(CSState, _super);
        function CSState(mode, name, parent) {
            _super.call(this, mode);
            this.name = name;
            this.parent = parent;
        }
        CSState.prototype.equals = function (other) {
            if (!_super.prototype.equals.call(this, other)) {
                return false;
            }
            var otherCSState = other;
            return (other instanceof CSState) && (this.getMode() === otherCSState.getMode()) && (this.name === otherCSState.name) && ((this.parent === null && otherCSState.parent === null) || (this.parent !== null && this.parent.equals(otherCSState.parent)));
        };
        CSState.prototype.tokenize = function (stream) {
            stream.setTokenRules(separators, whitespace);
            if (stream.skipWhitespace().length > 0) {
                return { type: '' };
            }
            return this.stateTokenize(stream);
        };
        CSState.prototype.stateTokenize = function (stream) {
            throw new Error('To be implemented');
        };
        return CSState;
    })(abstractState_1.AbstractState);
    exports.CSState = CSState;
    var CSString = (function (_super) {
        __extends(CSString, _super);
        function CSString(mode, parent, punctuation) {
            _super.call(this, mode, 'string', parent);
            this.isAtBeginning = true;
            this.punctuation = punctuation;
        }
        CSString.prototype.makeClone = function () {
            return new CSString(this.getMode(), this.parent ? this.parent.clone() : null, this.punctuation);
        };
        CSString.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) && this.punctuation === other.punctuation;
        };
        CSString.prototype.tokenize = function (stream) {
            var readChars = this.isAtBeginning ? 1 : 0;
            this.isAtBeginning = false;
            while (!stream.eos()) {
                var c = stream.next();
                if (c === '\\') {
                    if (readChars === 0) {
                        if (stream.eos()) {
                            return { type: 'string.escape.cs' };
                        }
                        else {
                            stream.next();
                            if (stream.eos()) {
                                return { type: 'string.escape.cs', nextState: this.parent };
                            }
                            else {
                                return { type: 'string.escape.cs' };
                            }
                        }
                    }
                    else {
                        stream.goBack(1);
                        return { type: 'string.cs' };
                    }
                }
                else if (c === this.punctuation) {
                    break;
                }
                readChars += 1;
            }
            return { type: 'string.cs', nextState: this.parent };
        };
        return CSString;
    })(CSState);
    var CSVerbatimString = (function (_super) {
        __extends(CSVerbatimString, _super);
        function CSVerbatimString(mode, parent) {
            _super.call(this, mode, 'verbatimstring', parent);
        }
        CSVerbatimString.prototype.makeClone = function () {
            return new CSVerbatimString(this.getMode(), this.parent ? this.parent.clone() : null);
        };
        CSVerbatimString.prototype.tokenize = function (stream) {
            while (!stream.eos()) {
                var token = stream.next();
                if (token === '"') {
                    if (!stream.eos() && stream.peek() === '"') {
                        stream.next();
                    }
                    else {
                        return { type: 'string.cs', nextState: this.parent };
                    }
                }
            }
            return { type: 'string.cs' };
        };
        return CSVerbatimString;
    })(CSState);
    var CSNumber = (function (_super) {
        __extends(CSNumber, _super);
        function CSNumber(mode, parent, firstDigit) {
            _super.call(this, mode, 'number', parent);
            this.firstDigit = firstDigit;
        }
        CSNumber.prototype.makeClone = function () {
            return new CSNumber(this.getMode(), this.parent ? this.parent.clone() : null, this.firstDigit);
        };
        CSNumber.prototype.tokenize = function (stream) {
            var character = this.firstDigit;
            var base = 10, isDecimal = false, isExponent = false;
            if (character === '0' && !stream.eos()) {
                character = stream.peek();
                if (character === 'x') {
                    base = 16;
                }
                else if (character === '.') {
                    base = 10;
                }
                else {
                    return { type: 'number.cs', nextState: this.parent };
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
                    else if (character.toLowerCase() === 'e' && !isExponent) {
                        isExponent = true;
                        stream.next();
                        if (!stream.eos() && stream.peek() === '-') {
                            stream.next();
                        }
                    }
                    else if (character.toLowerCase() === 'f' || character.toLowerCase() === 'd') {
                        stream.next();
                        break;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            var tokenType = 'number';
            if (base === 16) {
                tokenType += '.hex';
            }
            return { type: tokenType + '.cs', nextState: this.parent };
        };
        return CSNumber;
    })(CSState);
    // the multi line comment
    var CSComment = (function (_super) {
        __extends(CSComment, _super);
        function CSComment(mode, parent, commentChar) {
            _super.call(this, mode, 'comment', parent);
            this.commentChar = commentChar;
        }
        CSComment.prototype.makeClone = function () {
            return new CSComment(this.getMode(), this.parent ? this.parent.clone() : null, this.commentChar);
        };
        CSComment.prototype.tokenize = function (stream) {
            while (!stream.eos()) {
                var token = stream.next();
                if (token === '*' && !stream.eos() && !stream.peekWhitespace() && stream.peek() === this.commentChar) {
                    stream.next();
                    return { type: 'comment.cs', nextState: this.parent };
                }
            }
            return { type: 'comment.cs' };
        };
        return CSComment;
    })(CSState);
    exports.CSComment = CSComment;
    var CSStatement = (function (_super) {
        __extends(CSStatement, _super);
        function CSStatement(mode, parent, level, plevel, razorMode, expression, firstToken, firstTokenWasKeyword) {
            _super.call(this, mode, 'expression', parent);
            this.level = level;
            this.plevel = plevel;
            this.razorMode = razorMode;
            this.expression = expression;
            this.vsState = new VSXML.VSXMLExpression(mode, null);
            this.firstToken = firstToken;
            this.firstTokenWasKeyword = firstTokenWasKeyword;
        }
        CSStatement.prototype.setVSXMLState = function (newVSState) {
            this.vsState = newVSState;
        };
        CSStatement.prototype.makeClone = function () {
            var st = new CSStatement(this.getMode(), this.parent ? this.parent.clone() : null, this.level, this.plevel, this.razorMode, this.expression, this.firstToken, this.firstTokenWasKeyword);
            if (this.vsState !== null) {
                st.setVSXMLState(this.vsState.clone());
            }
            return st;
        };
        CSStatement.prototype.equals = function (other) {
            return _super.prototype.equals.call(this, other) &&
                (other instanceof CSStatement) &&
                ((this.vsState === null && other.vsState === null) ||
                    (this.vsState !== null && this.vsState.equals(other.vsState)));
        };
        CSStatement.prototype.stateTokenize = function (stream) {
            if (abstractMode_1.isDigit(stream.peek(), 10)) {
                this.firstToken = false;
                return { nextState: new CSNumber(this.getMode(), this, stream.next()) };
            }
            var token = stream.nextToken();
            var acceptNestedModes = !this.firstTokenWasKeyword;
            var nextStateAtEnd = (this.level <= 0 && this.plevel <= 0 && stream.eos() ? this.parent : undefined);
            if (stream.eos()) {
                this.firstTokenWasKeyword = false; // Set this for the state starting on the next line.
            }
            if (isKeyword(token)) {
                if (this.level <= 0) {
                    this.expression = false;
                }
                if (this.firstToken) {
                    this.firstTokenWasKeyword = true;
                }
                return { type: 'keyword.cs' };
            }
            this.firstToken = false;
            if (this.razorMode && token === '<' && acceptNestedModes) {
                if (!stream.eos() && /[_:!\/\w]/.test(stream.peek())) {
                    return { nextState: new CSSimpleHTML(this.getMode(), this, htmlMode.States.Content) };
                }
            }
            // exit expressions on anything that doesn't look like part of the same expression
            if (this.razorMode && this.expression && this.level <= 0 && this.plevel <= 0 && !stream.eos()) {
                if (!/^(\.|\[|\(|\{\w+)$/.test(stream.peekToken())) {
                    nextStateAtEnd = this.parent;
                }
            }
            if (token === '/') {
                if (!stream.eos() && !stream.peekWhitespace()) {
                    switch (stream.peekToken()) {
                        case '/':
                            stream.nextToken();
                            if (!stream.eos() && stream.peekToken() === '/') {
                                stream.nextToken();
                                if (stream.eos()) {
                                    return {
                                        type: 'comment.vs'
                                    };
                                }
                                if (stream.peekToken() !== '/') {
                                    return {
                                        type: 'comment.vs',
                                        nextState: new VSXML.VSXMLEmbeddedState(this.getMode(), this.vsState, this)
                                    };
                                }
                            }
                            stream.advanceToEOS();
                            return { type: 'comment.cs' };
                        case '*':
                            stream.nextToken();
                            return { nextState: new CSComment(this.getMode(), this, '/') };
                    }
                }
                return { type: 'punctuation.cs', nextState: nextStateAtEnd };
            }
            if (token === '@') {
                if (!stream.eos()) {
                    switch (stream.peekToken()) {
                        case '"':
                            stream.nextToken();
                            return { nextState: new CSVerbatimString(this.getMode(), this) };
                        case '*':
                            stream.nextToken();
                            return { nextState: new CSComment(this.getMode(), this, '@') };
                    }
                }
            }
            if (/@?\w+/.test(token)) {
                return { type: 'ident.cs', nextState: nextStateAtEnd };
            }
            if (token === '"' || token === '\'') {
                return { nextState: new CSString(this.getMode(), this, token) };
            }
            if (brackets.stringIsBracket(token)) {
                var tr = {
                    bracket: brackets.bracketTypeFromString(token),
                    type: brackets.tokenTypeFromString(token),
                    nextState: nextStateAtEnd
                };
                if (this.razorMode) {
                    if (token === '{') {
                        this.expression = false; // whenever we enter a block, we exit expression mode
                        this.level++;
                        if (this.level === 1) {
                            tr.type = razorTokenTypes.EMBED_CS;
                            tr.nextState = undefined;
                        }
                    }
                    if (token === '}') {
                        this.level--;
                        if (this.level <= 0) {
                            tr.type = razorTokenTypes.EMBED_CS;
                            tr.nextState = this.parent;
                        }
                    }
                    if (this.expression) {
                        if (token === '(') {
                            this.plevel++;
                            if (this.plevel === 1) {
                                tr.type = razorTokenTypes.EMBED_CS;
                                tr.nextState = undefined;
                            }
                        }
                        if (token === ')') {
                            this.plevel--;
                            if (this.expression && this.plevel <= 0) {
                                tr.type = razorTokenTypes.EMBED_CS;
                                tr.nextState = this.parent;
                            }
                        }
                        if (token === '[') {
                            this.plevel++;
                            tr.nextState = undefined;
                        }
                        if (token === ']') {
                            this.plevel--;
                        }
                    }
                }
                return tr;
            }
            if (ispunctuation(token)) {
                return { type: 'punctuation.cs', nextState: nextStateAtEnd };
            }
            if (this.razorMode && this.expression && this.plevel <= 0) {
                return { type: '', nextState: this.parent };
            }
            return { type: '', nextState: nextStateAtEnd };
        };
        return CSStatement;
    })(CSState);
    exports.CSStatement = CSStatement;
    // list of empty elements - for performance reasons we won't open a bracket for them
    var emptyElements = ['area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param'];
    // this state always returns to parent state if it leaves a html tag
    var CSSimpleHTML = (function (_super) {
        __extends(CSSimpleHTML, _super);
        function CSSimpleHTML(mode, parent, state) {
            _super.call(this, mode, 'number', parent);
            this.state = state;
        }
        CSSimpleHTML.prototype.makeClone = function () {
            return new CSSimpleHTML(this.getMode(), this.parent ? this.parent.clone() : null, this.state);
        };
        CSSimpleHTML.prototype.nextName = function (stream) {
            return stream.advanceIfRegExp(/^[_:\w][_:\w-.\d]*/);
        };
        CSSimpleHTML.prototype.nextAttrValue = function (stream) {
            return stream.advanceIfRegExp(/^('|').*?\1/);
        };
        CSSimpleHTML.prototype.tokenize = function (stream) {
            switch (this.state) {
                case htmlMode.States.WithinComment:
                    if (stream.advanceUntil('-->', false).length > 0) {
                        return { type: htmlTokenTypes.COMMENT };
                    }
                    if (stream.advanceIfString('-->').length > 0) {
                        this.state = htmlMode.States.Content;
                        return { type: htmlTokenTypes.DELIM_COMMENT, bracket: Modes.Bracket.Close, nextState: this.parent };
                    }
                    break;
                case htmlMode.States.WithinDoctype:
                    if (stream.advanceUntil('>', false).length > 0) {
                        return { type: htmlTokenTypes.DOCTYPE };
                    }
                    if (stream.advanceIfString('>').length > 0) {
                        this.state = htmlMode.States.Content;
                        return { type: htmlTokenTypes.DELIM_DOCTYPE, bracket: Modes.Bracket.Close, nextState: this.parent };
                    }
                    break;
                case htmlMode.States.Content:
                    if (stream.advanceIfString('!--').length > 0) {
                        this.state = htmlMode.States.WithinComment;
                        return { type: htmlTokenTypes.DELIM_COMMENT, bracket: Modes.Bracket.Open };
                    }
                    if (stream.advanceIfRegExp(/!DOCTYPE/i).length > 0) {
                        this.state = htmlMode.States.WithinDoctype;
                        return { type: htmlTokenTypes.DELIM_DOCTYPE, bracket: Modes.Bracket.Open };
                    }
                    if (stream.advanceIfString('/').length > 0) {
                        this.state = htmlMode.States.OpeningEndTag;
                        return { type: htmlTokenTypes.DELIM_END, bracket: Modes.Bracket.Open };
                    }
                    this.state = htmlMode.States.OpeningStartTag;
                    return { type: htmlTokenTypes.DELIM_START, bracket: Modes.Bracket.Open };
                case htmlMode.States.OpeningEndTag:
                    var tagName = this.nextName(stream);
                    if (tagName.length > 0) {
                        return {
                            type: htmlTokenTypes.getTag(tagName),
                            bracket: emptyElements.indexOf(tagName) !== -1 ? -1 : Modes.Bracket.Close
                        };
                    }
                    if (stream.advanceIfString('>').length > 0) {
                        this.state = htmlMode.States.Content;
                        return { type: htmlTokenTypes.DELIM_END, bracket: Modes.Bracket.Close, nextState: this.parent };
                    }
                    stream.advanceUntil('>', false);
                    return { type: '' };
                case htmlMode.States.OpeningStartTag:
                    var tagName = this.nextName(stream);
                    if (tagName.length > 0) {
                        this.state = htmlMode.States.WithinTag;
                        return {
                            type: htmlTokenTypes.getTag(tagName),
                            bracket: emptyElements.indexOf(tagName) !== -1 ? -1 : Modes.Bracket.Open
                        };
                    }
                    break;
                case htmlMode.States.WithinTag:
                    if (stream.skipWhitespace().length > 0) {
                        return { type: '' };
                    }
                    var name = this.nextName(stream);
                    if (name.length > 0) {
                        this.state = htmlMode.States.AttributeName;
                        return { type: htmlTokenTypes.ATTRIB_NAME };
                    }
                    if (stream.advanceIfRegExp(/^\/?>/).length > 0) {
                        this.state = htmlMode.States.Content;
                        return { type: htmlTokenTypes.DELIM_START, bracket: Modes.Bracket.Close, nextState: this.parent };
                    }
                    stream.next();
                    return { type: '' };
                case htmlMode.States.AttributeName:
                    if (stream.skipWhitespace().length > 0 || stream.eos()) {
                        return { type: '' };
                    }
                    if (stream.peek() === '=') {
                        stream.next();
                        this.state = htmlMode.States.AttributeValue;
                        return { type: '' };
                    }
                    this.state = htmlMode.States.WithinTag;
                    return this.tokenize(stream); // no advance yet - jump to WithinTag
                case htmlMode.States.AttributeValue:
                    if (stream.skipWhitespace().length > 0 || stream.eos()) {
                        return { type: '' };
                    }
                    var value = this.nextAttrValue(stream);
                    if (value.length > 0) {
                        this.state = htmlMode.States.WithinTag;
                        return { type: htmlTokenTypes.ATTRIB_VALUE };
                    }
                    this.state = htmlMode.States.WithinTag;
                    return this.tokenize(stream); // no advance yet - jump to WithinTag
            }
            stream.next();
            this.state = htmlMode.States.Content;
            return { type: '', nextState: this.parent };
        };
        return CSSimpleHTML;
    })(CSState);
});
//# sourceMappingURL=csharpTokenization.js.map