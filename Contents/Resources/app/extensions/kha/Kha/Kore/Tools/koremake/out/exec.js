"use strict";
const os = require('os');
function sys() {
    if (os.platform() === 'linux') {
        if (os.arch() === 'arm')
            return '-linuxarm';
        else if (os.arch() === 'x64')
            return '-linux64';
        else
            return '-linux32';
    }
    else if (os.platform() === 'win32') {
        return '.exe';
    }
    else {
        return '-osx';
    }
}
exports.sys = sys;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/ec6a2e2a3863b88611e4b077fcab9a568132a8d0/extensions/kha/Kha/Kore/Tools/koremake/out/exec.js.map
