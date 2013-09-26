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
      // Push state.
      pushSharedState({ topics: JSON.stringify($scope.topics) });
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

  $scope.deleteTopic = _apiRequiredFunction(function(deleteTopicId){
    // Filter the array.
    var initialLength = $scope.topics.length;
    $scope.topics = $scope.topics.filter(function(topic){ return topic.id != deleteTopicId; });

    // If the length hasn't changed, we're done.
    if (initialLength == $scope.topics.length) return;
    var newState = { topics: JSON.stringify( $scope.topics ) };

    // If the activeTopicIndex is beyond the end of the list, correct that.
    if ($scope.activeTopicIndex >= $scope.topics.length) {
      $scope.activeTopicIndex = $scope.topics.length - 1;
      newState.activeTopicIndex = $scope.activeTopicIndex;
    }

    // Push state.
    pushSharedState( newState );
  });

  var createTopic = function(newLabel){
    return {
      id: new Date().getTime(),         // TODO: Have a better id.
      label: newLabel,
      creator: $scope.currentUser.person.displayName
    };
  };

  $scope.newTopicBuffer = '';
  $scope.addNewTopic = _apiRequiredFunction(function(){
    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // If there are any ';;', break the topic into multiple topics.
    var newTopics = $scope.newTopicBuffer.split(';;');
    $scope.newTopicBuffer = '';

    // Push add all topics.
    for (var i = newTopics.length - 1; i >= 0; i--) {
      $scope.topics.unshift(createTopic(newTopics[i].trim()));
    };

    // Submit changes to Google.
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
