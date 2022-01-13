import { MSDFile } from './MSDFile'

const MAX_EDIT_SIZE_BYTES = 20 * 1024 // 20 KB
const DEFAULT_MUSIC_SAMPLE_LENGTH = 12

export class BGAnimation {
	// https://github.com/stepmania/stepmania/wiki/sm#bgchanges
	startBeat: number = 0 // 0.000
	fileName: string = ''
	playRate: number = 1 // 1.000

	CrossFade: number = 0 // [0,1]
	StretchRewind: number = 0 // [0,1]
	StretchNoLoop: number = 1 // [0,1]

	EffectFile: string = ''
	EffectFile2: string = ''
	TransitionFile: string = ''

	ColorString: string = ''
	ColorString2: string = ''

	constructor(line: string) {
		let line_s = line.split('=')
		if (line_s.length < 11) {
			let i = line_s.length
			line_s.length = 11
			for (let x = i; x < 11; x++) line_s[x] = 'e'
		}

		this.startBeat = Number(line_s.shift())
		this.fileName = line_s.shift()!
		this.playRate = Number(line_s.shift())
		this.CrossFade = line_s.shift()! == '1' ? 1 : 0
		this.StretchRewind = line_s.shift()! == '1' ? 1 : 0
		this.StretchNoLoop = line_s.shift()! == '1' ? 1 : 0
		this.EffectFile = line_s.shift()!
		this.EffectFile2 = line_s.shift()!
		this.TransitionFile = line_s.shift()!
		this.ColorString = line_s.shift()!
		this.ColorString2 = line_s.shift()!
	}
	toString(): string {
		return (
			`${this.startBeat.toFixed(3)}=${this.fileName}=${this.playRate.toFixed(3)}=` +
			`${this.CrossFade}=${this.StretchRewind}=${this.StretchNoLoop}=` +
			`${this.EffectFile}=${this.EffectFile2}=${this.TransitionFile}=` +
			`${this.ColorString.replace(/,/g, '^')}=${this.ColorString2.replace(/,/g, '^')}`
		) // UGLY: escape "," in colors.
	}
}

export enum SongBPMDisplay {
	ACTUAL,
	RANDOM,
	SPECIFIED,
}
export enum SongSelectable {
	SHOW_ALWAYS,
	SHOW_NEVER,
	SHOW_ROULETTE,
}
export enum StepsType {
	DANCE_SINGLE,
	DANCE_DOUBLE,
}
const StepsTypeToString = ['dance-single', 'dance-double']
export enum StepsDifficulty {
	Beginner,
	Easy,
	Medium,
	Hard,
	Challenge,
	Edit,
}
const StepsDifficultyString = ['Beginner', 'Easy', ' Medium', 'Hard', 'Challenge', 'Edit']

export class Steps {
	ChartType = StepsType.DANCE_SINGLE
	Description = ''
	Difficulty = StepsDifficulty.Beginner
	Meter = 0
	GrooveRadar = [0, 0, 0, 0, 0]

	// Misc stuff
	Steps = 0
	Mines = 0
	Jumps = 0
	Hands = 0
	Holds = 0
	Rolls = 0

	NoteData = ''
	ParseNotedata(steps: string) {
		this.NoteData = steps
		this.Mines = steps.replace(/[^M]/g, '').length

		const measure_regex = new RegExp(`.{0,${this.ChartType == StepsType.DANCE_SINGLE ? 4 : 8}}`, 'g')
		steps.split(',').forEach((measure) => {
			measure.match(measure_regex)!.forEach((line) => {
				const t = line.replace(/[03]/g, '')
				if (t.length >= 3) {
					this.Hands++
				} else if (t.length === 2) {
					this.Jumps++
				}
				t.split('').forEach((x) => {
					switch (x) {
						case 'M':
							this.Mines++
							break
						case '1':
							this.Steps++
							break
						case '2':
							this.Holds++
							break
						case '4':
							this.Rolls++
							break
					}
				})
			})
		})
		this.Steps += this.Holds + this.Rolls - this.Jumps - this.Hands
	}

