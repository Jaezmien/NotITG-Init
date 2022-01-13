"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.MSDFile = void 0;
var MSDFile = /** @class */ (function () {
    function MSDFile(buffer) {
        /*
         * The original MSD format is simply:
         *
         * #PARAM0:PARAM1:PARAM2:PARAM3;
         * #NEXTPARAM0:PARAM1:PARAM2:PARAM3;
         *
         * (The first field is typically an identifier, but doesn't have to be.)
         *
         * The semicolon is not optional, though if we hit a # on a new line, eg:
         * #VALUE:PARAM1
         * #VALUE2:PARAM2
         * we'll recover.
         *
         * TODO: Normal text fields need some way of escaping.  We need to be able to escape
         * colons and "//".  Also, we should escape #s, so if we really want to put a # at the
         * beginning of a line, we can.
         */
        this.value_t = [];
        this.value_t = [];
        for (var index in buffer) {
            var line = buffer[index];
            buffer[index] = line.replace(/\/\/.+/g, "").trim();
        }
        var value_b = [];
        for (var i = 0; i < 32; i++) {
            value_b[i] = "";
        }
        var value_i = 0;
        var is_reading = false;
        var buffer_value = "";
        var buffer_join = buffer.join("");
        for (var index = 0; index < buffer_join.length; index++) {
            var char = buffer_join[index];
            var is_special = false;
            if (char === "#") {
                if (is_reading) {
                    is_reading = false;
                }
                if (buffer_value.length > 0) {
                    value_b[value_i] = buffer_value;
                    buffer_value = "";
                    value_i++;
                }
                if (value_b.length > 0 && value_b[0].trim()) {
                    this.value_t.push(__spreadArray([], value_b));
                    for (var i = 0; i < 32; i++) {
                        value_b[i] = "";
                    }
                    value_i = 0;
                }
                is_special = true;
            }
            else if (char === ":") {
                value_b[value_i] = buffer_value;
                buffer_value = "";
                value_i++;
                is_special = true;
            }
            else if (char === ";") {
                is_reading = false;
                is_special = true;
            }
            if (!is_special) {
                buffer_value += char;
            }
        }
        // Leftover
        if (is_reading) {
            is_reading = false;
        }
        if (buffer_value.length > 0) {
            value_b[value_i] = buffer_value;
            buffer_value = "";
            value_i++;
        }
        if (value_b.length > 0) {
            this.value_t.push(__spreadArray([], value_b));
            for (var i = 0; i < 32; i++) {
                value_b[i] = "";
            }
            value_i = 0;
        }
    }
    MSDFile.prototype.GetNumValues = function () { return this.value_t.length; };
    MSDFile.prototype.GetNumParams = function (val) {
        if (val < 0 || val > this.value_t.length)
            return 0;
        return this.value_t[val].length;
    };
    MSDFile.prototype.GetValue = function (val) {
        if (val < 0 || val > this.value_t.length)
            return [];
        return this.value_t[val];
    };
    MSDFile.prototype.GetParam = function (val, par) {
        if (val < 0 || val > this.value_t.length)
            return "";
        if (par < 0 || par > this.value_t[val].length)
            return "";
        return this.value_t[val][par];
    };
    return MSDFile;
}());
exports.MSDFile = MSDFile;
