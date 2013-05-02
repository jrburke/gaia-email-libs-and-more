/**
 * The startup process (which can be improved) looks like this:
 *
 * Main: Initializes worker support logic
 * Main: Spawns worker
 * Worker: Loads core JS
 * Worker: 'hello' => main
 * Main: 'hello' => worker with online status and mozAlarms status
 * Worker: Creates MailUniverse
 * Worker 'mailbridge'.'hello' => main
 * Main: Creates MailAPI, sends event to UI
 * UI: can really do stuff
 *
 * Note: this file is not currently used by the GELAM unit tests;
 * mailapi/testhelper.js (in the worker) and
 * mailapi/worker-support/testhelper-main.js establish the (bounced) bridge.
 **/

define(
  [
    // Pretty much everything could be dynamically loaded after we kickoff the
    // worker thread.  We just would need to be sure to latch any received
    // messages that we receive before we finish setup.
    './worker-support/shim-sham',
    './mailapi',
    'require'
  ],
  function(
    $shim_setup,
    $mailapi,
    require
  ) {

  // Create MailAPI instance, and indicate it is fake for
  // now, waiting on real back end to boot up.
  var MailAPI = new $mailapi.MailAPI();
  MailAPI._fake = true;

  MailAPI.startBackend = function startBackend() {
    require(['./main-frame-backend'], function (backend) {
      backend(MailAPI);
    });
  };

  return MailAPI;
}); // end define
