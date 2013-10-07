'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.currentUser = null;

  $scope.pastTopics = [];
  $scope.currentTopic = null;
  $scope.futureTopics = [];

  $scope.conversationDuration = null;

  // Function factory to create wrapped GAPI functions that will only operate if
  // the GAPI has been activated and update the GAPI after each call.
  var _gapiLive = false;
  var _gapiUpdatingFunction = function(innerFunction){ return function(){
    if (!_gapiLive) return;
    innerFunction.apply(this, arguments);
    _pushSharedState();
  }; };

  $scope.model = (function(model){
    // CreateTopic()
    var _topicCounter = 0;
    model.createTopic = function(topicName, creatorName){
      // Figure out the creator's name.
      var creatorNameComponents = creatorName.split(' ');
      var creator = creatorNameComponents[0];
      if (creatorNameComponents[1] != undefined)
        creator += ' ' + creatorNameComponents[1][0];

      // Create a sufficiently random ID.
      var id = creatorNameComponents[0] + '-';
      id += new Date().getTime() + '-';
      id += _topicCounter++;

      return {
        id: id,
        contents: topicName,
        creator: creator,
        duration: 0
      };
    };

    // AddTopic()
    model.addTopic = function(topic, creator){
      // First, bail if there is no topic to add.
      if (topic == undefined || !topic.length) return;

      // Next, split the topic if need-be.
      // ';;' and '\n' should delineate topics.
      var topics = topic.split(/[\n(;;)]/);


      // Process through all topics.
      for (var i = 0; i < topics.length; i++) {
        var newTopic = topics[i].trim();
        // If there's nothing left of it after trimming, move on.
        if (!newTopic.length) continue;

        // If there is no current topic, set it.
        if ($scope.currentTopic == null)
          $scope.currentTopic = model.createTopic(newTopic, creator);
        // Otherwise, add it to the future topics.
        else
          $scope.futureTopics.push(model.createTopic(newTopic, creator));
      };
    };

    // DeleteTopic()
    model.deleteTopic = function(topicId){
      // Filter the future topics.
      $scope.futureTopics = $scope.futureTopics.filter(function(topic){ return topic.id != topicId; });

      // Check to see if the current topic should be deleted.
      if ($scope.currentTopic != null && $scope.currentTopic.id == topicId)
        // If it should, either replace it with the first future topic, or null.
        $scope.currentTopic = ($scope.futureTopics.length) ? 
          $scope.currentTopic = $scope.futureTopics.shift() :
          null;
    };

    // AdvanceTopics()
    model.advanceTopics = function(){
      // Only advance if there are more topics to advance to.
      if ($scope.futureTopics.length) {
        $scope.pastTopics.push($scope.currentTopic);
        $scope.currentTopic = $scope.futureTopics.shift()
      }
    };

    model.findTopicInList = function(topicId, topicList){
      var result = -1;
      for (var i = topicList.length - 1; i >= 0; i--) {
        if (topicList[i].id == topicId) {
          result = i;
          break;
        }
      };
      return result;
    };

    model.activateTopicIndex = function(topicIndex){
      // If this index doesn't exist, do nothing.
      if (topicIndex >= $scope.topics.length || topicIndex < 0) return;

      // If this index is already set, do nothing.
      if (topicIndex == $scope.activeTopicIndex && $scope.topics[topicIndex].id == _activeTopicId) return;

      var topic = $scope.topics[topicIndex];
      // If the timer isn't already running, give it a go.
      if (topic.startTime == null) topic.startTime = new Date().getTime();
      topic.duration = $scope.formatDuration(topic.startTime);

      // Set up the model.
      $scope.activeTopicIndex = topicIndex;
      _activeTopicId = topic.id;
    };

    // TODO:
    // Move the rest of the model logic in here.
    // Make sure that only the model is updated on any of these calls.
    // Change _gapiUpdatingFunction() to _apiUpdatingFunction() and have
    //  it test for GAPI *and* call _pushSharedState() at the end.
    // Use _apiUpdatingFunction() to create the publicly-visible scope functions
    //  by wrapping the internal model functions.
    // This will leave the model testable independently of any API nonsense.

    // Make sure to return the closure.
    return model;
  })({});

  $scope.topicSortConfig = {
    stop: function(e, ui){
      // Determing the new index for the current topic.
      var newIndex = $scope.model.getTopicIndex(_activeTopicId);

      // Make sure that that topic is the active topic.
      $scope.model.activateTopicIndex(newIndex);

      // TODO: Clear out all startTimes for any topic past the current one.

      // Push state.
      _pushSharedState();
    }
  };

  $scope.formatDuration = function(fromTime, toTime){
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

  $scope.regressTopic = _gapiUpdatingFunction(function(){
    // Only regress if the topic is not already the first.
    if ($scope.activeTopicIndex > 0) {
      // Null the current topic's start time, end time, and duration.
      $scope.topics[$scope.activeTopicIndex].startTime
        = $scope.topics[$scope.activeTopicIndex].duration
        = null;

      // Regress the topic.
      $scope.model.activateTopicIndex($scope.activeTopicIndex-1);

      // Submit changes to Google.
      _pushSharedState();
    }
  });

  $scope.advanceTopic = _gapiUpdatingFunction(function(){
    // Only advance if the topic is not already the last.
    if ($scope.activeTopicIndex < $scope.topics.length - 1) {
      // Close out the previous topic's end time and duration.
      $scope.topics[$scope.activeTopicIndex].duration =
        $scope.formatDuration($scope.topics[$scope.activeTopicIndex].startTime);
      $scope.topics[$scope.activeTopicIndex].startTime = null;

      // Advance the topic.
      $scope.model.activateTopicIndex($scope.activeTopicIndex+1);

      // Submit changes to Google.
      _pushSharedState();
    }
  });

  var _topicIndex = 0;
  var createTopic = function(newLabel){
    return {
      id: new Date().getTime() + '-' + $scope.currentUser.id + '-' + _topicIndex++,
      label: newLabel,
      creator: $scope.currentUser.person.displayName,
      startTime: null,
      duration: null
    };
  };

  // TODO: Get rid of the requirements on the buffer here.
  $scope.newTopicBuffer = '';
  $scope.addNewTopic = _gapiUpdatingFunction(function(){
    // If there is no topic set, bail.
    if (!$scope.newTopicBuffer.length) return;

    // If there are any ';;', break the topic into multiple topics.
    var newTopics = $scope.newTopicBuffer.split(';;');
    $scope.newTopicBuffer = '';

    // Push add all topics.
    for (var i = 0; i < newTopics.length; i++) {
      $scope.topics.push(createTopic(newTopics[i].trim()));
    };

    // If this is the first topic, go ahead an activate it.
    if (_activeTopicId == null) {
      $scope.model.activateTopicIndex(0);

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
    _pushSharedState();
  });

  $scope.deleteTopic = _gapiUpdatingFunction(function(deleteTopicId){
    // If we're about to delete the current topic,
    // determine the next topic to select.
    if (deleteTopicId == _activeTopicId) {
      // If the next topic exists, use it.
      if ($scope.topics.length > ($scope.activeTopicIndex + 1))
        _activeTopicId = $scope.topics[$scope.activeTopicIndex+1].id;

      // Otherwise, if the previous topic exists, use it.
      else if ($scope.activeTopicIndex > 0)
        _activeTopicId = $scope.topics[$scope.activeTopicIndex-1].id;

      // Otherwise, our topics list is about to be empty.
      // Other plans will have to be made.
      
      // Purge the current index.
      $scope.activeTopicIndex = -1;
    }

    // Filter the array.
    var initialLength = $scope.topics.length;
    $scope.topics = $scope.topics.filter(function(topic){ return topic.id != deleteTopicId; });

    // If the length hasn't changed, we're done.
    if (initialLength == $scope.topics.length) return;

    // If we're replacing the current topic, set a new topic.
    var newIndex = $scope.model.getTopicIndex(_activeTopicId);
    if (newIndex == null) newIndex = 0;
    $scope.model.activateTopicIndex(newIndex);

    // If the topic list is empty, stop the counter and end the conversation.
    if (!$scope.topics.length) {
      // Stop any counter event.
      if (_timeCounterEvent != null)
        clearInterval(_timeCounterEvent);

      // Clear out all model fields.
      _timeCounterEvent = null;
      $scope.conversationStart = null;
      $scope.activeTopicIndex = 0;
      _activeTopicId = null;
    }

    // Push state.
    _pushSharedState();
  });

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.submitDelta({
      activeTopicIndex: JSON.stringify(0),
      topics: JSON.stringify([]),
      conversationStart: JSON.stringify(null)
    });
  };

  var _pushSharedState = function(stateDelta){
    // If there was no state provided, just push the whole system.
    if (!stateDelta) {
      stateDelta = {
        activeTopicIndex: JSON.stringify($scope.activeTopicIndex),
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
    $scope.topics = JSON.parse(newState.topics);
    if (newState.conversationStart)
      $scope.conversationStart = JSON.parse(newState.conversationStart);

    // Make sure that the activeTopicIndex is updated.
    $scope.model.activateTopicIndex(JSON.parse(newState.activeTopicIndex));

    $scope.$apply();  // Have to do this to force the view to update.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    var initialState = gapi.hangout.data.getState();

    // If the state has not been initialized, do that now.
    if (initialState.activeTopicIndex == undefined) initGapiModel();
    // Otherwise, update internal state with shared state.
    else applySharedState(initialState);

    // Set up internal model to work with gapi.
    _gapiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(processStateUpdate);
  });
}

//HangDownListCntr.$inject = ['$scope'];
