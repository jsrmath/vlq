(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.vlq = {}))
}(this, function (exports) { 'use strict';

	exports.decode = decode;
	exports.encode = encode;
	exports.decode8Bit = decode8Bit;
	exports.encode8Bit = encode8Bit;

	var charToInteger = {};
	var integerToChar = {};

	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function ( char, i ) {
		charToInteger[ char ] = i;
		integerToChar[ i ] = char;
	});

	function decode ( string ) {
		var result = [],
			len = string.length,
			i,
			hasContinuationBit,
			shift = 0,
			value = 0,
			integer,
			shouldNegate;

		for ( i = 0; i < len; i += 1 ) {
			integer = charToInteger[ string[i] ];

			if ( integer === undefined ) {
				throw new Error( 'Invalid character (' + string[i] + ')' );
			}

			hasContinuationBit = integer & 32;

			integer &= 31;
			value += integer << shift;

			if ( hasContinuationBit ) {
				shift += 5;
			} else {
				shouldNegate = value & 1;
				value >>= 1;

				result.push( shouldNegate ? -value : value );

				// reset
				value = shift = 0;
			}
		}

		return result;
	}

	function encode ( value ) {
		var result, i;

		if ( typeof value === 'number' ) {
			result = encodeInteger( value );
		} else {
			result = '';
			for ( i = 0; i < value.length; i += 1 ) {
				result += encodeInteger( value[i] );
			}
		}

		return result;
	}

	function encodeInteger ( num ) {
		var result = '', clamped;

		if ( num < 0 ) {
			num = ( -num << 1 ) | 1;
		} else {
			num <<= 1;
		}

		do {
			clamped = num & 31;
			num >>= 5;

			if ( num > 0 ) {
				clamped |= 32;
			}

			result += integerToChar[ clamped ];
		} while ( num > 0 );

		return result;
	}

	function encode8Bit ( num ) {
		var arr = [], i;

		if ( num === 0 ) {
			return new Buffer([0]);
		}

		// Break up num into groups of 7-bit values
		while ( num ) {
			arr.unshift(num & (127));
			num >>= 7;
		}

		// Flip MSB of all 7-bit values except the last one
		for ( i = 0; i < arr.length - 1; i += 1 ) {
			arr[i] += 128;
		}

		return new Buffer(arr);
	}

	function decode8Bit ( buffer ) {
		var num = 0, i;

		if ( !Buffer.isBuffer(buffer) ) {
			buffer = new Buffer(buffer);
		}

		for ( i = 0; i < buffer.length - 1; i += 1) {
			num += buffer[i] - 128;
			num <<= 7;
		}

		return num + buffer[buffer.length - 1];
	}

}));