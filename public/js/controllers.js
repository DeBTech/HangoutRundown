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
        if ($scope.currentTopic == null) {
          $scope.currentTopic = model.createTopic(newTopic, creator);
          model.startTimer();
        }
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

    var _timerEvent = null;
    model.startTimer = function(){
      $scope.conversationDuration = 0;
      _timerEvent = setInterval(function(){
        $scope.conversationDuration++;
        $scope.currentTopic.duration++;
      }, 1000);
    };
    model.stopTimer = function(){
      if (_timerEvent) {
        clearInterval(_timerEvent);
        _timerEvent = null;
      }
    };

    // Make sure to return the closure.
    return model;
  })({});

  $scope.topicSortConfig = {
    stop: function(e, ui){
      // Push state.
      _pushSharedState();
    }
  };

  $scope.formatDuration = function(durationInSeconds){
    var hours = parseInt(durationInSeconds / (60*60));
    var hourRem = durationInSeconds % (60*60);
    var minutes = parseInt(hourRem / (60));
    var seconds = hourRem % 60

    var result = hours.toString() + ":";
    if (minutes < 10) result += "0";
    result += minutes.toString() + ":";
    if (seconds < 10) result += "0";
    result += seconds.toString();

    return result;
  };

  // Create all the public functions.
  $scope.advanceTopics = _gapiUpdatingFunction($scope.model.advanceTopics);
  $scope.addNewTopic = _gapiUpdatingFunction($scope.model.addTopic);
  $scope.deleteTopic = _gapiUpdatingFunction($scope.model.deleteTopic);

  var initGapiModel = function(){
    // Create expected values in the shared model.
    gapi.hangout.data.submitDelta({
      conversationDuration: JSON.stringify(null),
      currentTopic: JSON.stringify(null),
      pastTopics: JSON.stringify([]),
      futureTopics: JSON.stringify([])
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
    // Copy available elements of the state.
    if (newState.currentTopic) $scope.currentTopic = JSON.parse(newState.currentTopic);
    if (newState.futureTopics) $scope.futureTopics = JSON.parse(newState.futureTopics);
    if (newState.pastTopics) $scope.pastTopics = JSON.parse(newState.pastTopics);
    if (newState.conversationDuration) $scope.conversationDuration = JSON.parse(newState.conversationDuration);

    $scope.$apply();  // Have to do this to force the view to update.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    var initialState = gapi.hangout.data.getState();

    // Set up internal model to work with gapi.
    _gapiLive = true;
    $scope.currentUser = gapi.hangout.getLocalParticipant();

    // If the state has not been initialized, do that now.
    if (Object.keys(initialState).length == 0) initGapiModel();
    // Otherwise, update internal state with shared state.
    else applySharedState(initialState);

    // Install the event handler for a change in model state.
    gapi.hangout.data.onStateChanged.add(processStateUpdate);
  });
}

//HangDownListCntr.$inject = ['$scope'];
