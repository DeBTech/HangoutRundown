'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('HangDown App', function() {

  describe('Primary View', function() {
    beforeEach(function() {
      browser().navigateTo('/app.xml');
    });

    it('should have a list of controls', function() {
      expect(element('#HangDownControls').count()).toBe(1);
    });
  });
});
