var hogan = require('hogan.js');

function compile(source, options) {
    if (typeof source === 'string') {
        var opts = {};
        if (options.sectionTags) {
            opts.sectionTags = options.sectionTags;
        }
        if (options.delimiters) {
            opts.delimiters = options.delimiters;
        }
        var template = hogan.compile(source, opts);
        return function () {
            return template.render();
        }
    }
    else {
        return source;
    }
}

function render(template, options) {
    return this.compile(template, options);
}

exports.compile = compile;
exports.render = render;