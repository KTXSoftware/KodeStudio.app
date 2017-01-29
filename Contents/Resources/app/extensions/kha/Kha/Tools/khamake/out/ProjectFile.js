"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs');
const path = require('path');
const Platform_1 = require('./Platform');
const Project_1 = require('./Project');
function loadProject(from, projectfile, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(from, projectfile), { encoding: 'utf8' }, (err, data) => {
                let resolved = false;
                let resolver = (project) => {
                    resolved = true;
                    resolve(project);
                };
                process.on('exit', (code) => {
                    if (!resolved) {
                        console.error('Error: khafile.js did not call resolve, no project created.');
                    }
                });
                Project_1.Project.scriptdir = from;
                try {
                    new Function('Project', 'Platform', 'platform', 'require', 'resolve', 'reject', data)(Project_1.Project, Platform_1.Platform, platform, require, resolver, reject);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    });
}
exports.loadProject = loadProject;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/ebff2335d0f58a5b01ac50cb66737f4694ec73f3/extensions/kha/Kha/Tools/khamake/out/ProjectFile.js.map
