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
      gapi.hangout.data.submitDelta( { activeItem: $scope.activeItem } );
    }
  };

  $scope.advanceTopic = function(){
    // If the API is not up yet, bail.
    if (!$scope.apiLive) return;
    
    if ($scope.activeItem < $scope.items.length - 1) {
      $scope.activeItem++;

      // Submit changes to Google.
      gapi.hangout.data.submitDelta( { activeItem: $scope.activeItem } );
    }
  };

  $scope.newTopicBuffer = '';
  $scope.addNewTopic = function(){
    // If the user has not been initialized yet, bail.
    if ($scope.currentUser == null) return;

    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // Otherwise, add the topic and reset the buffer.
    $scope.items.push({ label: $scope.newTopicBuffer, creator: $scope.currentUser });
    $scope.newTopicBuffer = '';

    // TODO: Create a model to encapsulate the list and notify Google of changes.

    // Submit changes to Google.
    gapi.hangout.data.submitDelta( { topics: JSON.stringify($scope.items) } );
  };

  var updateSharedState = function(StateChangedEvent){
    console.log(StateChangedEvent);

    $scope.items = JSON.parse(StateChangedEvent.state.topics);
    $scope.activeItem = StateChangedEvent.state.activeItem;
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    // TODO: Fetch and set the current app state.
    var initialState = gapi.hangout.data.getState();
    console.log("Initial state...", initialState);

    if (initialState.activeItem == undefined)
      gapi.hangout.data.setValue('activeItem', $scope.activeItem);

    $scope.apiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant().person.displayName;
    gapi.hangout.data.onStateChanged.add(updateSharedState);
  });
}

//HangDownListCntr.$inject = ['$scope'];
