'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.apiLive = false;

  $scope.items = [];

  $scope.activeItem = 0;
  $scope.currentUser = null;

  $scope.itemSortConfig = {
    update: function(e, ui){
      // TODO: Figure out the new index of the currently selected item.
      console.log($scope.items);
    }
  };

  var resetActiveIndex = function(){
    
  };

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

  $scope.deleteTopic = function(topicId){
    // TODO: If selected topic doesn't exist, bail.
    // TODO: If the topic is currently selected, increment the selection to the next topic.
    // TODO: Delete selected topic.
    // TODO: Refresh selected index.
    // TODO: Push state.
  };

  $scope.newTopicBuffer = '';
  $scope.addNewTopic = function(){
    // If the gapi hasn't be initialized, bail.
    if (!$scope.apiLive) return;

    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // Otherwise, add the topic and reset the buffer.
    $scope.items.push({
      id: new Date().getTime(),
      label: $scope.newTopicBuffer,
      creator: $scope.currentUser.person.displayName
    });
    $scope.newTopicBuffer = '';

    // Submit changes to Google.
    // TODO: Come up with a better way to do this.
    gapi.hangout.data.submitDelta( { topics: JSON.stringify($scope.items) } );
  };

  var applySharedState = function(StateChangedEvent){
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

    // TODO: If data already exists, make sure to init with that data.

    // Set up internal model to work with gapi.
    $scope.apiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(applySharedState);
  });
}

//HangDownListCntr.$inject = ['$scope'];
