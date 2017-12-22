/**
 * ES6 Javascript BitArray
 *
 * Bitwise manipulation library for strings exceeding 4Kb (32b)
 * Author: Yura Chaikovsky
 * Credits: https://github.com/bramstein/bit-array
 */

const INT_LENGTH = 32;

class BitArray {

    constructor(base) {
        if (!Number.isInteger(base)) {
            throw `BitArray should be initialized with integer length. '${base}' given.`;
        }

        const bitsGetter = (target, index) => {
            if (index < 0 || index > this.length - 1) {
                throw `Index '${index}' is out of range [0, ${this.length - 1}].`;
            }

            const wordsOffset = index / INT_LENGTH >> 0;
            const bitsOffset = index - wordsOffset * INT_LENGTH;
            return !!(this.wordsArray[wordsOffset] & (1 << bitsOffset));
        };
        const bitsSetter = (target, index, value) => {
            if (index < 0 || index > this.length - 1) {
                throw `Index '${index}' is out of range [0, ${this.length - 1}].`;
            }

            const wordsOffset = index / INT_LENGTH >> 0;
            const bitsOffset = index - wordsOffset * INT_LENGTH;
            if (value) {
                this.wordsArray[wordsOffset] |= (1 << bitsOffset);
            } else {
                this.wordsArray[wordsOffset] &= ~(1 << bitsOffset);
            }
        };

        this.length = base;
        this.wordsArray = new Uint32Array(Math.ceil(this.length / INT_LENGTH));
        this.bits = new Proxy({}, {get: bitsGetter, set: bitsSetter});
    }

    setValue(newValueArray) {
        if (newValueArray.length !== this.wordsArray.length) {
            throw 'Length of setter array must match BitArray length.';
        }
        newValueArray.forEach((int, index) => this.wordsArray[index] = int);
    }

    toString(radix = 36) {
        const res = [];
        const padTargetLength = Math.ceil(INT_LENGTH * Math.log(2) / Math.log(radix));
        this.wordsArray.forEach(num => res.push(num.toString(radix).padStart(padTargetLength, '0')));
        return res.reverse().join(' ');
    }

    weight() {
        let weight = 0;
        this.wordsArray.forEach(int => {
            int = int - ((int >> 1) & 0x55555555);
            int = (int & 0x33333333) + ((int >> 2) & 0x33333333);
            int = int + (int >> 4);
            int &= 0xF0F0F0F;
            weight += (int * 0x01010101) >> 24;
        });
        return weight;
    }

    leftShift(value) {
        if (value > this.wordsArray.length * INT_LENGTH - 1) {
            throw `BitArray can not be shifted more than its size - 1 (${this.wordsArray.length * INT_LENGTH - 1}), given ${value}.`;
        }

        const wordsOffset = value / INT_LENGTH >> 0;
        const bitsOffset = value - wordsOffset * INT_LENGTH;
        let index = this.wordsArray.length;

        while (--index >= 0) {
            this.wordsArray[index] = (index - wordsOffset >= 0) ? this.wordsArray[index - wordsOffset] : 0;
            this.wordsArray[index] <<= bitsOffset;

            if (bitsOffset && index - wordsOffset - 1 >= 0) {
                this.wordsArray[index] |= this.wordsArray[index - wordsOffset - 1] >>> (INT_LENGTH - bitsOffset);
            }
        }

        return this;
    }

    not() {
        this.wordsArray.forEach((int, index, arr) => arr[index] = ~int);
        return this;
    }

    and(bitArray) {
        if (this.wordsArray.length !== bitArray.wordsArray.length) {
            throw `BitArray AND can not be applied to array with different length, given ${this.wordsArray.length} and ${bitArray.wordsArray.length}.`;
        }
        this.wordsArray.forEach((int, index, arr) => arr[index] &= bitArray.wordsArray[index]);
        return this;
    }

    or(bitArray) {
        if (this.wordsArray.length !== bitArray.wordsArray.length) {
            throw `BitArray OR can not be applied to array with different length, given ${this.wordsArray.length} and ${bitArray.wordsArray.length}.`;
        }
        this.wordsArray.forEach((int, index, arr) => arr[index] |= bitArray.wordsArray[index]);
        return this;
    }

    xor(bitArray) {
        if (this.wordsArray.length !== bitArray.wordsArray.length) {
            throw `BitArray XOR can not be applied to array with different length, given ${this.wordsArray.length} and ${bitArray.wordsArray.length}.`;
        }
        this.wordsArray.forEach((int, index, arr) => arr[index] ^= bitArray.wordsArray[index]);
        return this;
    }

    static parse(serializedBitArray, radix = 36) {
        const wordsArray = serializedBitArray.split(' ').reverse().map(word => parseInt(word, radix));
        const bitArray = new this(wordsArray.length * INT_LENGTH);
        bitArray.setValue(wordsArray);
        return bitArray;
    }

}

module.exports = BitArray;