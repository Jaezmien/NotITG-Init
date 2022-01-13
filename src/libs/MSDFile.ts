export class MSDFile {
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

    private value_t: string[][] = [];
    GetNumValues(): number { return this.value_t.length }
    GetNumParams(val: number): number {
        if( val < 0 || val > this.value_t.length ) return 0;
        return this.value_t[ val ].length
    }
    GetValue(val: number): string[] {
        if( val < 0 || val > this.value_t.length ) return [];
        return this.value_t[ val ]
    }
    GetParam(val: number, par: number): string {
        if( val < 0 || val > this.value_t.length ) return "";
        if( par < 0 || par > this.value_t[ val ].length ) return "";
        return this.value_t[ val ][ par ]
    }
    
    constructor(buffer: string[]) {
        this.value_t = [];

        for(let index in buffer) {
            let line = buffer[ index ]
            buffer[ index ] = line.replace(/\/\/.+/g, "").trim();
        }

        let value_b: string[] = []; for(let i = 0; i < 32; i++ ) { value_b[i] = ""; }
        let value_i: number = 0;
        let is_reading: boolean = false;
        let buffer_value: string = "";

		const buffer_join = buffer.join("");
        for(let index = 0; index < buffer_join.length; index++) {
            let char = buffer_join[ index ]
            let is_special = false;

            if( char === "#" ) {
                if( is_reading ) {
                    is_reading = false;
                }
                if( buffer_value.length > 0 ) {
                    value_b[ value_i ] = buffer_value;
                    buffer_value = "";
                    value_i++;
                }
                if( value_b.length > 0 && value_b[0].trim() ) {
                    this.value_t.push( [...value_b] );
                    for(let i = 0; i < 32; i++ ) { value_b[i] = ""; }
                    value_i = 0;
                }
                is_special = true;
            }
            else if( char === ":" ) {
                value_b[ value_i ] = buffer_value;
                    buffer_value = "";
                    value_i++;
                is_special = true;
            }
            else if( char === ";" ) {
                is_reading = false;
                is_special = true;
            }

            if( !is_special ) {
                buffer_value += char;
            }
        }

        // Leftover
        if( is_reading ) {
            is_reading = false;
        }
        if( buffer_value.length > 0 ) {
            value_b[ value_i ] = buffer_value;
            buffer_value = "";
            value_i++;
        }
        if( value_b.length > 0 ) {
            this.value_t.push( [...value_b] );
            for(let i = 0; i < 32; i++ ) { value_b[i] = ""; }
            value_i = 0;
        }
    }
}