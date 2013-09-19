'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.items = [];

  $scope.activeItem = 0;
  $scope.currentUser = null;

  $scope.regressTopic = function(){
    if ($scope.activeItem > 0)
      $scope.activeItem--;
  };

  $scope.advanceTopic = function(){
    if ($scope.activeItem < $scope.items.length - 1)
      $scope.activeItem++;
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

    // TODO: Create a model to encapsulate the list and notifies Google of changes.
  };

  // Add a callback to initialize gAPI elements.
  gapi.hangout.onApiReady.add(function(eventObj){
    $scope.currentUser = gapi.hangout.getLocalParticipant().person.displayName;
  });
}

//HangDownListCntr.$inject = ['$scope'];