	toString() {
		let content: string[] = []

		content.push('')
		content.push(`//---------------${StepsTypeToString[this.ChartType]} - ${this.Description}----------------`)
		content.push('#NOTES:') // song.m_vsKeysoundFile.empty() ? "#NOTES:" : "#NOTES2:"
		content.push(`     ${StepsTypeToString[this.ChartType]}:`)
		content.push(`     ${this.Description}:`)
		content.push(`     ${StepsDifficultyString[this.Difficulty]}:`)
		content.push(`     ${this.Meter}:`)
		content.push(`     ${this.GrooveRadar.map((x) => x.toFixed(3)).join(',')}:`)
		content.push(
			this.NoteData.split(',')
				.map((measure) => {
					let chunk: string[] = []
					for (let i = 0; i < measure.length; i += 4) {
						chunk.push(measure.slice(i, i + 4))
					}
					return chunk.join('\r\n')
				})
				.join('\r\n,\r\n')
		)
		content.push(';')

		return content.join('\n')
	}
}

export class Song {
	constructor(data: string[]) {
		const msd = new MSDFile(data)

		let i = 0
		while (i < msd.GetNumValues()) {
			let params = msd.GetValue(i)
			let value_name = msd.GetParam(i, 0).toUpperCase()

			switch (value_name) {
				case 'TITLE':
					this.MainTitle = params[1]
					break
				case 'SUBTITLE':
					this.SubTitle = params[1]
					break
				case 'ARTIST':
					this.Artist = params[1]
					break
				case 'TITLETRANSLIT':
					this.MainTitleTranslit = params[1]
					break
				case 'SUBTITLETRANSLIT':
					this.SubTitleTranslit = params[1]
					break
				case 'ARTISTTRANSLIT':
					this.ArtistTranslit = params[1]
					break
				case 'GENRE':
					this.Genre = params[1]
					break
				case 'CREDIT':
					this.Credit = params[1]
					break
				case 'BANNER':
					this.BannerFile = params[1]
					break
				case 'BACKGROUND':
					this.BackgroundFile = params[1]
					break
				case 'LYRICSPATH':
					this.LyricsFile = params[1]
					break
				case 'CDTITLE':
					this.CDTitleFile = params[1]
					break
				case 'MUSIC':
					this.MusicFile = params[1]
					break
				case 'MUSICLENGTH':
					this.MusicLengthSeconds = parseFloat(params[1])
					break
				case 'MUSICBYTES':
					break // Ignore
				case 'FIRSTBEAT':
					this.FirstBeat = params[1] ? parseFloat(params[1]) : 0
					break
				case 'LASTBEAT':
					this.LastBeat = params[1] ? parseFloat(params[1]) : 0
					break
				case 'SONGFILENAME':
					this.SongFileName = params[1]
					break
				case 'HASMUSIC':
					this.HasMusic = params[1] !== undefined
					break
				case 'HASBANNER':
					this.HasBanner = params[1] !== undefined
					break
				case 'SAMPLESTART':
					this.SampleStart = parseFloat(params[1])
					break
				case 'SAMPLELENGTH':
					this.SampleLength = parseFloat(params[1])
					break
				case 'DISPLAYBPM':
					{
						if (params[1] == '*') {
							this.DisplayBPMType = SongBPMDisplay.RANDOM
						} else {
							this.DisplayBPMType = SongBPMDisplay.SPECIFIED
							this.SpecifiedBPMMin = parseFloat(params[1]) || undefined
							if (params[2].trim()) {
								this.SpecifiedBPMMax = this.SpecifiedBPMMin
							} else {
								this.SpecifiedBPMMax = parseFloat(params[2]) || undefined
							}
						}
					}
					break
				case 'SELECTABLE':
					{
						if (params[1].trim()) {
							if (params[1] == 'YES') {
								this.SelectionDisplay = SongSelectable.SHOW_ALWAYS
							} else if (params[1] == 'NO') {
								this.SelectionDisplay = SongSelectable.SHOW_NEVER
							} else if (params[1] == 'ROULETTE') {
								this.SelectionDisplay = SongSelectable.SHOW_ROULETTE
							}
						}
					}
					break
				case 'BGCHANGES':
					{
						for (let bgchange of params[1].split(',')) {
							if (bgchange.trim()) this.BGChanges.push(new BGAnimation(bgchange))
						}
					}
					break
				case 'BETTERBGCHANGES':
					{
						// this.ForNotITG = true;
						for (let betterbgchange of params[1].split(',')) {
							if (betterbgchange.trim()) this.BetterBGChanges.push(new BGAnimation(betterbgchange))
						}
					}
					break
				case 'FGCHANGES':
					{
						for (let fgchange of params[1].split(',')) {
							if (fgchange.trim()) this.FGChanges.push(new BGAnimation(fgchange))
						}
					}
					break

				case 'NOTES':
					{
						if (params.length < 7) {
							console.error('(#NOTES) Expected at least 7 fields, got ' + params.length)
							break
						}

						let steps = new Steps()

						if (params[1] == 'dance-single') steps.ChartType = StepsType.DANCE_SINGLE
						else if (params[1] == 'dance-double') steps.ChartType = StepsType.DANCE_DOUBLE
						else {
							console.error('(#NOTES) Invalid or unhandled step type')
							break
						}

						steps.Description = params[2]
						steps.Difficulty = StepsDifficulty[params[3] as keyof typeof StepsDifficulty]
						steps.Meter = parseFloat(params[4])

						let radarIndex = 0
						for (let radarMeter of params[5].split(','))
							steps.GrooveRadar[radarIndex++] = parseFloat(radarMeter)

						steps.ParseNotedata(params[6])
						if (this.Steps[steps.Difficulty] === undefined) this.Steps[steps.Difficulty] = []
						this.Steps[steps.Difficulty].push(steps)
					}
					break

				case 'BPMS':
					{
						for (let bpmchange of params[1].split(',')) {
							const values = bpmchange.split('=')
							if (values.length !== 2) continue

							this.BPMs[parseFloat(values[0])] = parseFloat(values[1])
						}
					}
					break

				case 'OFFSET':
					{
						this.Beat0OffsetInSeconds = parseFloat(params[1])
					}
					break

				case 'FREEZES':
				case 'STOPS':
					{
						for (let stops of params[1].split(',')) {
							const values = stops.split('=')
							if (values.length !== 2) continue

							this.Stops[parseFloat(values[0])] = parseFloat(values[1])
						}
					}
					break

				default:
					this.Miscellaneous[value_name] = params
						.slice(1)
						.filter((x) => x.trim())
						.join(':')
					break
			}

			i++
		}
	}

