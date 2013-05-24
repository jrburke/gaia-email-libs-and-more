define([
  './worker-support/main-router',
  './worker-support/configparser-main',
  './worker-support/cronsync-main',
  './worker-support/devicestorage-main',
  './worker-support/maildb-main',
  './worker-support/net-main'
], function(
  $router,
  $configparser,
  $cronsync,
  $devicestorage,
  $maildb,
  $net
) {

function init(MailAPI) {
  var worker = new Worker('js/ext/mailapi/worker-bootstrap.js');

  var bridge = {
    name: 'bridge',
    sendMessage: null,
    process: function(uid, cmd, args) {
      var msg = args;

      if (msg.type === 'hello') {
        MailAPI.__bridgeSend = function(msg) {
          worker.postMessage({
            uid: uid,
            type: 'bridge',
            msg: msg
          });
        };

        MailAPI.config = msg.config;

        // Send up all the queued messages to real backend now.
        MailAPI._storedSends.forEach(function (msg) {
          MailAPI.__bridgeSend(msg);
        });
        MailAPI._storedSends = [];
      } else {
        MailAPI.__bridgeReceive(msg);
      }
    }
  };

  var control = {
    name: 'control',
    sendMessage: null,
    process: function(uid, cmd, args) {
      var online = navigator.onLine;
      var hasPendingAlarm = navigator.mozHasPendingMessage &&
                            navigator.mozHasPendingMessage('alarm');
      control.sendMessage(uid, 'hello', [online, hasPendingAlarm]);

      window.addEventListener('online', function(evt) {
        control.sendMessage(uid, evt.type, [true]);
      });
      window.addEventListener('offline', function(evt) {
        control.sendMessage(uid, evt.type, [false]);
      });
      if (navigator.mozSetMessageHandler) {
        navigator.mozSetMessageHandler('alarm', function(msg) {
          control.sendMessage(uid, 'alarm', [msg]);
        });
      }

      $router.unregister(control);
    }
  };

  $router.useWorker(worker);

  $router.register(control);
  $router.register(bridge);
  $router.register($configparser);
  $router.register($cronsync);
  $router.register($devicestorage);
  $router.register($maildb);
  $router.register($net);
}

return init;
});