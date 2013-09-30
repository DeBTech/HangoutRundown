'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.apiLive = false;
  var _apiRequiredFunction = function(innerFunction){ return function(){
    if ($scope.apiLive) innerFunction.apply(this, arguments);
  }; };

  $scope.topics = [];

  var activeTopicId = null;
  $scope.activeTopicIndex = 0;
  $scope.currentUser = null;

  var resetActiveTopicIndex = function(){
    var activeIndex = 0;

    for (var i = $scope.topics.length - 1; i >= 0; i--) {
      if ($scope.topics[i].id == activeTopicId) {
        activeIndex = i;
        break;
      }
    };

    $scope.activeTopicIndex = activeIndex;
  };

  $scope.topicSortConfig = {
    stop: function(e, ui){
      // First, make sure that the active index is correct.
      resetActiveTopicIndex();

      // Push state.
      pushSharedState();
    }
  };

  $scope.goToTopic = function(topicId){
    // TODO: If we keep this function around, make sure to check for non-existent IDs.
    activeTopicId = topicId;
    resetActiveTopicIndex();
  };

  $scope.regressTopic = _apiRequiredFunction(function(){
    // Only regress if the topic is not already the first.
    if ($scope.activeTopicIndex > 0) {
      activeTopicId = $scope.topics[$scope.activeTopicIndex-1].id;
      resetActiveTopicIndex();

      // Submit changes to Google.
      pushSharedState();
    }
  });

  $scope.advanceTopic = _apiRequiredFunction(function(){
    // Only advance if the topic is not already the last.
    if ($scope.activeTopicIndex < $scope.topics.length - 1) {
      activeTopicId = $scope.topics[$scope.activeTopicIndex+1].id;
      resetActiveTopicIndex();

      // Submit changes to Google.
      pushSharedState();
    }
  });

  var _topicIndex = 0;
  var createTopic = function(newLabel){
    return {
      id: new Date().getTime() + '-' + $scope.currentUser.id + '-' + _topicIndex++,
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
    for (var i = 0; i < newTopics.length; i++) {
      $scope.topics.push(createTopic(newTopics[i].trim()));
    };

    // If there is no active topic yet, set the active topic.
    if (activeTopicId == null) {
      activeTopicId = $scope.topics[0].id;
      $scope.activeTopicIndex = 0;
    }

    // Submit changes to Google.
    pushSharedState();
  });

  $scope.deleteTopic = _apiRequiredFunction(function(deleteTopicId){
    // If we're about to delete the current topic,
    // determine the next topic to select.
    if (deleteTopicId == activeTopicId) {
      // If the next topic exists, use it.
      if ($scope.topics[$scope.activeTopicIndex+1]) activeTopicId = $scope.topics[$scope.activeTopicIndex+1].id;
      else if ($scope.topics[$scope.activeTopicIndex-1]) activeTopicId = $scope.topics[$scope.activeTopicIndex-1].id;
      else activeTopicId = null;
    }

    // Filter the array.
    var initialLength = $scope.topics.length;
    $scope.topics = $scope.topics.filter(function(topic){ return topic.id != deleteTopicId; });

    // If the length hasn't changed, we're done.
    if (initialLength == $scope.topics.length) return;

    // Reset the active index.
    resetActiveTopicIndex();

    // Push state.
    pushSharedState();
  });

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.submitDelta({
      activeTopicId: JSON.stringify(null),
      topics: JSON.stringify([])
    });
  };

  var pushSharedState = function(stateDelta){
    // If there was no state provided, just push the whole system.
    if (!stateDelta) {
      stateDelta = {
        activeTopicId: JSON.stringify(activeTopicId),
        topics: JSON.stringify($scope.topics)
      };
    }

    // Next, set the current updater.
    stateDelta.modifier = $scope.currentUser.id;

    // Then submit the delta to GAPI.
    gapi.hangout.data.submitDelta( stateDelta );
  };

  var processStateUpdate = function(stateChangedEvent){
    // If the current shared state update was self-originated, skip.
    if (stateChangedEvent.state.modifier == $scope.currentUser.id) return;

    // Otherwise, apply the shared state.
    applySharedState(stateChangedEvent.state);
  };

  var applySharedState = function(newState){
    // Update the internal model.
    $scope.topics = JSON.parse(newState.topics);
    activeTopicId = JSON.parse(newState.activeTopicId);

    // Make sure that the activeTopicIndex is updated.
    resetActiveTopicIndex();

    $scope.$apply();  // Have to do this to force the view to update.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    var initialState = gapi.hangout.data.getState();

    // If the state has not been initialized, do that now.
    if (initialState.activeTopicId == undefined) initGapiModel();
    // Otherwise, update internal state with shared state.
    else applySharedState(initialState);

    // Set up internal model to work with gapi.
    $scope.apiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(processStateUpdate);
  });
}

//HangDownListCntr.$inject = ['$scope'];
