'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.apiLive = false;
  var _apiRequiredFunction = function(innerFunction){ return function(){
    if ($scope.apiLive) innerFunction.apply(this, arguments);
  }; };

  $scope.topics = [];

  var _activeTopicId = null;
  $scope.activeTopicIndex = 0;
  $scope.currentUser = null;

  $scope.conversationStart = null;

  var _timeCounterEvent = null;

  var resetActiveTopicIndex = function(){
    var activeIndex = 0;

    for (var i = $scope.topics.length - 1; i >= 0; i--) {
      if ($scope.topics[i].id == _activeTopicId) {
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

      // TODO: Clear out all startTimes for any topic past the current one.

      // Push state.
      pushSharedState();
    }
  };

  $scope.goToTopic = function(topicId){
    // TODO: If we keep this function around, make sure to check for non-existent IDs.
    _activeTopicId = topicId;
    resetActiveTopicIndex();
  };

  $scope.formatDuration = function(fromTime, toTime){
    console.log(fromTime, toTime);
    if (toTime == undefined) toTime = new Date().getTime();
    var timeDiff = toTime - fromTime;

    var hours = parseInt(timeDiff / (60*60*1000));
    var hourRem = timeDiff % (60*60*1000);
    var minutes = parseInt(hourRem / (60*1000));
    var minuteRem = hourRem % (60*1000);
    var seconds = parseInt(minuteRem / (1000));

    var result = hours.toString() + ":";
    if (minutes < 10) result += "0";
    result += minutes.toString() + ":";
    if (seconds < 10) result += "0";
    result += seconds.toString();

    return result;
  };

  $scope.regressTopic = _apiRequiredFunction(function(){
    // Only regress if the topic is not already the first.
    if ($scope.activeTopicIndex > 0) {
      // Null the current topic's start time, end time, and duration.
      $scope.topics[$scope.activeTopicIndex].startTime
        = $scope.topics[$scope.activeTopicIndex].endTime
        = $scope.topics[$scope.activeTopicIndex].duration
        = null;

      // Regress the topic.
      _activeTopicId = $scope.topics[--$scope.activeTopicIndex].id;
      $scope.topics[$scope.activeTopicIndex].startTime = new Date().getTime();

      // Submit changes to Google.
      pushSharedState();
    }
  });

  $scope.advanceTopic = _apiRequiredFunction(function(){
    // Only advance if the topic is not already the last.
    if ($scope.activeTopicIndex < $scope.topics.length - 1) {
      // Close out the previous topic's end time and duration.
      $scope.topics[$scope.activeTopicIndex].endTime = new Date().getTime();
      $scope.topics[$scope.activeTopicIndex].duration =
        $scope.formatDuration(
          $scope.topics[$scope.activeTopicIndex].startTime,
          $scope.topics[$scope.activeTopicIndex].endTime
        );

      // Advance the topic.
      _activeTopicId = $scope.topics[++$scope.activeTopicIndex].id;
      $scope.topics[$scope.activeTopicIndex].startTime = new Date().getTime();

      // Submit changes to Google.
      pushSharedState();
    }
  });

  var _topicIndex = 0;
  var createTopic = function(newLabel){
    return {
      id: new Date().getTime() + '-' + $scope.currentUser.id + '-' + _topicIndex++,
      label: newLabel,
      creator: $scope.currentUser.person.displayName,
      startTime: null,
      endTime: null,
      duration: null
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
    if (_activeTopicId == null) {
      _activeTopicId = $scope.topics[0].id;
      $scope.activeTopicIndex = 0;

      // Set the conversation and topic start times.
      $scope.conversationStart = $scope.topics[$scope.activeTopicIndex].startTime = new Date().getTime();
    }

    // If there is no time counting event running, create one.
    if (_timeCounterEvent == null) {
      _timeCounterEvent = setInterval(function(){
        // Update the current topic duration.
        $scope.topics[$scope.activeTopicIndex].duration =
          $scope.formatDuration($scope.topics[$scope.activeTopicIndex].startTime);

        // Apply the changes.
        $scope.$apply();
      }, 1000);
    }

    // Submit changes to Google.
    pushSharedState();
  });

  $scope.deleteTopic = _apiRequiredFunction(function(deleteTopicId){
    // If we're about to delete the current topic,
    // determine the next topic to select.
    if (deleteTopicId == _activeTopicId) {
      // If the next topic exists, use it.
      if ($scope.topics[$scope.activeTopicIndex+1]) _activeTopicId = $scope.topics[$scope.activeTopicIndex+1].id;
      else if ($scope.topics[$scope.activeTopicIndex-1]) _activeTopicId = $scope.topics[$scope.activeTopicIndex-1].id;
      else _activeTopicId = null;
    }

    // Filter the array.
    var initialLength = $scope.topics.length;
    $scope.topics = $scope.topics.filter(function(topic){ return topic.id != deleteTopicId; });

    // If the length hasn't changed, we're done.
    if (initialLength == $scope.topics.length) return;

    // Reset the active index.
    resetActiveTopicIndex();

    // If the topic list is empty, stop the counter and end the conversation.
    if (!$scope.topics.length) {
      if (_timeCounterEvent != null)
        clearInterval(_timeCounterEvent);
      _timeCounterEvent = null;
      $scope.conversationStart = null;
    }

    // Push state.
    pushSharedState();
  });

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.submitDelta({
      _activeTopicId: JSON.stringify(null),
      topics: JSON.stringify([]),
      conversationStart: JSON.stringify(null)
    });
  };

  var pushSharedState = function(stateDelta){
    // If there was no state provided, just push the whole system.
    if (!stateDelta) {
      stateDelta = {
        _activeTopicId: JSON.stringify(_activeTopicId),
        topics: JSON.stringify($scope.topics),
        conversationStart: JSON.stringify($scope.conversationStart)
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
    _activeTopicId = JSON.parse(newState._activeTopicId);
    $scope.topics = JSON.parse(newState.topics);
    if (newState.conversationStart)
      $scope.conversationStart = JSON.parse(newState.conversationStart);

    // Make sure that the activeTopicIndex is updated.
    resetActiveTopicIndex();

    $scope.$apply();  // Have to do this to force the view to update.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    var initialState = gapi.hangout.data.getState();

    // If the state has not been initialized, do that now.
    if (initialState._activeTopicId == undefined) initGapiModel();
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
