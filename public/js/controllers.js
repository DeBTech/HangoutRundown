'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.currentUser = null;

  $scope.pastTopics = [];
  $scope.currentTopic = null;
  $scope.futureTopics = [];

  $scope.conversationStart = null;

  // Scaffold some shared functions.
  // NOTE: I hate this, but right now it solves the problem.
  $scope.model = {
    isTimerRunning: function(){},
    startConversation: function(){}
  };

  $scope.gapi = (function(myGapi){
    // Function factory to create wrapped GAPI functions that will only operate if
    // the GAPI has been activated and update the GAPI after each call.
    var _gapiLive = false;
    myGapi.updatingFunction = function(innerFunction){
      return function(){
        if (!_gapiLive) return;
        innerFunction.apply(this, arguments);
        myGapi.pushSharedState();
      };
    };

    /**
    InitGapiModel()
    Submits a blank state to GAPI that has placeholders for all required variables.
    */
    var _initGapiModel = function(){
      // Create expected values in the shared model.
      gapi.hangout.data.submitDelta({
        conversationStart: JSON.stringify(null),
        currentTopic: JSON.stringify(null),
        pastTopics: JSON.stringify([]),
        futureTopics: JSON.stringify([])
      });
    };

    /**
    PushSharedState()
    Pushes all of the current state to the server.
    */
    myGapi.pushSharedState = function(stateDelta){
      // If there was no state provided, just push the whole system.
      if (!stateDelta) {
        stateDelta = {
          conversationStart: JSON.stringify($scope.conversationStart),
          currentTopic: JSON.stringify($scope.currentTopic),
          pastTopics: JSON.stringify($scope.pastTopics),
          futureTopics: JSON.stringify($scope.futureTopics)
        };
      }

      // Next, set the current updater.
      stateDelta.modifier = $scope.currentUser.id;

      // Then submit the delta to GAPI.
      gapi.hangout.data.submitDelta( stateDelta );
    };

    var _processStateUpdate = function(stateChangedEvent){
      // If the current shared state update was self-originated, skip.
      if (stateChangedEvent.state.modifier == $scope.currentUser.id) return;

      // Otherwise, apply the shared state.
      applySharedState(stateChangedEvent.state);
    };

    var applySharedState = function(newState){
      console.log(newState);

      // Copy available elements of the state.
      if (newState.currentTopic) $scope.currentTopic = JSON.parse(newState.currentTopic);
      if (newState.futureTopics) $scope.futureTopics = JSON.parse(newState.futureTopics);
      if (newState.pastTopics) $scope.pastTopics = JSON.parse(newState.pastTopics);
      if (newState.conversationStart) $scope.conversationStart = JSON.parse(newState.conversationStart);

      // When applying a conversation, if there's not a timer event already started, get that shit going.
      if (!$scope.model.isTimerRunning()) $scope.model.startConversation();

      $scope.$apply();  // Have to do this to force the view to update.
    };

    var _serverTimeDelta = 0;
    myGapi.getServerTime = function(){
      var currentTime = new Date().getTime();
      return currentTime + _serverTimeDelta;
    };

    // Add a callback to initialize gAPI elements.
    gapi.hangout.onApiReady.add(function(eventObj){
      var initialState = gapi.hangout.data.getState();
      $scope.currentUser = gapi.hangout.getLocalParticipant();

      // If the state has not been initialized, do that now.
      if (initialState.currentTopic == undefined) _initGapiModel();
      // Otherwise, update internal state with shared state.
      else applySharedState(initialState);

      // Prepare to determine the time difference on the server.
      var timeKey = $scope.currentUser.id + '_timedelta';

      // Function to complete the remainder of initialization.
      var _completeInitialization = function(stateChangedEvent){
        // First, remove this callback from the notification list for gapi.
        gapi.hangout.data.onStateChanged.remove(_completeInitialization);

        // Determine the time delta between the local and server time.
        if (stateChangedEvent.metadata[timeKey] != undefined) {
          var timeKeyElement = stateChangedEvent.metadata[timeKey];

          _serverTimeDelta = timeKeyElement.timestamp - parseInt(timeKeyElement.value);

          // Remember to clear the time element.
          gapi.hangout.data.clearValue(timeKey);
        }

        // Install the event handler for a change in model state.
        gapi.hangout.data.onStateChanged.add(_processStateUpdate);

        // Finally, set up internal model to work with gapi.
        _gapiLive = true;
      };

      // Determine the server time delta and finish initialization.
      gapi.hangout.data.onStateChanged.add(_completeInitialization);
      gapi.hangout.data.setValue(timeKey, JSON.stringify(new Date().getTime()));
    });

    // Make sure to return the closure.
    return myGapi;
  })({});

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
      var id = creatorNameComponents[0] + '-'
               + $scope.gapi.getServerTime() + '-'
               + _topicCounter++;

      return {
        id: id,
        contents: topicName,
        creator: creator,
        duration: null,
        startTime: null
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
          $scope.currentTopic.startTime = $scope.gapi.getServerTime();
          model.startConversation();
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

      // TODO: Decide whether you should be able to delete the current topic.

      // Check to see if the current topic should be deleted.
      if ($scope.currentTopic != null && $scope.currentTopic.id == topicId)
        // If it should, either replace it with the first future topic, or null.
        if ($scope.futureTopics.length) {
          $scope.currentTopic = $scope.futureTopics.shift();
          $scope.currentTopic.startTime = $scope.gapi.getServerTime();
        }
        else $scope.currentTopic = null;
    };

    // AdvanceTopics()
    model.advanceTopics = function(){
      // Only advance if there are more topics to advance to.
      if ($scope.futureTopics.length) {
        $scope.currentTopic.duration = $scope.formatDuration($scope.currentTopic.startTime);
        $scope.currentTopic.startTime = null;
        $scope.pastTopics.push($scope.currentTopic);
        $scope.currentTopic = $scope.futureTopics.shift();
        $scope.currentTopic.startTime = $scope.gapi.getServerTime();
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

    var _timerEvent = null;
    model.startConversation = function(){
      // If the conversation duration hasn't been set, set it now.
      if ($scope.conversationStart == null)
        $scope.conversationStart = $scope.gapi.getServerTime();

      // If there's no timer event running, create one.
      if (_timerEvent == null) {
        _timerEvent = setInterval(function(){
          $scope.$apply();
        }, 1000);
      }
    };
    model.stopConversation = function(){
      if (_timerEvent) {
        clearInterval(_timerEvent);
        _timerEvent = null;
      }
    };
    model.isTimerRunning = function(){
      return _timerEvent != null;
    };

    // Make sure to return the closure.
    return model;
  })($scope.model || {});

  $scope.topicSortConfig = {
    stop: function(e, ui){
      // Push state.
      $scope.gapi.pushSharedState();
    }
  };

  //
  // Create all the public functions.
  //
  $scope.advanceTopics = $scope.gapi.updatingFunction($scope.model.advanceTopics);
  $scope.addNewTopic = $scope.gapi.updatingFunction($scope.model.addTopic);
  $scope.deleteTopic = $scope.gapi.updatingFunction($scope.model.deleteTopic);

  $scope.formatDuration = function(fromTime, toTime){
    if (toTime == undefined) toTime = $scope.gapi.getServerTime();
    var timeDiff = parseInt((toTime - fromTime)/1000);

    var hours = parseInt(timeDiff / (60*60));
    var hourRem = timeDiff % (60*60);
    var minutes = parseInt(hourRem / (60));
    var seconds = hourRem % (60);

    var result = hours.toString() + ":";
    if (minutes < 10) result += "0";
    result += minutes.toString() + ":";
    if (seconds < 10) result += "0";
    result += seconds.toString();

    return result;
  };

}

//HangDownListCntr.$inject = ['$scope'];
