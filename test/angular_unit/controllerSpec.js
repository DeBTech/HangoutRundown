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

    it('should be able to add new topics', function(){
      expect(scope.newTopicBuffer).toBeDefined();
      expect(scope.items.length).toEqual(0);

      scope.newTopicBuffer = 'This is my new topic';
      scope.addNewTopic();

      expect(scope.items.length).toEqual(1);
      expect(scope.newTopicBuffer).toEqual('');
    });

    it('should not add empty topics', function(){
      scope.newTopicBuffer = '';
      scope.addNewTopic();

      expect(scope.items.length).toEqual(0);
    });

    var sampleTopics = [
      { label: 'This is a thing.', creator: 'Bret' },
      { label: 'This is another thing.', creator: 'Alicia' },
      { label: 'This is a third thing.', creator: 'Frank' },
      { label: 'This is NOT a thing.', creator: 'Jim' },
      { label: 'This is an after thing.', creator: 'Jan' }
    ];

    it('should be able to advance topics', function(){
      scope.items = sampleTopics;
      scope.activeItem = 2;

      scope.advanceTopic();
      expect(scope.activeItem).toEqual(3);
    });

    it('should not advance past the end of the topic list', function(){
      scope.items = sampleTopics;
      scope.activeItem = scope.items.length - 1;

      scope.advanceTopic();
      expect(scope.activeItem).toEqual(scope.items.length - 1);
    });

    it('should be able to regress topics', function(){
      scope.items = sampleTopics;
      scope.activeItem = 2;

      scope.regressTopic();
      expect(scope.activeItem).toEqual(1);
    });

    it('should not regress past the beginning of the topic list', function(){
      scope.items = sampleTopics;
      scope.activeItem = 0;

      scope.regressTopic();
      expect(scope.activeItem).toEqual(0);
    });
  });
});
