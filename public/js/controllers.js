'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.apiLive = false;
  var _apiRequiredFunction = function(innerFunction){ return function(){
    if ($scope.apiLive) innerFunction.apply(this, arguments);
  }; };

  $scope.topics = [];

  $scope.activeTopicIndex = 0;
  $scope.currentUser = null;

  $scope.itemSortConfig = {
    update: function(e, ui){
      // TODO: Figure out the new index of the currently selected item.
      console.log($scope.topics);
    }
  };

  $scope.regressTopic = _apiRequiredFunction(function(){
    // Only regress if the topic is not already the first.
    if ($scope.activeTopicIndex > 0) {
      $scope.activeTopicIndex--;

      // Submit changes to Google.
      pushSharedState( { activeTopicIndex: $scope.activeTopicIndex.toString() } );
    }
  });

  $scope.advanceTopic = _apiRequiredFunction(function(){
    // Only advance if the topic is not already the last.
    if ($scope.activeTopicIndex < $scope.topics.length - 1) {
      $scope.activeTopicIndex++;

      // Submit changes to Google.
      pushSharedState( { activeTopicIndex: $scope.activeTopicIndex.toString() } );
    }
  });

  $scope.deleteTopic = _apiRequiredFunction(function(topicId){
    // TODO: If selected topic doesn't exist, bail.
    // TODO: If the topic is currently selected, increment the selection to the next topic.
    // TODO: Delete selected topic.
    // TODO: Refresh selected index.
    // TODO: Push state.
  });

  $scope.newTopicBuffer = '';
  $scope.addNewTopic = _apiRequiredFunction(function(){
    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // Otherwise, add the topic and reset the buffer.
    $scope.topics.push({
      id: new Date().getTime(),
      label: $scope.newTopicBuffer,
      creator: $scope.currentUser.person.displayName
    });
    $scope.newTopicBuffer = '';

    // Submit changes to Google.
    // TODO: Come up with a better way to do this.
    pushSharedState( { topics: JSON.stringify($scope.topics) } );
  });

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.submitDelta({
      activeTopicIndex: '0',
      topics: JSON.stringify([])
    });
  };

  var pushSharedState = function(StateDelta){
    // First, set the current updater.
    StateDelta.modifier = $scope.currentUser.id;

    // Then submit the delta to GAPI.
    gapi.hangout.data.submitDelta( StateDelta );
  };

  var applySharedState = function(StateChangedEvent){
    // If the current shared state update was self-originated, skip.
    if (StateChangedEvent.state.modifier == $scope.currentUser.id) return;

    $scope.topics = JSON.parse(StateChangedEvent.state.topics);
    $scope.activeTopicIndex = parseInt(StateChangedEvent.state.activeTopicIndex);

    $scope.$apply();  // Have to do this to force the view to update.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    // Fetch the current state and make sure that the model is initialized.
    var initialState = gapi.hangout.data.getState();
    if (initialState.activeTopicIndex == undefined) initGapiModel();

    // TODO: If data already exists, make sure to init with that data.

    // Set up internal model to work with gapi.
    $scope.apiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(applySharedState);
  });
}

//HangDownListCntr.$inject = ['$scope'];
