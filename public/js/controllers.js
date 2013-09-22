'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.apiLive = false;

  $scope.items = [];

  $scope.activeItem = 0;
  $scope.currentUser = null;

  $scope.regressTopic = function(){
    // If the API is not up yet, bail.
    if (!$scope.apiLive) return;

    if ($scope.activeItem > 0) {
      $scope.activeItem--;

      // Submit changes to Google.
      gapi.hangout.data.submitDelta( { activeItem: $scope.activeItem.toString() } );
    }
  };

  $scope.advanceTopic = function(){
    // If the API is not up yet, bail.
    if (!$scope.apiLive) return;
    
    if ($scope.activeItem < $scope.items.length - 1) {
      $scope.activeItem++;

      // Submit changes to Google.
      gapi.hangout.data.submitDelta( { activeItem: $scope.activeItem.toString() } );
    }
  };

  $scope.newTopicBuffer = '';
  $scope.addNewTopic = function(){
    // If the gapi hasn't be initialized, bail.
    if (!$scope.apiLive) return;

    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // Otherwise, add the topic and reset the buffer.
    $scope.items.push({ label: $scope.newTopicBuffer, creator: $scope.currentUser.person.displayName });
    $scope.newTopicBuffer = '';

    // Submit changes to Google.
    // TODO: Come up with a better way to do this.
    gapi.hangout.data.submitDelta( { topics: JSON.stringify($scope.items) } );
  };

  var updateSharedState = function(StateChangedEvent){
    console.log(StateChangedEvent);

    $scope.items = JSON.parse(StateChangedEvent.state.topics);
    $scope.activeItem = parseInt(StateChangedEvent.state.activeItem);

    $scope.$apply();  // Have to do this to force the view to update.
  };

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.setValue('activeItem', '0');
    gapi.hangout.data.setValue('topics', JSON.stringify([]));
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    // Fetch the current state and make sure that the model is initialized.
    var initialState = gapi.hangout.data.getState();
    if (initialState.activeItem == undefined) initGapiModel();

    // Set up internal model to work with gapi.
    $scope.apiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(updateSharedState);
  });
}

//HangDownListCntr.$inject = ['$scope'];
