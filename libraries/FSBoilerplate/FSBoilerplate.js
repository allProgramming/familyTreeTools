/**
 * FamilySearch Boilerplate module
 * (Dependencies: jQuery and fs-js-lite)
 *
 * The purpose of this module is to simplify:
 *   - Logging in/out of FamilySearch
 *   - Rendering the appropriate content depending on logged-in/out state
 * (in a JavaScript web app).
 *
 * Prerequisites:
 *   1. Get an app key from FamilySearch for testing and development
 *   2. Add a <script> tag to your HTML document for each of these dependencies:
 *     - jQuery
 *     - fs-js-lite
 *   3. Below those tags, add a <script> tag to include this file
 *
 * Usage:
 * In another <script> tag, simply reference FSBoilerplate, setting parameters
 * as desired, and then call the "go" method. Here's the minimal example...
 *
 *   FSBoilerplate
 *     .setAppKey(MY_APP_KEY)
 *     .go();
 *
 * In HTML, provide a button with an "fsLoginButton" class. For example:
 *
 *   <button class="fsLoginButton"></button>
 *
 * Optionally, provide blocks of HTML with an "fsLoggedOutContent",
 * "fsLoggingInContent", or "fsLoggedInContent" class, and initial style of
 * "display: none;". For example:
 *
 *   <div class="fsLoggedOutContent" style="display: none;">
 *     You are not logged in to FamilySearch.
 *   </div>
 *
 * Given the above scenario, FSBoilerplate will update the button to handle
 * logging in/out, and show the appropriate text, and will show/hide the
 * appropriate HTML blocks (according to login state).
 *
 * Additional Settings:
 * Before calling "go" on FSBoilerplate, you may wish to call any of the other
 * "set" methods provided, below. Documentation can be found before each method.
 */

var FSBoilerplate = (function() {
  // Parameters
  var _environment = 'integration';  // FamilySearch reference environment
  var _appKey = null;
  var _loggedInCallback = function() {};

  // Variables
  var _client = null;

  /**************
   * PUBLIC API *
   **************/

  /**
   * Set the FamilySearch reference environment (optional)
   *
   * Default (if not provided) is 'integration'.
   * See fs-js-lite documentation for other options.
   */
  function setEnvironment(environment) {
    _environment = environment;
    return this;
  }

  /**
   * Set the FamilySearch app key (required)
   */
  function setAppKey(appKey) {
    _appKey = appKey;
    return this;
  }

  /**
   * Provide a logged-in callback (optional)
   *
   * The provided callback is called once the user is completely logged in.
   * The one parameter that is passed to the callback is the fs-js-lite client.
   *
   * Example usage:
   *
   *   .setLoggedInCallback(function(client) {
   *     console.log("Demo: Logged in with client", client);
   *   })
   *
   */
  function setLoggedInCallback(loggedInCallback) {
    _loggedInCallback = loggedInCallback;
    return this;
  }

  /**
   * Perform all of the primary functions of FSBoilerplate (required)
   *
   * This must be called after all necessary "set" methods have been called.
   * It handles logging in/out of FamilySearch, and updating HTML content.
   */
  function go() {
    _client = new FamilySearch({
      environment: _environment,
      appKey: _appKey,
      redirectUri: window.location.href,
      saveAccessToken: true,
    });

    $(document).ready(function() {
      function updatePage() {
        var isLoggedIn = !!_client.getAccessToken();

        // Show the appropriate content, according to login state
        $('.fsLoggedOutContent').each(function() {
          $(this).toggle(!isLoggedIn && !_isLoggingIn());
        });
        $('.fsLoggingInContent').each(function() {
          $(this).toggle(!isLoggedIn && _isLoggingIn());
        });
        $('.fsLoggedInContent').each(function() {
          $(this).toggle(isLoggedIn);
        });

        // Update the login button to reflect the login state
        $('.fsLoginButton').each(function() {
          var button = $(this);
          button.prop('disabled', _isLoggingIn());
          if (!isLoggedIn) {
            button.text('Log in with FamilySearch');
            button.click(function() {
              _client.oauthRedirect();
            });
          } else {
            button.text('Log out of FamilySearch');
            button.click(function() {
              _client.deleteAccessToken();
              location.reload();
            });
          }
        });
      }
      updatePage();

      if (_isLoggingIn()) {
        _client.oauthResponse(function(error, response){
          if (!response) {
            console.log('Error logging in to Family Search: ', error);
            return;
          }

          if(response.statusCode !== 200){
            console.log('Family Search login, unsuccessful: ', response);
            return;
          }

          // On success, remove the "code" parameter from the url
          window.history.replaceState(null, null, window.location.pathname);

          updatePage();
          _loggedInCallback(_client);
        });
      }
    });
  }

  /**
   * Return the fs-js-lite client
   */
  function getClient() {
    return _client;
  }


  /*************
   * INTERNALS *
   *************/

  /**
   * Return true/false, indicating that we're in the process of logging in
   */
  function _isLoggingIn() {
    return (window.location.search.indexOf('code=') >= 0);
  }

  return {
    setEnvironment: setEnvironment,
    setAppKey: setAppKey,
    setLoggedInCallback: setLoggedInCallback,
    go: go,
    getClient: getClient,
  };
})();
