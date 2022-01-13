"use strict";
exports.__esModule = true;
exports.Song = exports.Steps = exports.StepsDifficulty = exports.StepsType = exports.SongSelectable = exports.SongBPMDisplay = exports.BGAnimation = void 0;
var MSDFile_1 = require("./MSDFile");
var MAX_EDIT_SIZE_BYTES = 20 * 1024; // 20 KB
var DEFAULT_MUSIC_SAMPLE_LENGTH = 12;
var BGAnimation = /** @class */ (function () {
    function BGAnimation(line) {
        // https://github.com/stepmania/stepmania/wiki/sm#bgchanges
        this.startBeat = 0; // 0.000
        this.fileName = '';
        this.playRate = 1; // 1.000
        this.CrossFade = 0; // [0,1]
        this.StretchRewind = 0; // [0,1]
        this.StretchNoLoop = 1; // [0,1]
        this.EffectFile = '';
        this.EffectFile2 = '';
        this.TransitionFile = '';
        this.ColorString = '';
        this.ColorString2 = '';
        var line_s = line.split('=');
        if (line_s.length < 11) {
            var i = line_s.length;
            line_s.length = 11;
            for (var x = i; x < 11; x++)
                line_s[x] = 'e';
        }
        this.startBeat = Number(line_s.shift());
        this.fileName = line_s.shift();
        this.playRate = Number(line_s.shift());
        this.CrossFade = line_s.shift() == '1' ? 1 : 0;
        this.StretchRewind = line_s.shift() == '1' ? 1 : 0;
        this.StretchNoLoop = line_s.shift() == '1' ? 1 : 0;
        this.EffectFile = line_s.shift();
        this.EffectFile2 = line_s.shift();
        this.TransitionFile = line_s.shift();
        this.ColorString = line_s.shift();
        this.ColorString2 = line_s.shift();
    }
    BGAnimation.prototype.toString = function () {
        return (this.startBeat.toFixed(3) + "=" + this.fileName + "=" + this.playRate.toFixed(3) + "=" +
            (this.CrossFade + "=" + this.StretchRewind + "=" + this.StretchNoLoop + "=") +
            (this.EffectFile + "=" + this.EffectFile2 + "=" + this.TransitionFile + "=") +
            (this.ColorString.replace(/,/g, '^') + "=" + this.ColorString2.replace(/,/g, '^'))); // UGLY: escape "," in colors.
    };
    return BGAnimation;
}());
exports.BGAnimation = BGAnimation;
var SongBPMDisplay;
(function (SongBPMDisplay) {
    SongBPMDisplay[SongBPMDisplay["ACTUAL"] = 0] = "ACTUAL";
    SongBPMDisplay[SongBPMDisplay["RANDOM"] = 1] = "RANDOM";
    SongBPMDisplay[SongBPMDisplay["SPECIFIED"] = 2] = "SPECIFIED";
})(SongBPMDisplay = exports.SongBPMDisplay || (exports.SongBPMDisplay = {}));
var SongSelectable;
(function (SongSelectable) {
    SongSelectable[SongSelectable["SHOW_ALWAYS"] = 0] = "SHOW_ALWAYS";
    SongSelectable[SongSelectable["SHOW_NEVER"] = 1] = "SHOW_NEVER";
    SongSelectable[SongSelectable["SHOW_ROULETTE"] = 2] = "SHOW_ROULETTE";
})(SongSelectable = exports.SongSelectable || (exports.SongSelectable = {}));
var StepsType;
(function (StepsType) {
    StepsType[StepsType["DANCE_SINGLE"] = 0] = "DANCE_SINGLE";
    StepsType[StepsType["DANCE_DOUBLE"] = 1] = "DANCE_DOUBLE";
})(StepsType = exports.StepsType || (exports.StepsType = {}));
var StepsTypeToString = ['dance-single', 'dance-double'];
var StepsDifficulty;
(function (StepsDifficulty) {
    StepsDifficulty[StepsDifficulty["Beginner"] = 0] = "Beginner";
    StepsDifficulty[StepsDifficulty["Easy"] = 1] = "Easy";
    StepsDifficulty[StepsDifficulty["Medium"] = 2] = "Medium";
    StepsDifficulty[StepsDifficulty["Hard"] = 3] = "Hard";
    StepsDifficulty[StepsDifficulty["Challenge"] = 4] = "Challenge";
    StepsDifficulty[StepsDifficulty["Edit"] = 5] = "Edit";
})(StepsDifficulty = exports.StepsDifficulty || (exports.StepsDifficulty = {}));
var StepsDifficultyString = ['Beginner', 'Easy', ' Medium', 'Hard', 'Challenge', 'Edit'];
var Steps = /** @class */ (function () {
    function Steps() {
        this.ChartType = StepsType.DANCE_SINGLE;
        this.Description = '';
        this.Difficulty = StepsDifficulty.Beginner;
        this.Meter = 0;
        this.GrooveRadar = [0, 0, 0, 0, 0];
        // Misc stuff
        this.Steps = 0;
        this.Mines = 0;
        this.Jumps = 0;
        this.Hands = 0;
        this.Holds = 0;
        this.Rolls = 0;
        this.NoteData = '';
    }
    Steps.prototype.ParseNotedata = function (steps) {
        var _this = this;
        this.NoteData = steps;
        this.Mines = steps.replace(/[^M]/g, '').length;
        var measure_regex = new RegExp(".{0," + (this.ChartType == StepsType.DANCE_SINGLE ? 4 : 8) + "}", 'g');
        steps.split(',').forEach(function (measure) {
            measure.match(measure_regex).forEach(function (line) {
                var t = line.replace(/[03]/g, '');
                if (t.length >= 3) {
                    _this.Hands++;
                }
                else if (t.length === 2) {
                    _this.Jumps++;
                }
                t.split('').forEach(function (x) {
                    switch (x) {
                        case 'M':
                            _this.Mines++;
                            break;
                        case '1':
                            _this.Steps++;
                            break;
                        case '2':
                            _this.Holds++;
                            break;
                        case '4':
                            _this.Rolls++;
                            break;
                    }
                });
            });
        });
        this.Steps += this.Holds + this.Rolls - this.Jumps - this.Hands;
    };
    Steps.prototype.toString = function () {
        var content = [];
        content.push('');
        content.push("//---------------" + StepsTypeToString[this.ChartType] + " - " + this.Description + "----------------");
        content.push('#NOTES:'); // song.m_vsKeysoundFile.empty() ? "#NOTES:" : "#NOTES2:"
        content.push("     " + StepsTypeToString[this.ChartType] + ":");
        content.push("     " + this.Description + ":");
        content.push("     " + StepsDifficultyString[this.Difficulty] + ":");
        content.push("     " + this.Meter + ":");
        content.push("     " + this.GrooveRadar.map(function (x) { return x.toFixed(3); }).join(',') + ":");
        content.push(this.NoteData.split(',')
            .map(function (measure) {
            var chunk = [];
            for (var i = 0; i < measure.length; i += 4) {
                chunk.push(measure.slice(i, i + 4));
            }
            return chunk.join('\r\n');
        })
            .join('\r\n,\r\n'));
        content.push(';');
        return content.join('\n');
    };
    return Steps;
}());
exports.Steps = Steps;
var Song = /** @class */ (function () {
    function Song(data) {
        this.BGChanges = [];
        this.BetterBGChanges = [];
        this.FGChanges = [];
        this.MainTitle = '';
        this.SubTitle = '';
        this.Artist = '';
        this.MainTitleTranslit = '';
        this.SubTitleTranslit = '';
        this.ArtistTranslit = '';
        this.Genre = '';
        this.Credit = '';
        this.BannerFile = '';
        this.BackgroundFile = '';
        this.LyricsFile = '';
        this.CDTitleFile = '';
        this.MusicFile = '';
        this.MusicLengthSeconds = 0;
        this.FirstBeat = 0;
        this.LastBeat = 0;
        this.SongFileName = '';
        this.HasMusic = false;
        this.HasBanner = false;
        this.SampleStart = 0;
        this.SampleLength = 0;
        this.DisplayBPMType = SongBPMDisplay.ACTUAL;
        this.SpecifiedBPMMin = undefined;
        this.SpecifiedBPMMax = undefined;
        this.Beat0OffsetInSeconds = 0;
        this.Stops = {};
        this.BPMs = {};
        this.SelectionDisplay = SongSelectable.SHOW_ALWAYS;
        this.Steps = {};
        this.Miscellaneous = {};
        var msd = new MSDFile_1.MSDFile(data);
        var i = 0;
        while (i < msd.GetNumValues()) {
            var params = msd.GetValue(i);
            var value_name = msd.GetParam(i, 0).toUpperCase();
            switch (value_name) {
                case 'TITLE':
                    this.MainTitle = params[1];
                    break;
                case 'SUBTITLE':
                    this.SubTitle = params[1];
                    break;
                case 'ARTIST':
                    this.Artist = params[1];
                    break;
                case 'TITLETRANSLIT':
                    this.MainTitleTranslit = params[1];
                    break;
                case 'SUBTITLETRANSLIT':
                    this.SubTitleTranslit = params[1];
                    break;
                case 'ARTISTTRANSLIT':
                    this.ArtistTranslit = params[1];
                    break;
                case 'GENRE':
                    this.Genre = params[1];
                    break;
                case 'CREDIT':
                    this.Credit = params[1];
                    break;
                case 'BANNER':
                    this.BannerFile = params[1];
                    break;
                case 'BACKGROUND':
                    this.BackgroundFile = params[1];
                    break;
                case 'LYRICSPATH':
                    this.LyricsFile = params[1];
                    break;
                case 'CDTITLE':
                    this.CDTitleFile = params[1];
                    break;
                case 'MUSIC':
                    this.MusicFile = params[1];
                    break;
                case 'MUSICLENGTH':
                    this.MusicLengthSeconds = parseFloat(params[1]);
                    break;
                case 'MUSICBYTES':
                    break; // Ignore
                case 'FIRSTBEAT':
                    this.FirstBeat = params[1] ? parseFloat(params[1]) : 0;
                    break;
                case 'LASTBEAT':
                    this.LastBeat = params[1] ? parseFloat(params[1]) : 0;
                    break;
                case 'SONGFILENAME':
                    this.SongFileName = params[1];
                    break;
                case 'HASMUSIC':
                    this.HasMusic = params[1] !== undefined;
                    break;
                case 'HASBANNER':
                    this.HasBanner = params[1] !== undefined;
                    break;
                case 'SAMPLESTART':
                    this.SampleStart = parseFloat(params[1]);
                    break;
                case 'SAMPLELENGTH':
                    this.SampleLength = parseFloat(params[1]);
                    break;
                case 'DISPLAYBPM':
                    {
                        if (params[1] == '*') {
                            this.DisplayBPMType = SongBPMDisplay.RANDOM;
                        }
                        else {
                            this.DisplayBPMType = SongBPMDisplay.SPECIFIED;
                            this.SpecifiedBPMMin = parseFloat(params[1]) || undefined;
                            if (params[2].trim()) {
                                this.SpecifiedBPMMax = this.SpecifiedBPMMin;
                            }
                            else {
                                this.SpecifiedBPMMax = parseFloat(params[2]) || undefined;
                            }
                        }
                    }
                    break;
                case 'SELECTABLE':
                    {
                        if (params[1].trim()) {
                            if (params[1] == 'YES') {
                                this.SelectionDisplay = SongSelectable.SHOW_ALWAYS;
                            }
                            else if (params[1] == 'NO') {
                                this.SelectionDisplay = SongSelectable.SHOW_NEVER;
                            }
                            else if (params[1] == 'ROULETTE') {
                                this.SelectionDisplay = SongSelectable.SHOW_ROULETTE;
                            }
                        }
                    }
                    break;
                case 'BGCHANGES':
                    {
                        for (var _i = 0, _a = params[1].split(','); _i < _a.length; _i++) {
                            var bgchange = _a[_i];
                            if (bgchange.trim())
                                this.BGChanges.push(new BGAnimation(bgchange));
                        }
                    }
                    break;
                case 'BETTERBGCHANGES':
                    {
                        // this.ForNotITG = true;
                        for (var _b = 0, _c = params[1].split(','); _b < _c.length; _b++) {
                            var betterbgchange = _c[_b];
                            if (betterbgchange.trim())
                                this.BetterBGChanges.push(new BGAnimation(betterbgchange));
                        }
                    }
                    break;
                case 'FGCHANGES':
                    {
                        for (var _d = 0, _e = params[1].split(','); _d < _e.length; _d++) {
                            var fgchange = _e[_d];
                            if (fgchange.trim())
                                this.FGChanges.push(new BGAnimation(fgchange));
                        }
                    }
                    break;
                case 'NOTES':
                    {
                        if (params.length < 7) {
                            console.error('(#NOTES) Expected at least 7 fields, got ' + params.length);
                            break;
                        }
                        var steps = new Steps();
                        if (params[1] == 'dance-single')
                            steps.ChartType = StepsType.DANCE_SINGLE;
                        else if (params[1] == 'dance-double')
                            steps.ChartType = StepsType.DANCE_DOUBLE;
                        else {
                            console.error('(#NOTES) Invalid or unhandled step type');
                            break;
                        }
                        steps.Description = params[2];
                        steps.Difficulty = StepsDifficulty[params[3]];
                        steps.Meter = parseFloat(params[4]);
                        var radarIndex = 0;
                        for (var _f = 0, _g = params[5].split(','); _f < _g.length; _f++) {
                            var radarMeter = _g[_f];
                            steps.GrooveRadar[radarIndex++] = parseFloat(radarMeter);
                        }
                        steps.ParseNotedata(params[6]);
                        if (this.Steps[steps.Difficulty] === undefined)
                            this.Steps[steps.Difficulty] = [];
                        this.Steps[steps.Difficulty].push(steps);
                    }
                    break;
                case 'BPMS':
                    {
                        for (var _h = 0, _j = params[1].split(','); _h < _j.length; _h++) {
                            var bpmchange = _j[_h];
                            var values = bpmchange.split('=');
                            if (values.length !== 2)
                                continue;
                            this.BPMs[parseFloat(values[0])] = parseFloat(values[1]);
                        }
                    }
                    break;
                case 'OFFSET':
                    {
                        this.Beat0OffsetInSeconds = parseFloat(params[1]);
                    }
                    break;
                case 'FREEZES':
                case 'STOPS':
                    {
                        for (var _k = 0, _l = params[1].split(','); _k < _l.length; _k++) {
                            var stops = _l[_k];
                            var values = stops.split('=');
                            if (values.length !== 2)
                                continue;
                            this.Stops[parseFloat(values[0])] = parseFloat(values[1]);
                        }
                    }
                    break;
                default:
                    this.Miscellaneous[value_name] = params
                        .slice(1)
                        .filter(function (x) { return x.trim(); })
                        .join(':');
                    break;
            }
            i++;
        }
    }
    Song.prototype.toString = function () {
        var _this = this;
        var content = [];
        content.push("#TITLE:" + this.MainTitle + ";");
        content.push("#SUBTITLE:" + this.SubTitle + ";");
        content.push("#ARTIST:" + this.Artist + ";");
        content.push("#TITLETRANSLIT:" + this.MainTitleTranslit + ";");
        content.push("#SUBTITLETRANSLIT:" + this.SubTitleTranslit + ";");
        content.push("#ARTISTTRANSLIT:" + this.ArtistTranslit + ";");
        content.push("#GENRE:" + this.Genre + ";");
        content.push("#CREDIT:" + this.Credit + ";");
        content.push("#BANNER:" + this.BannerFile + ";");
        content.push("#BACKGROUND:" + this.BackgroundFile + ";");
        content.push("#LYRICSPATH:" + this.LyricsFile + ";");
        content.push("#CDTITLE:" + this.CDTitleFile + ";");
        content.push("#MUSIC:" + this.MusicFile + ";");
        content.push("#OFFSET:" + this.Beat0OffsetInSeconds.toFixed(3) + ";");
        content.push("#SAMPLESTART:" + this.SampleStart.toFixed(3) + ";");
        content.push("#SAMPLELENGTH:" + this.SampleLength.toFixed(3) + ";");
        var selectable;
        switch (this.SelectionDisplay) {
            case SongSelectable.SHOW_ALWAYS:
                selectable = 'YES';
                break;
            case SongSelectable.SHOW_NEVER:
                selectable = 'NO';
                break;
            case SongSelectable.SHOW_ROULETTE:
                selectable = 'ROULETTE';
                break;
        }
        content.push("#SELECTABLE:" + selectable + ";");
        switch (this.DisplayBPMType) {
            case SongBPMDisplay.ACTUAL:
                break;
            case SongBPMDisplay.SPECIFIED:
                {
                    var display = "#DISPLAYBPM:" + this.SpecifiedBPMMin.toFixed(3);
                    if (this.SpecifiedBPMMin === this.SpecifiedBPMMin)
                        display += ":" + this.SpecifiedBPMMax.toFixed(3);
                    content.push(display + ';');
                }
                break;
            case SongBPMDisplay.RANDOM:
                content.push("#DISPLAYBPM:*;");
                break;
        }
        content.push("#BPMS:" + Object.keys(this.BPMs)
            .map(function (startBPM) {
            var endBPM = _this.BPMs[+startBPM];
            return parseFloat(startBPM).toFixed(3) + '=' + endBPM.toFixed(3);
        })
            .join(',') + ";");
        content.push("#STOPS:" + Object.keys(this.Stops)
            .map(function (startStop) {
            var endStop = _this.Stops[+startStop];
            return parseFloat(startStop).toFixed(3) + '=' + endStop.toFixed(3);
        })
            .join(',') + ";");
        content.push("#BGCHANGES:" + this.BGChanges.map(function (x) { return x.toString(); }).join(',') + ";");
        if (this.BetterBGChanges.length)
            content.push("#BETTERBGCHANGES:" + this.BetterBGChanges.map(function (x) { return x.toString(); }).join(',') + ";");
        content.push("#FGCHANGES:" + this.FGChanges.map(function (x) { return x.toString(); }).join(',') + ";");
        Object.keys(this.Miscellaneous).forEach(function (key) {
            content.push("#" + key + ":" + _this.Miscellaneous[key] + ";");
        });
        Object.keys(this.Steps).forEach(function (diff) {
            var steps = _this.Steps[parseFloat(diff)];
            if (steps.length) {
                steps.forEach(function (step) {
                    content.push(step.toString());
                });
            }
        });
        return content.join('\n');
    };
    return Song;
}());
exports.Song = Song;
