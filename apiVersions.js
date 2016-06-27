'use strict';
var routesVersioning = require('express-routes-versioning')();
var _ = require('lodash');
var semver = require('semver');

var responders, Terror;

function apiVersions() {
    var versions = [].slice.call(arguments);
    return function (req, res, next) {
        var paramVersion = req.params.version;
        if (/v?[\.\d]+/.test(paramVersion)) {
            var version = _.trim(paramVersion, 'v');
            var format = version.split('.');
            var major = format[0], minor = format[1] || 0, patch = format[2] || 0;
            version = req.version = [major, minor, patch].join('.');

            var acceptedVersionsHandlers = {};
            _.each(versions, function (version) {
                var format = ('' + version).split('.');
                var major = format[0], minor = format[1] || 0, patch = format[2] || 0;
                version = [major, minor, patch].join('.');
                acceptedVersionsHandlers[version] = function (req, res, next) {
                    next();
                };
            });

            routesVersioning(acceptedVersionsHandlers, function noMatchCallback(req, res, next) {
                responders.respondError(res, new Terror('Version ' + req.params.version + ' not supported. Use versions ' + versions.join(', ') + '', Terror.codes.notFound));
            })(req, res, function (err) {
                if (err) {
                    return next(err);
                }
                req.version = _.partial(semver.satisfies, version, _);
                next();
            });
        } else {
            next();
        }
    };
}

module.exports = function (options, imports, register) {
    responders = imports.responders;
    Terror = imports.Terror;
    register(null, {
        apiVersions: apiVersions
    });
};