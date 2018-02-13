const thrift = require('thrift-http');
const unirest = require('unirest');
const qrcode = require('qrcode-terminal');
const util = require("util");
const mime = require("mime");
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const request = require('request');


const LineService = require('../curve-thrift/LineService');
const {
  LoginResultType,
  IdentityProvider,
  ContentType,
  Message,
  LoginRequest
} = require('../curve-thrift/line_types');
const imgArr = ['png','jpg','jpeg','gif','bmp','webp'];


var config = require('./config');
var moment = require('moment');
var reqx = new LoginRequest();
var reqxy = new LoginRequest();

function isImg(param) {
    return imgArr.includes(param);
}


class LineAPI {
  constructor() {
    this.config = config;
    this.setTHttpClient();
	this.axz = false;
	this.axy = false;
	this.gdLine = "http://gd2.line.naver.jp";
	this.gdLine2 = "http://gf.line.naver.jp";
  }

  setTHttpClient(options = {
    protocol: thrift.TCompactProtocol,
    transport: thrift.TBufferedTransport,
    headers: this.config.Headers,
    path: this.config.LINE_HTTP_URL,
    https: true
  }) {
    options.headers['X-Line-Application'] = 'DESKTOPMAC 10.10.2-MFRLORDBOT-x64 MAC 4.5.0';
    this.options = options;
    this.connection =
      thrift.createHttpConnection(this.config.LINE_DOMAIN_3RD, 443, this.options);
    this.connection.on('error', (err) => {
      console.log('err',err);
      return err;
    });
		if(this.axz === true){
			this._channel = thrift.createHttpClient(LineService, this.connection);this.axz = false;
		} else if(this.axy === true){
			this._authService = thrift.createHttpClient(LineService, this.connection);this.axy = false;
		} else {
		    this._client = thrift.createHttpClient(LineService, this.connection);
		}
    
  }
  
  async _chanConn(){
	  this.options.headers['X-Line-Access'] = this.config.tokenn;
	  this.options.path = this.config.LINE_CHANNEL_PATH;
	  this.axz = true;
	  this.setTHttpClient(this.options);
	  return Promise.resolve();
  }
  
  async _authConn(){
	  this.axy = true;
	  this.options.path = this.config.LINE_RS;
      this.setTHttpClient(this.options);
	  return Promise.resolve();
  }

  async _tokenLogin(authToken, certificate) {
	this.options.path = this.config.LINE_COMMAND_PATH;
    this.config.Headers['X-Line-Access'] = authToken;config.tokenn = authToken;
    this.setTHttpClient(this.options);
    return Promise.resolve({ authToken, certificate });
  }

  _qrCodeLogin() {
    this.setTHttpClient();
    return new Promise((resolve, reject) => {
    this._client.getAuthQrcode(true, 'MFRLORD-PC',(err, result) => {
      const qrcodeUrl = `line://au/q/${result.verifier}`;
      console.info(`\n\nSilahkan Loginkan Link QR ini Untuk Mengambil TOKEN: ${qrcodeUrl}`)
      Object.assign(this.config.Headers,{ 'X-Line-Access': result.verifier });
        unirest.get('https://gd2.line.naver.jp/Q')
          .headers(this.config.Headers)
          .timeout(120000)
          .end(async (res) => {
            const verifiedQr = res.body.result.verifier;
			this._authConn();
			reqx.type = 1;
			reqx.verifier = verifiedQr;
			this._authService.loginZ(reqx,(err,success) => {
				config.tokenn = success.authToken;
				config.certificate = success.certificate;
				const authToken = config.tokenn;
			    const certificate = config.certificate;
                this.options.headers['X-Line-Access'] = config.tokenn;
                this.options.path = this.config.LINE_COMMAND_PATH;
                this.setTHttpClient(this.options);
			    this.options.headers['User-Agent'] = 'MFR-LORD';
			    this.axz = true;
			    this.setTHttpClient(this.options);
			    this.axz = false;
                resolve({ authToken, certificate, verifiedQr });
			})
          });
      });
    });
  }

  _checkLoginResultType(type, result) {
    this.config.Headers['X-Line-Access'] = result.authToken || result.verifier;
    if (result.type === LoginResultType.SUCCESS) {
      this.certificate = result.certificate;
      this.authToken = result.authToken;
    } else if (result.type === LoginResultType.REQUIRE_QRCODE) {
      console.log('require QR code');
    } else if (result.type === LoginResultType.REQUIRE_DEVICE_CONFIRM) {
      console.log('require device confirm');
    } else {
      throw new Error('unkown type');
    }
    return result;
  }
}

module.exports = LineAPI;