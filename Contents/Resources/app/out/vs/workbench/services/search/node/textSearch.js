/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'fs', 'iconv-lite', 'vs/base/common/mime', 'vs/base/node/mime', 'vs/base/node/encoding'], function (require, exports, strings, fs, iconv, baseMime, mime_1, encoding_1) {
    var Engine = (function () {
        function Engine(config, walker) {
            this.rootFolders = config.rootFolders;
            this.extraFiles = config.extraFiles;
            this.walker = walker;
            this.contentPattern = strings.createRegExp(config.contentPattern.pattern, config.contentPattern.isRegExp, config.contentPattern.isCaseSensitive, config.contentPattern.isWordMatch);
            this.isCanceled = false;
            this.limitReached = false;
            this.maxResults = config.maxResults;
            this.worked = 0;
            this.total = 0;
            this.fileEncoding = iconv.encodingExists(config.fileEncoding) ? config.fileEncoding : encoding_1.UTF8;
        }
        Engine.prototype.cancel = function () {
            this.isCanceled = true;
            this.walker.cancel();
        };
        Engine.prototype.search = function (onResult, onProgress, done) {
            var _this = this;
            var resultCounter = 0;
            var unwind = function (processed) {
                _this.worked += processed;
                // Emit progress() unless we got canceled or hit the limit
                if (processed && !_this.isDone && !_this.isCanceled && !_this.limitReached) {
                    onProgress({ total: _this.total, worked: _this.worked });
                }
                // Emit done()
                if (_this.worked === _this.total && _this.walkerIsDone && !_this.isDone) {
                    _this.isDone = true;
                    done(_this.walkerError, _this.limitReached);
                }
            };
            // Walk over the file system
            this.walker.walk(this.rootFolders, this.extraFiles, function (result) {
                _this.total++;
                // If the result is empty or we have reached the limit or we are canceled, ignore it
                if (_this.limitReached || _this.isCanceled) {
                    return unwind(1);
                }
                // Indicate progress to the outside
                onProgress({ total: _this.total, worked: _this.worked });
                var fileMatch = null;
                var doneCallback = function (error) {
                    if (!error && !_this.isCanceled && fileMatch && !fileMatch.isEmpty()) {
                        onResult(fileMatch.serialize());
                    }
                    return unwind(1);
                };
                var perLineCallback = function (line, lineNumber) {
                    if (_this.limitReached || _this.isCanceled) {
                        return; // return early if canceled or limit reached
                    }
                    var lineMatch = null;
                    var match = _this.contentPattern.exec(line);
                    // Record all matches into file result
                    while (match !== null && match[0].length > 0 && !_this.limitReached && !_this.isCanceled) {
                        resultCounter++;
                        if (_this.maxResults && resultCounter >= _this.maxResults) {
                            _this.limitReached = true;
                        }
                        if (fileMatch === null) {
                            fileMatch = new FileMatch(result.path);
                        }
                        if (lineMatch === null) {
                            lineMatch = new LineMatch(line, lineNumber);
                            fileMatch.addMatch(lineMatch);
                        }
                        lineMatch.addMatch(match.index, match[0].length);
                        match = _this.contentPattern.exec(line);
                    }
                };
                // Read lines buffered to support large files
                _this.readlinesAsync(result.path, perLineCallback, { bufferLength: 8096, encoding: _this.fileEncoding }, doneCallback);
            }, function (error, isLimitHit) {
                _this.walkerIsDone = true;
                _this.walkerError = error;
                unwind(0 /* walker is done, indicate this back to our handler to be able to unwind */);
            });
        };
        Engine.prototype.readlinesAsync = function (filename, perLineCallback, options, callback) {
            var _this = this;
            fs.open(filename, 'r', null, function (error, fd) {
                if (error) {
                    return callback(error);
                }
                var buffer = new Buffer(options.bufferLength);
                var pos;
                var i;
                var line = '';
                var lineNumber = 0;
                var lastBufferHadTraillingCR = false;
                var outer = _this;
                function decode(buffer) {
                    if (options.encoding === encoding_1.UTF8) {
                        return buffer.toString(); // much faster to use built in toString() when encoding is default
                    }
                    return iconv.decode(buffer, options.encoding);
                }
                function lineFinished(offset) {
                    line += decode(buffer.slice(pos, i + offset));
                    perLineCallback(line, lineNumber);
                    line = '';
                    lineNumber++;
                    pos = i + offset;
                }
                function readFile(isFirstRead, clb) {
                    if (outer.limitReached || outer.isCanceled) {
                        return clb(null); // return early if canceled or limit reached
                    }
                    fs.read(fd, buffer, 0, buffer.length, null, function (error, bytesRead, buffer) {
                        if (error || bytesRead === 0 || outer.limitReached || outer.isCanceled) {
                            return clb(error); // return early if canceled or limit reached or no more bytes to read
                        }
                        pos = 0;
                        i = 0;
                        // Detect encoding and mime when this is the beginning of the file
                        if (isFirstRead) {
                            var mimeAndEncoding = mime_1.detectMimeAndEncodingFromBuffer(buffer, bytesRead);
                            if (mimeAndEncoding.mimes[mimeAndEncoding.mimes.length - 1] !== baseMime.MIME_TEXT) {
                                return clb(null); // skip files that seem binary
                            }
                            // Check for BOM offset
                            switch (mimeAndEncoding.encoding) {
                                case encoding_1.UTF8:
                                    pos = i = 3;
                                    options.encoding = encoding_1.UTF8;
                                    break;
                                case encoding_1.UTF16be:
                                    pos = i = 2;
                                    options.encoding = encoding_1.UTF16be;
                                    break;
                                case encoding_1.UTF16le:
                                    pos = i = 2;
                                    options.encoding = encoding_1.UTF16le;
                                    break;
                            }
                        }
                        if (lastBufferHadTraillingCR) {
                            if (buffer[i] === 0x0a) {
                                lineFinished(1);
                                i++;
                            }
                            else {
                                lineFinished(0);
                            }
                            lastBufferHadTraillingCR = false;
                        }
                        for (; i < bytesRead; ++i) {
                            if (buffer[i] === 0x0a) {
                                lineFinished(1);
                            }
                            else if (buffer[i] === 0x0d) {
                                if (i + 1 === bytesRead) {
                                    lastBufferHadTraillingCR = true;
                                }
                                else if (buffer[i + 1] === 0x0a) {
                                    lineFinished(2);
                                    i++;
                                }
                                else {
                                    lineFinished(1);
                                }
                            }
                        }
                        line += decode(buffer.slice(pos, bytesRead));
                        readFile(false /* isFirstRead */, clb); // Continue reading
                    });
                }
                readFile(true /* isFirstRead */, function (error) {
                    if (error) {
                        return callback(error);
                    }
                    if (line.length) {
                        perLineCallback(line, lineNumber); // handle last line
                    }
                    fs.close(fd, function (error) {
                        callback(error);
                    });
                });
            });
        };
        return Engine;
    })();
    exports.Engine = Engine;
    var FileMatch = (function () {
        function FileMatch(path) {
            this.path = path;
            this.lineMatches = [];
        }
        FileMatch.prototype.addMatch = function (lineMatch) {
            this.lineMatches.push(lineMatch);
        };
        FileMatch.prototype.isEmpty = function () {
            return this.lineMatches.length === 0;
        };
        FileMatch.prototype.serialize = function () {
            var lineMatches = [];
            for (var i = 0; i < this.lineMatches.length; i++) {
                lineMatches.push(this.lineMatches[i].serialize());
            }
            return {
                path: this.path,
                lineMatches: lineMatches
            };
        };
        return FileMatch;
    })();
    var LineMatch = (function () {
        function LineMatch(preview, lineNumber) {
            this.preview = preview.replace(/(\r|\n)*$/, '');
            this.lineNumber = lineNumber;
            this.offsetAndLengths = [];
        }
        LineMatch.prototype.getText = function () {
            return this.preview;
        };
        LineMatch.prototype.getLineNumber = function () {
            return this.lineNumber;
        };
        LineMatch.prototype.addMatch = function (offset, length) {
            this.offsetAndLengths.push([offset, length]);
        };
        LineMatch.prototype.serialize = function () {
            var result = {
                preview: this.preview,
                lineNumber: this.lineNumber,
                offsetAndLengths: this.offsetAndLengths
            };
            return result;
        };
        return LineMatch;
    })();
});
//# sourceMappingURL=textSearch.js.map