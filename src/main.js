const LineAPI = require('./api');
const request = require('request');
const fs = require('fs');
const unirest = require('unirest');
const webp = require('webp-converter');
const path = require('path');
const rp = require('request-promise');
const { Message, OpType, Location } = require('../curve-thrift/line_types');

class LINE extends LineAPI {

    get TokenBotLineKontol() {
        const LineLonte = ['INI HANYA DIGUNAKAN UNTUK MENGAMBIL TOKEN BOT LINE YANG LONTENYA HAKEKE'];
        return LineLonte; 
    }
         
}

module.exports = new LINE();