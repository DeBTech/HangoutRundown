'use strict';

/* Controllers */

function HangDownListCntr($scope) {
  $scope.items = [
    {label: 'Let us discuss this.', creator: 'Bret'},
    {label: 'ALL discuss this.', creator: 'D'},
    {label: 'More discuss this.', creator: 'Bret'},
    {label: 'ALL more discuss this.', creator: 'D'}
  ];

  $scope.activeItem = 1;
}

//HangDownListCntr.$inject = ['$scope'];