	BGChanges: BGAnimation[] = []
	BetterBGChanges: BGAnimation[] = []
	FGChanges: BGAnimation[] = []

	MainTitle = ''
	SubTitle = ''
	Artist = ''
	MainTitleTranslit = ''
	SubTitleTranslit = ''
	ArtistTranslit = ''
	Genre = ''
	Credit = ''
	BannerFile = ''
	BackgroundFile = ''
	LyricsFile = ''
	CDTitleFile = ''
	MusicFile = ''
	MusicLengthSeconds = 0
	FirstBeat = 0
	LastBeat = 0
	SongFileName = ''
	HasMusic = false
	HasBanner = false
	SampleStart = 0
	SampleLength = 0

	DisplayBPMType: SongBPMDisplay = SongBPMDisplay.ACTUAL
	SpecifiedBPMMin: number | undefined = undefined
	SpecifiedBPMMax: number | undefined = undefined

	Beat0OffsetInSeconds = 0
	Stops: { [key: number]: number } = {}
	BPMs: { [key: number]: number } = {}

	SelectionDisplay: SongSelectable = SongSelectable.SHOW_ALWAYS

	Steps: { [key: number]: Steps[] } = {}

	Miscellaneous: { [key: string]: string } = {}

	toString() {
		let content: string[] = []

		content.push(`#TITLE:${this.MainTitle};`)
		content.push(`#SUBTITLE:${this.SubTitle};`)
		content.push(`#ARTIST:${this.Artist};`)
		content.push(`#TITLETRANSLIT:${this.MainTitleTranslit};`)
		content.push(`#SUBTITLETRANSLIT:${this.SubTitleTranslit};`)
		content.push(`#ARTISTTRANSLIT:${this.ArtistTranslit};`)
		content.push(`#GENRE:${this.Genre};`)
		content.push(`#CREDIT:${this.Credit};`)
		content.push(`#BANNER:${this.BannerFile};`)
		content.push(`#BACKGROUND:${this.BackgroundFile};`)
		content.push(`#LYRICSPATH:${this.LyricsFile};`)
		content.push(`#CDTITLE:${this.CDTitleFile};`)
		content.push(`#MUSIC:${this.MusicFile};`)
		content.push(`#OFFSET:${this.Beat0OffsetInSeconds.toFixed(3)};`)
		content.push(`#SAMPLESTART:${this.SampleStart.toFixed(3)};`)
		content.push(`#SAMPLELENGTH:${this.SampleLength.toFixed(3)};`)

		let selectable
		switch (this.SelectionDisplay) {
			case SongSelectable.SHOW_ALWAYS:
				selectable = 'YES'
				break
			case SongSelectable.SHOW_NEVER:
				selectable = 'NO'
				break
			case SongSelectable.SHOW_ROULETTE:
				selectable = 'ROULETTE'
				break
		}
		content.push(`#SELECTABLE:${selectable};`)

		switch (this.DisplayBPMType) {
			case SongBPMDisplay.ACTUAL:
				break
			case SongBPMDisplay.SPECIFIED:
				{
					let display = `#DISPLAYBPM:${this.SpecifiedBPMMin!.toFixed(3)}`
					if (this.SpecifiedBPMMin === this.SpecifiedBPMMin) display += `:${this.SpecifiedBPMMax!.toFixed(3)}`
					content.push(display + ';')
				}
				break
			case SongBPMDisplay.RANDOM:
				content.push(`#DISPLAYBPM:*;`)
				break
		}

		content.push(
			`#BPMS:${Object.keys(this.BPMs)
				.map((startBPM) => {
					let endBPM = this.BPMs[+startBPM]
					return parseFloat(startBPM).toFixed(3) + '=' + endBPM.toFixed(3)
				})
				.join(',')};`
		)

		content.push(
			`#STOPS:${Object.keys(this.Stops)
				.map((startStop) => {
					let endStop = this.Stops[+startStop]
					return parseFloat(startStop).toFixed(3) + '=' + endStop.toFixed(3)
				})
				.join(',')};`
		)

		content.push(`#BGCHANGES:${this.BGChanges.map((x) => x.toString()).join(',')};`)
		if (this.BetterBGChanges.length)
			content.push(`#BETTERBGCHANGES:${this.BetterBGChanges.map((x) => x.toString()).join(',')};`)
		content.push(`#FGCHANGES:${this.FGChanges.map((x) => x.toString()).join(',')};`)

		Object.keys(this.Miscellaneous).forEach((key) => {
			content.push(`#${key}:${this.Miscellaneous[key]};`)
		})

		Object.keys(this.Steps).forEach((diff) => {
			const steps = this.Steps[parseFloat(diff)]
			if (steps.length) {
				steps.forEach((step) => {
					content.push(step.toString())
				})
			}
		})

		return content.join('\n')
	}
}
