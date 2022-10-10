$(function() {
  //=========================================================================
  // polyfill
  //=========================================================================
  if (typeof Object.assign !== 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, varArgs) { // .length of function is 2
        'use strict';
        if (target === null || target === undefined) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource !== null && nextSource !== undefined) {
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return kValue.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return undefined.
        return undefined;
      },
      configurable: true,
      writable: true
    });
  }

  //=========================================================================
  // モジュール
  //=========================================================================
  /**
   * Lib
   */
  var Lib = {
    ua: {
      /**
       * PCか調べます
       *
       * @return {boolean} PCか？(true: PC, false: PC以外)
       */
      isFromPc: function () {
        var browserInfo = Lib.ua.getBrowserInfo();
        switch (browserInfo.os) {
          case 'Windows':
          case 'Mac':
            return true;

          default:
            return false;
        }
      },
      /**
       * Andoridか調べます
       *
       * @return {boolean} Androidか？(true: Android, false: Android以外)
       */
      isFromAndroidOs: function () {
        var browserInfo = Lib.ua.getBrowserInfo();
        switch (browserInfo.os) {
          case 'Android':
            return true;

          default:
            return false;
        }
      },
      /**
       * iOSか調べます
       *
       * @return {boolean} iOSか？(true: iOS, false: iOS以外)
       */
      isFromIos: function () {
        var browserInfo = Lib.ua.getBrowserInfo();
        switch (browserInfo.os) {
          case 'iOS':
          case 'iPadOS':
            return true;

          default:
            return false;
        }
      },
      /**
       * Chromeか調べます
       *
       * @return {boolean} Chromeか？(true: Chrome, false: Chrome以外)
       */
      isChrome: function () {
        var browserInfo = Lib.ua.getBrowserInfo();
        switch (browserInfo.name) {
          case 'Chrome':
            return true;

          default:
            return false;
        }
      },
      /**
       * safariか調べます
       *
       * @return {boolean} safariか？(true: safari, false: safari以外)
       */
      isSafari: function () {
        var browserInfo = Lib.ua.getBrowserInfo();
        switch (browserInfo.name) {
          case 'Safari':
            return true;

          default:
            return false;
        }
      },
      CheckBrowserResult: window.CheckBrowserResult,
      allowedBrowserSettings: window.CHECKER_SETTINGS.allowedBrowserSettings,
      /**
       * 使用可能なブラウザか調べます
       *
       * @return {Lib.ua.CheckBrowserResult} 使用可能か(Lib.ua.CheckBrowserResult.OK: 使用可能, !Lib.ua.CheckBrowserResult.OK: 使用不可能)
       */
      checkBrowser: function checkBrowser() {
        var browserInfo = Lib.ua.getBrowserInfo();

        var allowedBrowserSettings = Lib.ua.allowedBrowserSettings;
        // OSとブラウザの組み合わせを連想配列に変換する
        var map = {}
        for (var i = 0; i < allowedBrowserSettings.length; i ++) {
          var setting = allowedBrowserSettings[i];

          if (!map[setting.os]) {
            map[setting.os] = {}
          }
          if (map[setting.os][setting.name]) {
            // 設定が複数ある場合はプログラムのエラー
            console.error('allowedBrowserSettingsに同じ設定が存在します!!(os:' + setting.os + ', browser:' + setting.name + ')')
          }
          map[setting.os][setting.name] = setting
        }

        // OSチェック
        if (!map[browserInfo.os]) {
          return Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_OS
        }

        // ブラウザチェック
        if (!map[browserInfo.os][browserInfo.name]) {
          return Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_BROWSER
        }

        // OSバージョン & ブラウザバージョン チェック
        var setting = map[browserInfo.os][browserInfo.name];
        if (setting.customCheck) {
          return setting.customCheck(setting, browserInfo)
        } else {
          if (browserInfo.osVersion < setting.osVersion) {
            return Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_OS_VERSION
          }
          if (browserInfo.version < setting.version) {
            return Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_BROWSER_VERSION
          }
          return Lib.ua.CheckBrowserResult.OK
        }
      },
      /**
       * バージョン文字列を浮動小数点数に変換する
       *
       * @param {string} versionString
       * @return {number}
       * @private
       */
      toFloatFromVersionString: function (versionString) {
        var sep = versionString.indexOf('_') !== -1
          ? '_'
          : '.';
        var numbers = versionString.split(sep);
        var major = (numbers.length > 0)
          ? (numbers.shift() - 0)
          : 0
        var minor = (numbers.length > 0)
          ? (('0.' + numbers.join('')) - 0)
          : 0.0
        return major + minor;
      },
      /**
       * ユーザエージェント解析用モジュール
       *
       * @private
       */
      userAgentAnalyzer: {
        /**
         * OSバージョン
         */
        osVersion: (function () {
          var
          template =  function(regex) {
            return function (userAgent) {
              var matched = userAgent.match(regex);
              if (!matched || matched.length <= 1) {
                return 0
              }

              return Lib.ua.toFloatFromVersionString(matched[1])
            }
          };

          return {
            windows: function(userAgent) {
              // @see http://www9.plala.or.jp/oyoyon/html/script/platform.html

              if (userAgent.match(/Win(dows )?NT 6\.3/)) {
                return 8.1; // Windows 8.1 の処理 (Windows Server 2012 R2)
              }

              return template(/Windows NT ([0-9.]+)/i)(userAgent)
            },
            android: template(/Android ([0-9.]+)/i),
            mac:     template(/Mac OS X ([0-9_]+)/i),
            iOS:     template(/OS ([0-9_]+) like Mac OS X/i),
            iPadOS:  template(/OS ([0-9_]+) like Mac OS X/i),
          }
        }()),
      },
      /**
       * ブラウザ情報を取得します
       *
       * @return {object} ブラウザ情報
       */
      getBrowserInfo: function getBrowserInfo() {
        var userAgent = navigator.userAgent;
        var result = {
          os: '',
          osVersion: 0,
          name: '',
          version: 0,
        };

        var match = userAgent.match(/(opera|chrome|crios|safari|ucbrowser|firefox|msie|trident|edge|edg(?=\/))\/?\s*([\d\.]+)/i) || [];

        // ブラウザ名
        var tem = null;
        if (/trident/i.test(match[1])) {
          tem = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
          result.name = 'Internet Explorer';
        } else if (match[1] === 'Chrome') {
          tem = userAgent.match(/\b(OPR|Edge|Edg)\/(\d+)/);
          if (tem && tem[1]) {
            result.name = (tem[0].indexOf('Edge') === 0 || tem[0].indexOf('Edg') === 0) ? 'Edge' : 'Opera';
          }
        } else if (match[1] === 'Safari') {
          result.name = 'Safari';
        }
        if (!result.name) {
          tem = userAgent.match(/version\/(\d+)/i); // iOS support
          result.name = match[0].replace(/\/.*/, '');

          if (result.name.indexOf('MSIE') === 0) {
            result.name = 'Internet Explorer';
          }
          if (userAgent.match('CriOS')) {
            result.name = 'Chrome';
          }
        }

        // ブラウザバージョン
        if (result.name == 'Safari') {
          var versionMatch = userAgent.match(/version\/([\d\.]+)/i);
          result.version = (versionMatch && versionMatch.length > 1)
            ? Lib.ua.toFloatFromVersionString(versionMatch[1])
            : Lib.ua.toFloatFromVersionString(match[match.length - 1])
        } else {
          result.version = Lib.ua.toFloatFromVersionString(match[match.length - 1]);
        }

        // OS名 / OSバージョン
        if (userAgent.match(/Android/i)) {
          result.os = 'Android';
          result.osVersion = Lib.ua.userAgentAnalyzer.osVersion.android(userAgent)
        } else if (userAgent.match(/iPhone|iPad|iPod/i)) {
          result.os = 'iOS';
          result.osVersion = Lib.ua.userAgentAnalyzer.osVersion.iOS(userAgent)
        } else if (userAgent.match(/Windows/i)) {
          result.os = 'Windows';
          result.osVersion = Lib.ua.userAgentAnalyzer.osVersion.windows(userAgent)
        } else if (userAgent.match(/Macintosh/i)) {
          if (result.name === 'Safari' && typeof document.ontouchstart !== 'undefined') {
            result.os = 'iPadOS';
            result.osVersion = Lib.ua.userAgentAnalyzer.osVersion.iPadOS(userAgent)
          } else {
            result.os = 'Mac';
            result.osVersion = Lib.ua.userAgentAnalyzer.osVersion.mac(userAgent)
          }
        }

        return result;
      },
    },
    /**
     * ポップアップが使用可能かチェックします
     *
     * 注意点:ユーザのクリック操作では、ブラウザ操作によるwindow.open()関数呼び出しは成功する
     * そのため、Lib.checkPopupBlocker()関数でこのタイミングでユーザが動的にポップアップブロック操作を行っても検知することはできない。
     *
     * @param {(success: boolean) => void} callback
     *                                       success: 使用可能か返します(true:使用可能, false:使用不可能)
     * @see https://developer.mozilla.org/ja/docs/Web/API/Window/open
     */
    checkPopupBlocker: function checkPopupBlocker(callback) {
      if (Lib.parseUrlQuery().iframe) {
        var receiveMessage = function (event) {
          // オリジンチェックは行わない
          //if (event.origin !== location.origin) {
          //  return;
          //}

          var result = event.data ? !!event.data.result : false
          callback(result)

          window.removeEventListener('message', receiveMessage, false)
        };
        window.addEventListener('message', receiveMessage, false)
        window.parent.postMessage({request: 'popup_check'}, '*');
      } else {
        setTimeout(function() {
          var popUp = window.open('', '_blank', 'top=-100,left=-100,width=100,height=100,menubar=no,toolbar=no,location=no,resizable=no,directories=no');
          if (popUp === null || typeof popUp === 'undefined') {
            callback(false);
          } else {
            popUp.close();
            callback(true);
          }
        }, 1);
      }
    },
    /**
     * サービスワーカーをセットアップします
     *
     * ローカル環境で証明書の問題で動作確認が取れない場合、以下のサイトを参考にブラウザの引数でSSL証明書を許容するショートカットを作成してください。({{ユーザー名}}は適宜変更してください)
     * `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://sample.mc-plus.jp --allow-insecure-localhost --user-data-dir=C:\Users\{{ユーザー名}}\Desktop\test`
     * @see https://qiita.com/motojouya/items/e4e0f0489ae019f156c3
     *
     * @return {Promise<boolean>} このセットアップはreject()をしませんつねにresolve()のみ返します
     */
    startupServiceWorker: function() {
      if (!'serviceWorker' in navigator) {
        return Promise.resolve(false)
      }

      return new Promise(function(resolve) {
        (new Promise(function(resolve) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            return resolve(Promise.all(registrations.map(function(v) { return v.unregister() })))
          })
        }))
        .finally(function() {
          try {
            navigator.serviceWorkers.register("./proctor-1.0.0-sw.js")
              .then(function() {
                console.log('register');
                return navigator.serviceWorkers.ready;
              })
              .then(function(registration) {
                console.log('ready');
                if (registration.active) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              })
              .catch(function(e) {
                console.log(e)
                return resolve(false)
              })
          } catch(err) {
            resolve(false)
          }
          
        })
      })
    },
    /**
     * 通知が使用可能かチェックします
     *
     * @param {(success: boolean) => void} callback
     *                                       success: 使用可能か返します(true:使用可能, false:使用不可能)
     * @see https://developer.mozilla.org/ja/docs/Web/API/Notification
     */
    askForNPerm: function askForNPerm(callback) {
      var func = function(permission) {
        console.log(permission);
        if (permission == 'denied') {
          callback(false);
        } else if (permission == 'granted') {
          callback(true);
        }
      };

      // TODO: iPad等、window.Notificationが対応していないデバイスをはじく
      if (!window.Notification) {
        func('denied')
        return;
      }

      if (Notification.permission === 'granted') {
        func('granted')
        return;
      }

      // TODO: iPad等、window.Notificationが対応していないデバイスをはじく
      if (!window.Notification.requestPermission) {
        func('denied')
        return;
      }

      try {
        Notification.requestPermission()
          .then(func);
      } catch (e) {
        // safariの場合、promiseに対応していないため、
        // 例外が発生したら、コールバック仕様のメソッドを試す
        Notification.requestPermission(func);
      }
    },
    /**
     * 通常の通知
     *
     * @param {{
     *          title: string;
     *          options: object;
     *        }} params
     * @return {Promise<Notification>}
     * @see front/plugins/kvs/type/sendMessageType.ts MessageObject
     * @see https://developer.mozilla.org/ja/docs/Web/API/Notification
     */
    showNotification: function(params) {
      try {
        var notification = new Notification(params.title, params.options);

        return Promise.resolve(notification)
      } catch (e) {
        return Promise.reject(e)
      }
    },
    /**
     * ServiceWorkerを使った通知
     *
     * @param {{
     *          title: string;
     *          options: object;
     *        }} params
     * @return {Promise<Notification>}
     * @see front/plugins/kvs/type/sendMessageType.ts MessageObject
     * @see https://developer.mozilla.org/ja/docs/Web/API/ServiceWorkerRegistration/showNotification
     */
    showNotificationByServiceWorker: function(params) {
      if (!'serviceWorker' in navigator) {
        return Promise.reject('[LOG INFO] serviceWorker is not exist!')
      }
      if (!navigator.serviceWorker.controller) {
        return Promise.reject('[LOG INFO] serviceWorker controller is not exist! ')
      }

      return new Promise(function(resolve, reject) {
        navigator.serviceWorker.ready.then(function(registration) {
          var afterEvent = function() {
            var timerId = null,
                init = null,
                final = null,
                handler = null;

            init = function () {
              timerId = setTimeout(function() {
                final()

                reject(new Error('[LOG INFO] Notification is not found!(reason: timeout)'))
              }, 5000)
              navigator.serviceWorker.addEventListener('message', handler);
            };
            final = function() {
              if (timerId) {
                clearTimeout(timerId)
                timerId = null
              }
              navigator.serviceWorker.removeEventListener('message', handler)
            };
            handler = function (event) {
              console.log(event)

              var request = event.data.request
              switch (request) {
                case 'notification_result':
                  var result = event.data.result
                  if (!result) {
                    final()
                    return reject(new Error('[LOG INFO] Notification is not found!'))
                  }

                  // 通知を検索して直前に送信したNotificationを取得する
                  var options = {tag: params.options.tag}; // TODO: 通知タグはもし、使っているようであれば指定する。この通知タグはほかでも使いそうなので、
                  registration.getNotifications(options).then(function(notifications) {
                    var sortedNotifications = notifications
                      .slice(0)
                      .sort(function(l, r) { return - (l.timestamp - r.timestamp) })

                    for (var i = 0; i < sortedNotifications.length; i ++) {
                      var v = sortedNotifications[i];
                      if (v.title === params.title) {
                        console.log('[LOG INFO] Notification is found!')
                        final()
                        return resolve(v)
                      }
                    }

                    final()
                    return reject(new Error('[LOG INFO] Notification is not found!'))
                  })
                  break;
              }
            };

            init()
          };

          afterEvent()
        })
        .finally(function() {
          // ServiceWorkerに通知表示を依頼
          navigator.serviceWorker.controller.postMessage({
            request: 'notification',
            params: params,
          })
        })

      })
    },
    /**
     * ストレージブロックチェック処理
     *
     * @return {boolean}
     */
    checkStorage: function checkStorage() {
      //localStorage へダミーデータを書き込み、使用可能かどうかを事前チェックする
      var check = function(storageName, dataSize){
        try {
          var storage = window[storageName]
          var data = '';
          if(!data.padStart) {
            while(data.length < dataSize) {
              data = data + 'xxxxxxxxxx';
            }
          } else {
            data = data.padStart(dataSize, 'x');
          }

          var result = true
          try {
            storage.setItem('prepare', data);
          } catch(e) {
            result = false
          }
          try {
            var v = storage.getItem('prepare');
            if (v !== data) {
              throw new Error()
            }
          } catch(e) {
            result = false
          }
          try {
            storage.removeItem("prepare");
          } catch(e) {
            result = false
          }

          return result
        } catch (e) {
          // nop
        }
      };

      var dataSize = 2 * 1024 * 1024; // サイズは適当 アプリの要件に合わせて適切に変えること
      var results = [
        check('localStorage', dataSize),
        check('sessionStorage', dataSize),
      ]
      if (results.some(function (v) { return !v})) {
        return false;
      } else {
        return true;
      }
    },
    /**
     * メディアデバイスモジュール
     *
     * @see https://developer.mozilla.org/ja/docs/Web/API/MediaDevices
     */
    mediaDevices: (function() {
      var polyfill = {
        /**
         * カメラ等のメディアデバイスが使用可能かチェックします
         *
         * @param {object} constraints 関連リンク参照
         * @param {(mediaStream: MediaStream | null) => void} callback
         *                                                      mediaStream: デバイスメディアのストリーム(MediaStream: デバイスあり, null: デバイスなし)
         * @see https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia
         */
        getUserMedia: function(constraints, callback) {
          try {
            navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
              getUserMedia: function(c) {
                return new Promise(function(y, n) {
                  (navigator.mozGetUserMedia ||
                      navigator.webkitGetUserMedia).call(navigator, c, y, n);
                });
              }
            } : null);
            navigator.mediaDevices
              .getUserMedia(constraints)
              .then(function(stream) {
                callback(stream);
              })
              .catch(function(err) {
                callback(null);
              })
          } catch (e) {
            navigator.getUserMedia = navigator.getUserMedia ||
              navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia;
            if (navigator.getUserMedia) {
              navigator.getUserMedia(
                constraints,
                function(stream) {
                  callback(stream);
                },
                function(err) {
                  callback(null);
                }
              );
            } else {
              callback(null);
            }
          }
        },
        /**
         * getUserMedia()で取得したMediaStreamを解放するためのメソッド
         *
         * このメソッドはgetUserMedia()と必ずしも対で呼び出す必要はないとは思うが、
         * 正直わからない。
         *
         * @param {MediaStream | null} mediaStream
         */
        releaseUserMedia: function(mediaStream) {
          if (mediaStream == null) {
            return
          }

          mediaStream.getTracks().forEach(function(track) {
            track.stop()
          })
        },
        /**
         * メディアデバイスを列挙します
         *
         * @return {Promise<MediaDeviceInfo>}
         * @see https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/enumerateDevices
         * @private
         */
        enumerateDevices: function() {
          if (!window.navigator.mediaDevices) {
            return Promise.reject(new Error('navigator.mediaDevicesがありません。'))
          }
          if (!window.navigator.mediaDevices.enumerateDevices) {
            return Promise.reject(new Error('navigator.mediaDevices.enumerateDevicesがありません。'))
          }

          return new Promise(function(resolve, reject) {
            // TODO: safariでは、mediaDevices.enumerateDevices()をコールする前にmediaDevices.getUserMedia()を実行しておく必要がある
            // ↓ の「セキュリティ的な関係で、アクティブなメディアストリームが存在するか、メディアデバイスへの継続的な権限をユーザが付与しない限り、」云々のことだと思う
            // @see https://developer.mozilla.org/ja/docs/Web/API/MediaDeviceInfo
            polyfill.getUserMedia({video: true, audio: true}, function (mediaStream) {
              window.navigator.mediaDevices.enumerateDevices()
                .then(resolve)
                .catch(reject)
                .finally(function() {
                  polyfill.releaseUserMedia(mediaStream)
                  mediaStream = null
                })
            })
          })
        },
      };

      return {
        /**
         * デバイスを更新します
         *
         * @param {boolean} videoFlg
         * @param {boolean} audioFlg
         * @param {{
         *          // MDNを参考にしてください
         *        }} defaultResolution
         * @return {Promise<{
         *           isAllow: boolean,
         *           isEnableVideo: boolean,
         *           isEnableAudio: boolean,
         *           mediaStream: MediaStream | null,
         *         }>}
         */
        getMediaStream: function(videoFlg, audioFlg, defaultResolution) {
          defaultResolution = Object.assign({
            //frameRate: {
            //  min: 30,
            //  ideal: 60,
            //},
            facingMode: 'user',
          }, (defaultResolution || {}));

          return new Promise(function (resolve) {
            var resolution = videoFlg
              ? (defaultResolution || true)
              : false;

            var getVideo = function () {
              return new Promise(function (resolve, reject) {
                polyfill.getUserMedia({video: resolution}, function(videoStream) {
                  videoStream
                    ? resolve(videoStream)
                    : reject(null)
                })
              })
            };
            var getAudio = function () {
              return new Promise(function (resolve, reject) {
                polyfill.getUserMedia({audio: true}, function(audioStream) {
                  audioStream
                    ? resolve(audioStream)
                    : reject(null)
                })
              })
            };
            var getMedia = function () {
              return new Promise(function (resolve, reject) {
                polyfill.getUserMedia({video: resolution, audio: true}, function(mediaStream) {
                  mediaStream
                    ? resolve(mediaStream)
                    : reject(null)
                })
              })
            };
            var resolveMediaStream = function (result) {
              return function (mediaStream) {
                resolve({
                  isAllow: true,
                  isEnableVideo: result.isEnableVideo,
                  isEnableAudio: result.isEnableAudio,
                  mediaStream: mediaStream,
                })
              }
            };
            var rejectMediaStream = function (result) {
              return function (mediaStream) {
                resolve({
                  isAllow: false,
                  isEnableVideo: result.isEnableVideo,
                  isEnableAudio: result.isEnableAudio,
                  mediaStream: null,
                })
              }
            };
            var reject = function() {
              resolve({
                isAllow: false,
                isEnableVideo: false,
                isEnableAudio: false,
                mediaStream: null,
              })
            };

            if (videoFlg && audioFlg) {
              if (Lib.ua.isFromAndroidOs()) {
                getMedia()
                  .then(resolveMediaStream({ isEnableVideo: true, isEnableAudio: true }))
                  .catch(reject)
              } else {
                getVideo()
                  .then(function() {
                    getAudio()
                      .then(function() {
                        getMedia()
                          .then(resolveMediaStream({isEnableVideo: true, isEnableAudio: true}))
                          .catch(reject)
                      })
                      .catch(rejectMediaStream({isEnableVideo: true, isEnableAudio: false}))
                  })
                  .catch(function() {
                    getAudio()
                      .then(rejectMediaStream({isEnableVideo: false, isEnableAudio: true}))
                      .catch(reject)
                  });
              }
            } else if (videoFlg) {
              getVideo()
                .then(resolveMediaStream({ isEnableVideo: true, isEnableAudio: false }))
                .catch(reject);
            } else if (audioFlg) {
              getAudio()
                .then(resolveMediaStream({ isEnableVideo: false, isEnableAudio: true }))
                .catch(reject);
            }
          });
        },
        /**
         * メディアストリームを開放します
         *
         * @param {MediaStreamResultType | MediaStream | null} unknownObject
         */
        releaseMediaStream: function(unknownObject) {
          if (unknownObject == null) {
            return;
          }

          if (unknownObject.mediaStream) {
            return this.releaseMediaStream(unknownObject.mediaStream)
          }

          polyfill.releaseUserMedia(unknownObject)
        },
        /**
         * メディアデバイスを列挙してチェックします
         *
         * @param {(result: {success: boolean, videoSuccess, audioSuccess, videoInputs:[], audioInputs}) => void} callback
         *                                       success: 使用可能か返します(true:使用可能, false:使用不可能)
         *                                       videoSuccess: カメラが使用可能か返します(true:使用可能, false:使用不可能)
         *                                       audioSuccess: マイク使用可能か返します(true:使用可能, false:使用不可能)
         *                                       videoInputs: ソート済みのカメラデバイス情報
         *                                       audioInputs: ソート済みのマイクデバイス情報
         * @return {Promise<>}
         */
        getDeviceInfoList: function(callback) {
          callback = callback || function() {}

          return new Promise(function (resolve, reject) {
            polyfill.enumerateDevices()
              .then(function (devices) {
                Lib.mediaDevices.storage.setDevices(devices)

                var inputs = {},
                    videoInputs,
                    audioInputs,
                    result;

                devices.forEach(function (v) {
                  if (!v.deviceId || !v.label) {
                    return;
                  }

                  if (!inputs[v.kind]) {
                    inputs[v.kind] = [];
                  }
                  inputs[v.kind].push(v);
                });
                videoInputs = inputs['videoinput'] || []
                videoInputs.sort(function (l, r) { return l.label.localeCompare(r.label)})
                audioInputs = inputs['audioinput'] || []
                audioInputs.sort(function (l, r) { return l.label.localeCompare(r.label)})

                result = {
                  success: ((videoInputs.length > 0) && (audioInputs.length > 0)),
                  videoSuccess: (videoInputs.length > 0),
                  audioSuccess: (audioInputs.length > 0),
                  videoInputs: videoInputs,
                  audioInputs: audioInputs,
                };
                callback(result)
                resolve(result)
              })
              .catch(function (e) {
                var result = {
                  success: false,
                  videoSuccess: false,
                  audioSuccess: false,
                  videoInputs: [],
                  audioInputs: [],
                };
                callback(result);
                resolve(result)
              })
          })
        },
        /**
         * イベントハンドラを設定/解除します
         *
         * @param {Function} handler
         */
        onDeviceChange: function (handler) {
          $(window.navigator.mediaDevices).on('devicechange', handler)
        },
        /**
         *
         */
        storage: {
          /**
           * @var {MediaDeviceInfo[]}
           */
          devices: [],
          /**
           * 入出力メディアデバイスの情報を設定します
           *
           * @param {MediaDeviceInfo[]}
           */
          setDevices: function (devices) {
            Lib.mediaDevices.storage.devices = devices
          },
          /**
           * カレントなデバイスの情報を取得します
           *
           * @return {MediaDeviceInfo | null}
           */
          getCurrentVideoDeviceInfo: function() {
            var currentVideoDeviceId = Lib.mediaDevices.storage.getCurrentVideoDeviceId()
            if (currentVideoDeviceId == null) {
              return null;
            }
            var devices = Lib.mediaDevices.storage.devices;
            if (devices.length == 0) {
              return null
            }

            for (var i = 0; i < devices.length; i ++) {
              var v = devices[i];
              if (v.deviceId == currentVideoDeviceId) {
                return v;
              }
            }
            return null;
          },
          /**
           * カレントなデバイスIDを取得します
           *
           * @return {string | null}
           */
          getCurrentVideoDeviceId: function() {
            try {
              return window.localStorage.getItem('currentVideoDeviceId') || null
            } catch (e) {
              return null
            }
          },
          /**
           * カレントなデバイスIDを設定します
           *
           * @param {stringi | null} currentVideoDeviceId
           */
          setCurrentVideoDeviceId: function(currentVideoDeviceId) {
            try {
              if (currentVideoDeviceId == '' || currentVideoDeviceId == null) {
                window.localStorage.removeItem('currentVideoDeviceId')
              } else {
                window.localStorage.setItem('currentVideoDeviceId', currentVideoDeviceId)
              }
            } catch (e) {
            }
          },
          /**
           * mediaDevices.getMediaStream()のoptionを生成します
           *
           * @param {{
           *          pc: object;
           *          sp: object;
           *        }} params
           * @param {object} spOptions
           * @return {object}
           */
          makeMediaStreamOptions: function(params) {
            var defaultResolution = {
              //frameRate: {
              //  min: 30,
              //  ideal: 60,
              //},
              facingMode: 'user',
            };

            var currentVideoDeviceId = Lib.mediaDevices.storage.getCurrentVideoDeviceId()
            const result = Lib.ua.isFromPc()
              ? Object.assign({}, defaultResolution, (currentVideoDeviceId ? {deviceId: currentVideoDeviceId} : {}), params.pc)
              : Object.assign({}, defaultResolution, params.sp)

            return result
          },
        },
      };
    }()),
    /**
     * URLクエリをパースします
     *
     * @return {{[key:string] : string}}
     */
    parseUrlQuery: function() {
        // URLパラメータを"&"で分離する
        var url_search = location.search.substr(1).split('&');

        // パラメータ連想配列エリア初期化
        var para = [];

        // キーエリア初期化
        var key = null;

        for(var i = 0 ; i < url_search.length ; i++) {
            // "&"で分離したパラメータを"="で再分離
            key = url_search[i].split("=");
            // パラメータを連想配列でセット
            para[key[0]] = decodeURIComponent(key[1]);
        }

        // 連想配列パラメータを返す
        return (para);
    },
    /**
     * レコーダーモジュール
     *
     * @see front/plugins/s3/upload.ts
     */
    recorder: (function() {
      /** @var {object} */
      var s3Obj = {
        // Convert megabit/second to bit/second - https://www.convertunits.com/from/Mbps/to/bits/s
        defaultOptions: {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000, // 5000000 bits/s
          audioBitsPerSecond: 128000, // 128000 bits/s
          timeslice: 15000 // 15sec
        },
        chanks: [],
        mediaRecorder: null,
      };

      /**
       * モジュール
       */
      return {
        /**
         * アップロードします
         *
         * @param {MediaStream} stream
         * @param {{
         *          mimeType?: string,
         *          audioBitsPerSecond?: number, 
         *          videoBitsPerSecond?: number,
         *          timeslice?: number,
         *          videoRecordingPreference?: number,
         *          voiceQualityPreference?: number,
         *        }} options
         * @return {Promise<string>}
         */
       startRecord: function (stream, options) {
          return new Promise(function (resolve, reject) {
            try {
              s3Obj.chanks = [];

              var handlers = {
                dataavailable: function (event) {
                  if (event.data && event.data.size > 0) {
                    s3Obj.chanks.push(event.data);
                  }
                },
                stop: function (event) {
                  var blob = new Blob(s3Obj.chanks, { type: s3Obj.defaultOptions.mimeType });
                  s3Obj.chanks = [];
                  s3Obj.mediaRecorder = null;

                  resolve(blob);
                },
                error: function (event) {
                  /** @see https://developer.mozilla.org/ja/docs/Web/API/MediaRecorder/onerror */
                  console.error(event);
                  reject(new Error('メディアレコーダのエラーハンドルで致命的なエラーを取得しました。(event.error.name=' + event.error.name + ')'));
                },
              };

              s3Obj.defaultOptions = Object.assign(s3Obj.defaultOptions, options);
              s3Obj.defaultOptions.mimeType = Lib.recorder.tryGetSupportedMimeType(s3Obj.defaultOptions.mimeType);
              s3Obj.mediaRecorder = new MediaRecorder(stream, s3Obj.defaultOptions);
              Object.entries(handlers).forEach(function (v) { s3Obj.mediaRecorder.addEventListener(v[0], v[1]) })

              s3Obj.mediaRecorder.start(s3Obj.defaultOptions.timeslice); // timeslice
            } catch (e) {
              reject(new Error('メディアレコーダの初期化中にエラーが発生しました。(message=' + e.toString() + ')'));
            }
          });
        },
        /**
         * 録画を止めます
         *
         * @return {Promise<boolean>}
         */
        stopRecord: function() {
          if (s3Obj.mediaRecorder) {
            s3Obj.mediaRecorder.stop();
          }
        },
        /**
         * ブラウザがサポートしているmimetypeを取得します
         *
         * @private
         * @param {string} mimeType
         * @return {string}
         * @throws {Error} SafariはMediaRecorder.isTypeSupportedをサポートしていないため、
         */
        tryGetSupportedMimeType: function (mimeType) {
          try {
            if (MediaRecorder.isTypeSupported(mimeType)) {
              return mimeType;
            }
            mimeType = 'video/webm;codecs=vp8';
            if (MediaRecorder.isTypeSupported(mimeType)) {
              return mimeType;
            }
            mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported(mimeType)) {
              return mimeType;
            }
            mimeType = 'video/mp4';
            if (MediaRecorder.isTypeSupported(mimeType)) {
              return mimeType;
            }
            return '';
          } catch (e) {
            throw e;
          }
        },
      };
    }()),
    /**
     * URLオブジェクト
     */
    URL: (window.webkitURL || window.URL),
    /**
     * HTML要素のユーティリティ
     */
    htmlElementUtils: {
      videoElement: {
        /**
         * src/srcObject属性を設定します
         *
         * @param {HTMLVideoElement} videoElement
         * @param {MediaStream|Blob|File|null} src
         * @return {Promise<HTMLVideoElement>}
         */
        setSrcObject: function (videoElement, src) {
          return new Promise(function (resolve, reject) {
            var oldSrc

            // video要素のsrc属性に値が設定されていた場合後始末を行う/srcObjectの場合はnullを設定すればいいので、後始末は特に考慮しない
            videoElement.srcObject = null
            if (videoElement.src) {
              oldSrc = videoElement.src
              videoElement.src = ''
              if (oldSrc) {
                if (Lib.ua.isFromAndroidOs() && Lib.ua.isChrome()) {
                  // nop
                } else {
                  Lib.URL.revokeObjectURL(oldSrc);
                }
                oldSrc = '';
              }
            }
            try {
              if (!('srcObject' in videoElement)) {
                throw new Error()
              }
              if (src instanceof Blob) {
                throw new Error()
              }
              if (src instanceof File) {
                throw new Error()
              }

              // srcがMediaStreamの場合は問題ないが、Blobの場合ブラウザが未サポートのため、catch()ブロックに制御を流す
              // https://developer.mozilla.org/ja/docs/Web/API/HTMLMediaElement/srcObject
              videoElement.srcObject = src
              resolve(videoElement)
            } catch (e) {
              if (
                (src instanceof Blob) &&
                (Lib.ua.isFromAndroidOs() && Lib.ua.isChrome())
              ) {
                var reader = new FileReader();
                reader.onload = function(event) {
                  videoElement.src = reader.result
                  resolve(videoElement);
                };
                reader.onerror = function(event) {
                  videoElement.src = ''
                  resolve(videoElement);
                };
                reader.readAsDataURL(src);
              } else {
                videoElement.src = (src ? Lib.URL.createObjectURL(src) : '')
                resolve(videoElement)
              }
            }
          })
        },
      },
    },
  };
  /**
   * ビュー
   */
  var view = (function () {
    var ViewHelper = {
      /**
       * チェッカー画面の大枠のHTMLにjsを初期化します 主にshow/hideするためのラッパーです
       *
       * @param {object} settings
       * @return {object}
       */
      initFrame: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          WORD_ORIGIN: '.word-origin'
        };

        return {
          setupHTML: function () {
            var origin = location.origin;
            $(SELECTORS.WORD_ORIGIN).text(origin);
          },
          show: function () {
            return $(SELECTORS.ROOT).show();
          },
          hide: function() {
            return $(SELECTORS.ROOT).hide();
          },
        };
      },
      /**
       * VideoPlayerにjsを初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initVideoPlayer: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          VIDEO_WRAP: settings.selector + ' .video-wrap',
          VIDEO_TAG: settings.selector + ' .video-wrap video',
          VIDEO_MEDIA_INFO: settings.selector + ' .video-wrap .media-info',
        };

        return {
          /**
           * ビデオプレイヤーの情報表示を設定します
           *
           * @param {object} options
           */
          setVideoMediaInfo: function (options) {
            options = Object.assign({
              show: true,
              icon: '',
              status: '',
              text: '',
            }, options);

            var mediaInfo = $(SELECTORS.VIDEO_MEDIA_INFO);
            mediaInfo[options.show ? 'show' : 'hide']();
            mediaInfo.find('.fa').hide();
            mediaInfo.find('.fa-' + options.icon).show();
            mediaInfo.find('.media-status').text(options.status);
            mediaInfo.find('.media-text').text(options.text);
          },
          /**
           * メディアストリームをアタッチします
           *
           * @param {boolean} isEnableVideo
           * @param {MediaStream | Blob | null} src
           * @return {Promise<boolean>}
           */
          attachStream: function(isEnableVideo, src) {
            return new Promise(function(resolve, reject) {
              var videoElement,
                  attach = function (isEnableVideo) {
                    $(SELECTORS.ROOT).show();
                    if (isEnableVideo) {
                      $(SELECTORS.VIDEO_WRAP).show();
                      $(SELECTORS.VIDEO_MEDIA_INFO).show();
                    } else {
                      $(SELECTORS.VIDEO_WRAP).show();
                      $(SELECTORS.VIDEO_MEDIA_INFO).hide();
                    }
                  }

              if (isEnableVideo) {
                videoElement = $(SELECTORS.VIDEO_TAG).get(0);

                Lib.htmlElementUtils.videoElement.setSrcObject(videoElement, src)
                  .then(function() {
                    videoElement.onloadedmetadata = function(e) {
                      videoElement.play();
                    }
                    attach(isEnableVideo);
                    resolve(true)
                  })
              } else {
                videoElement = $(SELECTORS.VIDEO_TAG).get(0);
                videoElement.onloadedmetadata = function(e) {};
                Lib.htmlElementUtils.videoElement.setSrcObject(videoElement, null)
                  .then(function() {
                    attach(isEnableVideo);
                    resolve(true)
                  })
              }
            })
          },
          /**
           * メディアストリームをデタッチします
           *
           * @return {Promise<boolean>}
           */
          detachStream: function () {
            return this.attachStream(false, null);
          },
          /**
           * プレイヤーを再生します
           */
          play: function () {
            var videoElement = $(SELECTORS.VIDEO_TAG).get(0);
            videoElement.play();
          },
          /**
           * プレイヤーを一時停止します
           */
          pause: function () {
            var videoElement = $(SELECTORS.VIDEO_TAG).get(0);
            videoElement.pause();
          },
        };
      },
      /**
       * SELECTを初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initSelectBox: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          SELECT_BOX: settings.selector + ' select',
        };

        return {
          show: function () {
            return $(SELECTORS.ROOT).show();
          },
          hide: function() {
            return $(SELECTORS.ROOT).hide();
          },
          /**
           * オプションを設定します
           *
           * @param {{value: string, label: string}[]} options
           */
          setOptions: function(options) {
            $(SELECTORS.SELECT_BOX)
              .empty()

            options.forEach(function(v) {
              $(SELECTORS.SELECT_BOX)
                .append($('<option>').val(v.value).text(v.label))
            })
          },
          /**
           * 値を設定します
           *
           * @param {string} value
           */
          setValue: function(value) {
            $(SELECTORS.SELECT_BOX)
              .val(value)
          },
          /**
           * 値を取得します
           *
           * @return {string}
           */
          getValue: function() {
            return $(SELECTORS.SELECT_BOX)
              .val()
          },
          /**
           * 有効/無効を設定します
           *
           * @param {boolean} enabled
           */
          setEnabled: function(enabled) {
            $(SELECTORS.SELECT_BOX)
              .prop('disabled', !enabled)
          },
          /**
           * 有効/無効を取得します
           *
           * @return {boolean}
           */
          isEnabled: function(enabled) {
            return !$(SELECTORS.SELECT_BOX)
              .prop('disabled')
          },
          /**
           * イベントハンドラを設定/解除します
           *
           * @param {Function} handler
           */
          onChange: function (handler) {
            $(SELECTORS.SELECT_BOX).on('change', handler)
          },
        };
      },
      /**
       * 「基本環境チェック」の「OS・ブラウザバージョンのチェック」「POPUPブロックのチェック」「ローカルストレージの利用可否のチェック」の各項目を初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initBasicCheckListItem: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          CHECK_BOX: settings.selector + ' .custom-checkbox input[type="checkbox"]',
          CHECK_BOX_LABEL: settings.selector + ' .custom-checkbox label',
          CHECK_BOX_ERROR: settings.selector + ' .custom-checkbox .check-status-error',
        };

        // ユーザ操作によるチェックボックスの変更を禁止する
        // チェックボックスが操作可能になる条件は、trueになって以降。なので、このイベントハンドラでは常にtrueを設定する
        // TODO: なんかバグになりそうなコードなので、要注意
        $(SELECTORS.CHECK_BOX).on('change click', function(event) {
          $(SELECTORS.CHECK_BOX).prop('checked', true);
        });

        return {
          show: function () {
            return $(SELECTORS.ROOT).show();
          },
          hide: function() {
            return $(SELECTORS.ROOT).hide();
          },
          /**
           * チェックリストのチェック状態を設定します
           *
           * @param {boolean | null} checked チェック状態(チェック状態は3つの状態をとります。 null: 未チェック, true: チェック成功, false: チェック失敗)
           */
          setChecked: function(checked) {
            if (checked == null) {
              $(SELECTORS.CHECK_BOX)
                .prop('checked', false)
                .prop('disabled', true)
                .show();
              $(SELECTORS.CHECK_BOX_LABEL)
                .show();
              $(SELECTORS.CHECK_BOX_ERROR)
                .hide();
            } else if (checked === true) {
              $(SELECTORS.CHECK_BOX)
                .prop('checked', true)
                .prop('disabled', false)
                .show();
              $(SELECTORS.CHECK_BOX_LABEL)
                .show();
              $(SELECTORS.CHECK_BOX_ERROR)
                .hide();
            } else if (checked === false) {
              $(SELECTORS.CHECK_BOX)
                .hide();
              $(SELECTORS.CHECK_BOX_LABEL)
                .hide();
              $(SELECTORS.CHECK_BOX_ERROR)
                .show();
            }
          },
        };
      },
      /**
       * 「環境チェック」の「カメラ・マイクチェック」「通知チェック」「録画チェック」の各項目を初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initCheckListItem: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          BUTTON: settings.selector + ' .btn',
          CHECK_BOX: settings.selector + ' .custom-checkbox input[type="checkbox"]',
          CHECK_BOX_LABEL: settings.selector + ' .custom-checkbox label',
          CHECK_BOX_ERROR: settings.selector + ' .custom-checkbox .check-status-error',
        };

        // ユーザ操作によるチェックボックスの変更を禁止する
        // チェックボックスが操作可能になる条件は、trueになって以降。なので、このイベントハンドラでは常にtrueを設定する
        // TODO: なんかバグになりそうなコードなので、要注意
        $(SELECTORS.CHECK_BOX).on('change click', function(event) {
          $(SELECTORS.CHECK_BOX).prop('checked', true);
        });

        return {
          show: function () {
            return $(SELECTORS.ROOT).show();
          },
          hide: function() {
            return $(SELECTORS.ROOT).hide();
          },
          /**
           * ボタンからフォーカスを外します
           */
          blur: function() {
            $(SELECTORS.BUTTON).blur();
          },
          /**
           * ボタンの有効/無効を設定します
           *
           * @param {boolean} enabled
           */
          setEnabled: function(enabled) {
            $(SELECTORS.BUTTON)[enabled ? 'removeClass' : 'addClass']('disabled');
          },
          /**
           * チェックリストのチェック状態を設定します
           *
           * @param {boolean | null} checked チェック状態(チェック状態は3つの状態をとります。 null: 未チェック, true: チェック成功, false: チェック失敗)
           */
          setChecked: function(checked) {
            if (checked == null) {
              $(SELECTORS.CHECK_BOX)
                .prop('checked', false)
                .prop('disabled', true)
                .show();
              $(SELECTORS.CHECK_BOX_LABEL)
                .show();
              $(SELECTORS.CHECK_BOX_ERROR)
                .hide();
            } else if (checked === true) {
              $(SELECTORS.CHECK_BOX)
                .prop('checked', true)
                .prop('disabled', false)
                .show();
              $(SELECTORS.CHECK_BOX_LABEL)
                .show();
              $(SELECTORS.CHECK_BOX_ERROR)
                .hide();
            } else if (checked === false) {
              $(SELECTORS.CHECK_BOX)
                .hide();
              $(SELECTORS.CHECK_BOX_LABEL)
                .hide();
              $(SELECTORS.CHECK_BOX_ERROR)
                .show();
            }
          },
          /**
           * イベントハンドラを設定/解除します
           *
           * @param {Function} handler
           */
          onClick: function (handler) {
            $(SELECTORS.BUTTON).on('click', handler)
          },
        };
      },
      /**
       * 「リロード」ボタン/「ログインへ」ボタンにjsを初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initButton: function (settings) {
        settings = Object.assign({
          selector: '',
        }, settings);

        var SELECTORS = {
          ROOT: settings.selector,
          BUTTON: settings.selector + ' .btn',
        };

        return {
          show: function () {
            return $(SELECTORS.ROOT).show();
          },
          hide: function () {
            return $(SELECTORS.ROOT).hide();
          },
          setEnabled: function (enabled) {
            switch ($(SELECTORS.BUTTON).get(0).tagName.toLowerCase()) {
              case 'button':
                $(SELECTORS.BUTTON).prop('disabled', !enabled)
                break;

              case 'a':
                $(SELECTORS.BUTTON)[enabled ? 'removeClass' : 'addClass']('disabled')
                break;
            }
          },
          onClick: function (handler) {
            $(SELECTORS.BUTTON).on('click', handler)
          },
        };
      },
      /**
       * 「 カメラ・マイクチェック」ボタン/「通知チェック」ボタン/「録画チェック」ボタン等の成否のメッセージ表示管理HTMLを初期化します
       *
       * @param {object} settings
       * @return {object}
       */
      initMessageArea: function (settings) {
        settings = Object.assign({
        }, settings);

        var scrollToBottom = function() {
          $('html, body').animate({ scrollTop: $(document).height() }, 500);
        };

        return {
          hideAll: function () {
            // 「 カメラ・マイクチェック」ボタンで成功
            $('#calibrated').hide();
            // 「通知チェック」ボタンで成功
            $('#calibrated-notification-check').hide();
            // 「録画チェック」ボタンで成功
            $('#calibrated-recording-check').hide();
            // 失敗の場合のエラー
            $('#calibration-error').hide();
            $('#card-browser').hide();
            $('#card-video').hide();
            $('#card-audio').hide();
            $('#card-pop-up').hide();
            $('#card-storage').hide();
            $('#card-notification').hide();
            $('#card-recording').hide();
            $('#card-recording-upload').hide();
            $('#card-recording-download').hide();

          },
          showSuccess: function (flags) {
            this.hideAll();

            if (flags.camera) {
              $('#calibrated').show();
            }
            if (flags.notification) {
              $('#calibrated-notification-check').show();
            }
            if (flags.recording) {
              $('#calibrated-recording-check').show();
            }

            // メッセージが見えるように画面末尾に移動
            // エラーの時だけでいいかな？
            //scrollToBottom();
          },
          showCameraSuccess: function () {
            this.showSuccess({camera: true});
          },
          showNotificationSuccess: function () {
            this.showSuccess({notification: true});
          },
          showRecordingSuccess: function () {
            this.showSuccess({recording: true});
          },
          showError: function (flags) {
            this.hideAll();

            $('#calibration-error').show();
            if (flags.browser) {
              $('#card-browser').show();
            }
            if (flags.popup) {
              $('#card-pop-up').show();
            }
            if (flags.storage) {
              $('#card-storage').show();
            }
            if (flags.notification) {
              $('#card-notification').show();
            }
            if (flags.video) {
              $('#card-video').show();
            }
            if (flags.audio) {
              $('#card-audio').show();
            }
            
            // メッセージが見えるように画面末尾に移動
            scrollToBottom();
          },
          /**
           * ブラウザエラーを表示します
           *
           * @param {Lib.ua.CheckBrowserResult} cbResult
           */
          showBrowserError: function (cbResult) {
            var map = {};
            //map[Lib.ua.CheckBrowserResult.OK] = '';
            map[Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_OS] = '利用できないOSです。';
            map[Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_OS_VERSION] = 'OSのバージョンがサポート対象外です。';
            map[Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_BROWSER] = '利用できないブラウザです。';
            map[Lib.ua.CheckBrowserResult.NG_NOT_SUPPORTED_BROWSER_VERSION] = 'ブラウザのバージョンがサポート対象外です。';
            $('#card-browser').find('#headingFour a').text(map[cbResult] || '');

            this.showError({browser: true});
          },
          showPopupError: function () {
            this.showError({popup: true});
          },
          showStorageError: function () {
            this.showError({storage: true});
          },
          showNotificationError: function () {
            this.showError({notification: true});
          },
          showVideoError: function () {
            this.showError({video: true});
          },
          showAudioError: function () {
            this.showError({audio: true});
          },
        };
      },
    };

    /**
     * Viewモジュールの実態
     */
    return {
      /** @var チェッカー */
      frame: ViewHelper.initFrame({
        selector: '#check',
      }),

      /** @var ビデオプレイヤー */
      videoPlayer: ViewHelper.initVideoPlayer({
        selector: '#video-div',
      }),

      /** @var 「利用カメラデバイス」 */
      deviceSelectBox: ViewHelper.initSelectBox({
        selector: '#device-select-wrap',
      }),

      /** @var 基本環境チェック リスト */
      basicCheckList: {
        /** @var [OS・ブラウザバージョンのチェック] */
        osAndBrowserCheck: ViewHelper.initBasicCheckListItem({
          selector: '#os-and-browser-check-wrap',
        }),
        /** @var [POPUPブロックのチェック] */
        popupBlockCheck: ViewHelper.initBasicCheckListItem({
          selector: '#popup-block-check-wrap',
        }),
        /** @var [ローカルストレージの利用可否のチェック] */
        storageCheck: ViewHelper.initBasicCheckListItem({
          selector: '#storage-check-wrap',
        }),
        /** @var [カメラ・マイクの接続のチェック] */
        deviceCheck: ViewHelper.initBasicCheckListItem({
          selector: '#device-check-wrap',
        }),

        items: function() {
          return [
            this.osAndBrowserCheck,
            this.popupBlockCheck,
            this.storageCheck,
            this.deviceCheck,
          ];
        },

        /**
         * 基本環境チェックを表示します
         */
        showAll: function (checked) {
          this.items().forEach(function (v) {
            v.show()
          });
        },

        /**
         * 基本環境チェックを非表示にします
         */
        hideAll: function (checked) {
          this.items().forEach(function (v) {
            v.hide()
          });
        },

        /**
         * 基本環境チェックの有効/無効を設定します
         */
        setCheckedAll: function (checked) {
          this.items().forEach(function (v) {
            v.setChecked(checked);
          });
        },
      },

      /** @var 環境チェック リスト */
      checkList: {
        /** @var [カメラ・マイクチェック]ボタン */
        cameraCheck: ViewHelper.initCheckListItem({
          selector: '#camera-check-wrap',
        }),
        /** @var [通知チェック]ボタン */
        notificationCheck: ViewHelper.initCheckListItem({
          selector: '#notification-check-wrap',
        }),
        /** @var [録画チェック]ボタン */
        recordingCheck: ViewHelper.initCheckListItem({
          selector: '#recording-check-wrap',
        }),

        items: function() {
          return [
            this.cameraCheck,
            this.notificationCheck,
            this.recordingCheck,
          ];
        },

        /**
         * 環境チェックを表示します
         */
        showAll: function (checked) {
          this.items().forEach(function (v) {
            v.show()
          });
        },

        /**
         * 環境チェックを非表示にします
         */
        hideAll: function (checked) {
          this.items().forEach(function (v) {
            v.hide()
          });
        },

        /**
         * ボタンの有効/無効を設定します
         */
        setEnabledAll: function (enabled) {
          this.items().forEach(function (v) {
            v.setEnabled(enabled);
          });
        },

        /**
         * チェックリストのチェック状態を設定します
         *
         * @param {boolean | null} checked チェック状態(チェック状態は3つの状態をとります。 null: 未チェック, true: チェック成功, false: チェック成功)
         */
        setCheckedAll: function (checked) {
          this.items().forEach(function (v) {
            v.setChecked(checked);
          });
        },
      },

      /** @var リロードボタン */
      reloadButton: ViewHelper.initButton({
        selector: '#reload-button-wrap',
      }),

      /** @var ログイン */
      loginButton: ViewHelper.initButton({
        selector: '#login-button-wrap',
      }),

      /** @var メッセージエリア */
      messageArea: ViewHelper.initMessageArea({
      }),

      /** @var */
      modals: {
        alert: {
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          show: function (options) {
            options = Object.assign({
              theme: 'success',
              title: '確認',
              body: '',
            }, options);

            return new Promise(function (resolve, reject) {
              var ok = false;
              var modal = $('#alertModal');
              var okButton = modal.find('.modal-footer').find('button[data-button="ok"]');

              modal.find('.modal-header')
                .removeAttr('class')
                .addClass('modal-header')
                .addClass('bg-' + options.theme);
              modal.find('#alertModalLabel')
                .text(options.title);
              modal.find('.modal-body')
                .text(options.body);

              okButton.on('click', function (event) {
                event.preventDefault();

                ok = true;
                modal.modal('hide');
              });
              modal.on('hidden.bs.modal', function (event) {
                resolve(ok);

                modal.off('hidden.bs.modal');
                okButton.off('click');
              });

              modal.modal('show');
            });
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showSuccess: function (options) {
            options = Object.assign({
              theme: 'success',
            }, options);
            return this.show(options);
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showError: function (options) {
            options = Object.assign({
              theme: 'danger',
            }, options);
            return this.show(options);
          },
        },
        confirm: {
          /**
           * 確認モーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          show: function (options) {
            options = Object.assign({
              theme: 'success',
              title: '確認',
              body: '',
            }, options);

            return new Promise(function (resolve, reject) {
              var ok = false;
              var modal = $('#confirmModal');
              var okButton = modal.find('.modal-footer').find('button[data-button="ok"]');
              var cancelButton = modal.find('.modal-footer').find('button[data-button="cancel"]');

              modal.find('.modal-header')
                .removeAttr('class')
                .addClass('modal-header')
                .addClass('bg-' + options.theme);
              modal.find('#confirmModalLabel')
                .text(options.title);
              modal.find('.modal-body')
                .text(options.body);

              okButton.on('click', function (event) {
                event.preventDefault();

                ok = true;
                modal.modal('hide');
              });
              cancelButton.on('click', function (event) {
                event.preventDefault();

                ok = false;
                modal.modal('hide');
              });
              modal.on('hidden.bs.modal', function (event) {
                resolve(ok);

                modal.off('hidden.bs.modal');
                okButton.off('click');
              });

              modal.modal('show');
            });
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showSuccess: function (options) {
            options = Object.assign({
              theme: 'success',
            }, options);
            return this.show(options);
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showError: function (options) {
            options = Object.assign({
              theme: 'danger',
            }, options);
            return this.show(options);
          },
        },
        videoPlayerModal: {
          /**
           * 確認モーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          show: function (options) {
            options = Object.assign({
              theme: 'success',
              title: '確認',
              body: '',
              blob: null,
            }, options);

            return new Promise(function (resolve, reject) {
              var ok = false;
              var modal = $('#videoPlayerModal');
              var okButton = modal.find('.modal-footer').find('button[data-button="ok"]');
              var videoPlayer = modal.find('.modal-body').find('video');
              var rawVideoPlayer = videoPlayer.get(0);
              var shownOnce = false;

              modal.find('.modal-header')
                .removeAttr('class')
                .addClass('modal-header')
                .addClass('bg-' + options.theme);
              modal.find('#videoPlayerModalLabel')
                .text(options.title);
              modal.find('.modal-body').find('p')
                .text(options.body);

              modal.on('shown.bs.modal', function (event) {
                if (shownOnce) {
                  return;
                }
                shownOnce = true;

                Lib.htmlElementUtils.videoElement.setSrcObject(rawVideoPlayer, options.blob)
                  .then(function() {
                    rawVideoPlayer.currentTime = 0
                    rawVideoPlayer.pause();
                  })
              });
              okButton.on('click', function (event) {
                event.preventDefault();

                rawVideoPlayer.pause();

                ok = true;
                modal.modal('hide');
              });
              modal.on('hidden.bs.modal', function (event) {
                resolve(ok);

                modal.off('hidden.bs.modal');
                okButton.off('click');
              });

              modal.modal('show');
            });
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showSuccess: function (options) {
            options = Object.assign({
              theme: 'success',
            }, options);
            return this.show(options);
          },
          /**
           * アラートモーダルを表示する
           *
           * @params {object} options
           * @return {Promise<boolean>}
           */
          showError: function (options) {
            options = Object.assign({
              theme: 'danger',
            }, options);
            return this.show(options);
          },
        },
      },
    };
  }());

  //=========================================================================
  // イベントハンドラ/ ここから処理開始
  //=========================================================================
  /**
   * ユーティリティ
   */
  var Utils = {
    /**
     * デバイスを更新します
     *
     * @return {Promise<boolean>}
     */
    updateDeviceSelectBox: function() {
      // ビデオプレイヤーを設定
      if (Lib.ua.isFromPc()) {
        // PC
        return new Promise(function (resolve, reject) {
          Lib.mediaDevices.getDeviceInfoList(function(devicesResult) {
            if (devicesResult.videoInputs.length === 0) {
              Lib.mediaDevices.storage.setCurrentVideoDeviceId(null)

              view.deviceSelectBox.setOptions([{value: '', label: 'カメラデバイスはありません'}])

              resolve(false);
            } else {
              var currentVideoDeviceId = Lib.mediaDevices.storage.getCurrentVideoDeviceId()
              if (!devicesResult.videoInputs.some(function (v) { return v.deviceId === currentVideoDeviceId; })) {
                currentVideoDeviceId = devicesResult.videoInputs.length > 0
                  ? devicesResult.videoInputs[0].deviceId
                  : null
              }
              Lib.mediaDevices.storage.setCurrentVideoDeviceId(currentVideoDeviceId)

              view.deviceSelectBox.setOptions(devicesResult.videoInputs.map(function(v) { return {value: v.deviceId, label: v.label} }))
              view.deviceSelectBox.setValue(currentVideoDeviceId || '')

              resolve(true)
            }
          })
        });
      } else {
        // PC以外
        return Promise.resolve(true)
      }
    },
  };

  /*
   * ブラウザチェック & ポップアップチェック & 通知チェック
   */
  view.frame.setupHTML();
  var cbResult = Lib.ua.checkBrowser()
  if (cbResult !== Lib.ua.CheckBrowserResult.OK) {
    // 使用不可能なブラウザの場合の処理

    view.frame.hide(); // ブラウザチェックの場合のみチェッカー枠を非表示にする
    view.reloadButton.show();
    view.loginButton[Lib.parseUrlQuery().iframe ? 'show' : 'hide']();

    view.messageArea.hideAll();
    view.messageArea.showBrowserError(cbResult);
  $('#reload-button-wrap').hide();
  } else {
    // 使用可能なブラウザの場合の処理

    view.frame.show();
    view.deviceSelectBox[Lib.ua.isFromPc() ? 'show' : 'hide']()
    view.deviceSelectBox.setOptions([{value: '', label: 'カメラデバイスはありません'}])
    view.basicCheckList.showAll()
    view.basicCheckList.deviceCheck[Lib.ua.isFromPc() ? 'show' : 'hide']()
    view.basicCheckList.setCheckedAll(null);
    view.checkList.showAll()
    view.checkList.setCheckedAll(null);
    view.checkList.setEnabledAll(false);
    view.loginButton[Lib.parseUrlQuery().iframe ? 'show' : 'hide']();
    view.messageArea.hideAll();

    Lib.startupServiceWorker()
    .finally(function() { (new Promise(function(resolve, reject) {
      Utils.updateDeviceSelectBox().then(function () {
        var options = Lib.mediaDevices.storage.makeMediaStreamOptions({pc: {}, sp: {}});
        Lib.mediaDevices.getMediaStream(true, /*true*/false, options).then(function (msResult) {
          view.videoPlayer.setVideoMediaInfo({show: true, icon: 'video-camera', status: 'LIVE', text: ''});
          view.videoPlayer.attachStream(msResult.isEnableVideo, msResult.mediaStream);
          resolve(true)
        });
      })
    }))})
    .then(function() {
      (new Promise(function(resolve, reject) {
        Lib.checkPopupBlocker(function(popupResult) {
          resolve(popupResult)
        })
      }))
      .then(function(popupResult) {
        Lib.mediaDevices.getDeviceInfoList(function(devicesResult) {
          if (! popupResult) {
            // ポップアップテスト失敗
            view.basicCheckList.osAndBrowserCheck.setChecked(true);
            view.basicCheckList.popupBlockCheck.setChecked(false);
            view.basicCheckList.storageCheck.setChecked(null);
            view.basicCheckList.deviceCheck.setChecked(null);
            view.reloadButton.show();
            view.messageArea.showPopupError();
          } else if (Lib.ua.isFromPc() && ! Lib.checkStorage()) {
            // PC only
            // ストレージテスト失敗
            view.basicCheckList.osAndBrowserCheck.setChecked(true);
            view.basicCheckList.popupBlockCheck.setChecked(true);
            view.basicCheckList.storageCheck.setChecked(false);
            view.basicCheckList.deviceCheck.setChecked(null);
            view.reloadButton.show();
            view.messageArea.showStorageError();
          } else if (Lib.ua.isFromPc() && ! devicesResult.success) {
            // PC only
            // カメラ・マイク列挙テスト失敗
            view.basicCheckList.osAndBrowserCheck.setChecked(true);
            view.basicCheckList.popupBlockCheck.setChecked(true);
            view.basicCheckList.storageCheck.setChecked(true);
            view.basicCheckList.deviceCheck.setChecked(false);
            view.reloadButton.show();
            var errorFlags = {};
            errorFlags.video = ! devicesResult.videoSuccess;
            errorFlags.audio = ! devicesResult.audioSuccess;
            view.messageArea.showError(errorFlags);
          } else {
            // テスト成功
            view.basicCheckList.osAndBrowserCheck.setChecked(true);
            view.basicCheckList.popupBlockCheck.setChecked(true);
            view.basicCheckList.storageCheck.setChecked(true);
            view.basicCheckList.deviceCheck.setChecked(true);
            view.checkList.setCheckedAll(null);
            view.checkList.setEnabledAll(true);

            view.deviceSelectBox.setEnabled(true)
            Utils.updateDeviceSelectBox().then(function () {
              var options = Lib.mediaDevices.storage.makeMediaStreamOptions({pc: {}, sp: {}});
              Lib.mediaDevices.getMediaStream(true, true, options).then(function (msResult) {
                view.videoPlayer.setVideoMediaInfo({show: true, icon: 'video-camera', status: 'LIVE', text: ''});
                view.videoPlayer.attachStream(msResult.isEnableVideo, msResult.mediaStream);
              });
            })
          }
        });
      });
    })
  }

  /*
   * [マイク・カメラデバイス]の変更を検知します
   */
  Lib.mediaDevices.onDeviceChange(function deviceChange(event) {
    if (!view.deviceSelectBox.isEnabled()) {
      // TODO: セレクトボックスが無効の間にイベント発火があった場合は遅延を行う
      setTimeout(
        function () {
          deviceChange(event)
        },
        1000
      );
      return;
    }

    Utils.updateDeviceSelectBox().then(function () {
      var options = Lib.mediaDevices.storage.makeMediaStreamOptions({pc: {}, sp: {}});
      Lib.mediaDevices.getMediaStream(true, true, options).then(function (msResult) {
        view.videoPlayer.setVideoMediaInfo({show: true, icon: 'video-camera', status: 'LIVE', text: ''});
        view.videoPlayer.attachStream(msResult.isEnableVideo, msResult.mediaStream);
      });
    })
  });

  /*
   * [利用カメラデバイス]
   */
  view.deviceSelectBox.onChange(function(event) {
    event.preventDefault();

    var currentVideoDeviceId = view.deviceSelectBox.getValue()
    Lib.mediaDevices.storage.setCurrentVideoDeviceId(currentVideoDeviceId)

    var options = Lib.mediaDevices.storage.makeMediaStreamOptions({pc: {}, sp: {}});
    Lib.mediaDevices.getMediaStream(true, true, options).then(function (msResult) {
      view.videoPlayer.setVideoMediaInfo({show: true, icon: 'video-camera', status: 'LIVE', text: ''});
      view.videoPlayer.attachStream(msResult.isEnableVideo, msResult.mediaStream);
    });
  });
});
