// GAPI Hangouts Mocks
var gapi = function(gapi){

  // Create the Hangout API
  gapi.hangout = function(hangout){

    hangout.localParticipant = {
      id: '123456',
      displayIndex: 0,
      person: {
        id: '123456',
        displayName: 'Test'
      }
    };

    // OnApiReady Mocks
    hangout.onApiReady = {
      add: function(callback){
        // Let's just go ahead and call it.
        // No sense wasting time.
        callback({ isApiReady: true });
      }
    };

    // Data Mocks
    var _dataChangedCallbacks = [];
    var _informCallbacks = function(State){
      var StateChangeEvent = { state: State };
      for (var i = _dataChangedCallbacks.length - 1; i >= 0; i--) {
        _dataChangedCallbacks[i](StateChangeEvent);
      };
    };
    hangout.data = {
      currentState: {},
      getState: function(){ return hangout.data.currentState; },
      setValue: function(key, value){ hangout.data.currentState[key] = value; _informCallbacks(hangout.data.currentState) },
      submitDelta: function(delta){
        var deltaKeys = Object.keys(delta);
        for (i in deltaKeys){
          hangout.data.currentState[deltaKeys[i]] = delta[deltaKeys[i]];
        }
        _informCallbacks(hangout.data.currentState);
      },
      onStateChanged: {
        add: function(callback){ _dataChangedCallbacks.push(callback); }
      }
    };

    hangout.getLocalParticipant = function(){ return hangout.localParticipant; };

    return hangout;
  }(gapi.hangout || {});

  return gapi;
}(gapi || {});
