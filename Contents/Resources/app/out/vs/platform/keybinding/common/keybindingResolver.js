/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/platform', 'vs/platform/keybinding/common/keybindingService', 'vs/base/common/keyCodes'], function (require, exports, defaultPlatform, keybindingService_1, keyCodes_1) {
    var KeybindingResolver = (function () {
        function KeybindingResolver(defaultKeybindings, overrides, shouldWarnOnConflict) {
            if (shouldWarnOnConflict === void 0) { shouldWarnOnConflict = true; }
            defaultKeybindings = defaultKeybindings.slice(0).sort(sorter);
            this._defaultKeybindings = defaultKeybindings;
            this._shouldWarnOnConflict = shouldWarnOnConflict;
            this._defaultBoundCommands = Object.create(null);
            for (var i = 0, len = defaultKeybindings.length; i < len; i++) {
                this._defaultBoundCommands[defaultKeybindings[i].command] = true;
            }
            this._map = Object.create(null);
            this._lookupMap = Object.create(null);
            this._lookupMapUnreachable = Object.create(null);
            this._chords = Object.create(null);
            var defaultKeybindingsCount = defaultKeybindings.length;
            var allKeybindings = defaultKeybindings.concat(overrides);
            for (var i = 0, len = allKeybindings.length; i < len; i++) {
                var k = allKeybindings[i];
                if (k.keybinding === 0) {
                    continue;
                }
                if (k.context) {
                    k.context = k.context.normalize();
                }
                var entry = {
                    context: k.context,
                    keybinding: k.keybinding,
                    commandId: k.command
                };
                if (keyCodes_1.BinaryKeybindings.hasChord(k.keybinding)) {
                    // This is a chord
                    var keybindingFirstPart = keyCodes_1.BinaryKeybindings.extractFirstPart(k.keybinding);
                    var keybindingChordPart = keyCodes_1.BinaryKeybindings.extractChordPart(k.keybinding);
                    this._chords[keybindingFirstPart] = this._chords[keybindingFirstPart] || Object.create(null);
                    this._chords[keybindingFirstPart][keybindingChordPart] = this._chords[keybindingFirstPart][keybindingChordPart] || [];
                    this._chords[keybindingFirstPart][keybindingChordPart].push(entry);
                    this._addKeyPress(keybindingFirstPart, entry, k, i < defaultKeybindingsCount);
                }
                else {
                    this._addKeyPress(k.keybinding, entry, k, i < defaultKeybindingsCount);
                }
            }
        }
        KeybindingResolver.prototype._addKeyPress = function (keypress, entry, item, isDefault) {
            if (!this._map[keypress]) {
                // There is no conflict so far
                this._map[keypress] = [entry];
                this._addToLookupMap(item);
                return;
            }
            var conflicts = this._map[keypress];
            for (var i = conflicts.length - 1; i >= 0; i--) {
                var conflict = conflicts[i];
                if (conflict.commandId === item.command) {
                    continue;
                }
                if (keyCodes_1.BinaryKeybindings.hasChord(conflict.keybinding) && keyCodes_1.BinaryKeybindings.hasChord(entry.keybinding) && conflict.keybinding !== entry.keybinding) {
                    // The conflict only shares the chord start with this command
                    continue;
                }
                if (KeybindingResolver.contextIsEntirelyIncluded(true, conflict.context, item.context)) {
                    // `item` completely overwrites `conflict`
                    if (this._shouldWarnOnConflict && isDefault) {
                        console.warn('Conflict detected, command `' + conflict.commandId + '` cannot be triggered by ' + keyCodes_1.Keybinding.toUserSettingsLabel(keypress));
                    }
                    this._lookupMapUnreachable[conflict.commandId] = this._lookupMapUnreachable[conflict.commandId] || [];
                    this._lookupMapUnreachable[conflict.commandId].push(conflict.keybinding);
                }
            }
            conflicts.push(entry);
            this._addToLookupMap(item);
        };
        /**
         * Returns true if `a` is completely covered by `b`.
         * Returns true if `b` is a more relaxed `a`.
         * Return true if (`a` === true implies `b` === true).
         */
        KeybindingResolver.contextIsEntirelyIncluded = function (inNormalizedForm, a, b) {
            if (!inNormalizedForm) {
                a = a ? a.normalize() : null;
                b = b ? b.normalize() : null;
            }
            if (!b) {
                return true;
            }
            if (!a) {
                return false;
            }
            var aRulesArr = a.serialize().split(' && ');
            var bRulesArr = b.serialize().split(' && ');
            var aRules = Object.create(null);
            for (var i = 0, len = aRulesArr.length; i < len; i++) {
                aRules[aRulesArr[i]] = true;
            }
            for (var i = 0, len = bRulesArr.length; i < len; i++) {
                if (!aRules[bRulesArr[i]]) {
                    return false;
                }
            }
            return true;
        };
        KeybindingResolver.prototype._addToLookupMap = function (item) {
            if (!item.command) {
                return;
            }
            this._lookupMap[item.command] = this._lookupMap[item.command] || [];
            this._lookupMap[item.command].push(item);
        };
        KeybindingResolver.prototype.getDefaultBoundCommands = function () {
            return this._defaultBoundCommands;
        };
        KeybindingResolver.prototype.getDefaultKeybindings = function () {
            var out = new OutputBuilder();
            out.writeLine('[');
            var lastIndex = this._defaultKeybindings.length - 1;
            this._defaultKeybindings.forEach(function (k, index) {
                IOSupport.writeKeybindingItem(out, k);
                if (index !== lastIndex) {
                    out.writeLine(',');
                }
                else {
                    out.writeLine();
                }
            });
            out.writeLine(']');
            return out.toString();
        };
        KeybindingResolver.prototype.lookupKeybinding = function (commandId) {
            var rawPossibleTriggers = this._lookupMap[commandId];
            if (!rawPossibleTriggers) {
                return [];
            }
            var possibleTriggers = rawPossibleTriggers.map(function (possibleTrigger) { return possibleTrigger.keybinding; });
            var remove = this._lookupMapUnreachable[commandId];
            if (remove) {
                possibleTriggers = possibleTriggers.filter(function (possibleTrigger) {
                    return remove.indexOf(possibleTrigger) === -1;
                });
            }
            var seenKeys = [];
            var result = possibleTriggers.filter(function (possibleTrigger) {
                if (seenKeys.indexOf(possibleTrigger) >= 0) {
                    return false;
                }
                seenKeys.push(possibleTrigger);
                return true;
            });
            return result.map(function (trigger) {
                return new keyCodes_1.Keybinding(trigger);
            }).reverse(); // sort most specific to the top
        };
        KeybindingResolver.prototype.resolve = function (context, currentChord, keypress) {
            // console.log('resolve: ' + Keybinding.toLabel(keypress));
            var lookupMap = null;
            if (currentChord !== 0) {
                var chords = this._chords[currentChord];
                if (!chords) {
                    return null;
                }
                lookupMap = chords[keypress];
            }
            else {
                lookupMap = this._map[keypress];
            }
            var result = this._findCommand(context, lookupMap);
            if (!result) {
                return null;
            }
            if (currentChord === 0 && keyCodes_1.BinaryKeybindings.hasChord(result.keybinding)) {
                return {
                    enterChord: keypress,
                    commandId: null
                };
            }
            return {
                enterChord: 0,
                commandId: result.commandId
            };
        };
        KeybindingResolver.prototype._findCommand = function (context, matches) {
            if (!matches) {
                return null;
            }
            for (var i = matches.length - 1; i >= 0; i--) {
                var k = matches[i];
                if (!KeybindingResolver.contextMatchesRules(context, k.context)) {
                    continue;
                }
                return k;
            }
            return null;
        };
        KeybindingResolver.contextMatchesRules = function (context, rules) {
            if (!rules) {
                return true;
            }
            return rules.evaluate(context);
        };
        return KeybindingResolver;
    })();
    exports.KeybindingResolver = KeybindingResolver;
    function rightPaddedString(str, minChars) {
        if (str.length < minChars) {
            return str + (new Array(minChars - str.length).join(' '));
        }
        return str;
    }
    function sorter(a, b) {
        if (a.weight1 !== b.weight1) {
            return a.weight1 - b.weight1;
        }
        if (a.command < b.command) {
            return -1;
        }
        if (a.command > b.command) {
            return 1;
        }
        return a.weight2 - b.weight2;
    }
    var OutputBuilder = (function () {
        function OutputBuilder() {
            this._lines = [];
            this._currentLine = '';
        }
        OutputBuilder.prototype.write = function (str) {
            this._currentLine += str;
        };
        OutputBuilder.prototype.writeLine = function (str) {
            if (str === void 0) { str = ''; }
            this._lines.push(this._currentLine + str);
            this._currentLine = '';
        };
        OutputBuilder.prototype.toString = function () {
            this.writeLine();
            return this._lines.join('\n');
        };
        return OutputBuilder;
    })();
    exports.OutputBuilder = OutputBuilder;
    var IOSupport = (function () {
        function IOSupport() {
        }
        IOSupport.writeKeybindingItem = function (out, item) {
            out.write('{ "key": ' + rightPaddedString('"' + IOSupport.writeKeybinding(item.keybinding).replace(/\\/g, '\\\\') + '",', 25) + ' "command": ');
            var serializedContext = item.context ? item.context.serialize() : '';
            if (serializedContext.length > 0) {
                out.write('"' + item.command + '",');
                out.writeLine();
                out.write('                                     "when": "');
                out.write(serializedContext);
                out.write('" ');
            }
            else {
                out.write('"' + item.command + '" ');
            }
            //		out.write(String(item.weight));
            out.write('}');
        };
        IOSupport.readKeybindingItem = function (input, index) {
            var key = IOSupport.readKeybinding(input.key);
            var context = IOSupport.readKeybindingContexts(input.when);
            return {
                keybinding: key,
                command: input.command,
                context: context,
                weight1: 1000,
                weight2: index
            };
        };
        IOSupport.writeKeybinding = function (input, Platform) {
            if (Platform === void 0) { Platform = defaultPlatform; }
            return keyCodes_1.Keybinding.toUserSettingsLabel(input, Platform);
        };
        IOSupport.readKeybinding = function (input, Platform) {
            if (Platform === void 0) { Platform = defaultPlatform; }
            return keyCodes_1.Keybinding.fromUserSettingsLabel(input, Platform);
        };
        IOSupport.readKeybindingContexts = function (input) {
            return keybindingService_1.KbExpr.deserialize(input);
        };
        return IOSupport;
    })();
    exports.IOSupport = IOSupport;
});
//# sourceMappingURL=keybindingResolver.js.map