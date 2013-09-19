'use strict';

/* jasmine specs for controllers go here */
describe('HangDown Controllers', function() {
  describe('HangDownListCntr', function(){
    var scope, ctrl;

    beforeEach(function(){
      scope = {},
      ctrl = new HangDownListCntr(scope)
    });


    it('should have a list of items', function() {
      expect(scope.items).toBeDefined();
    });
  });
});
