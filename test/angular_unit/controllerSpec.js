'use strict';

/* jasmine specs for controllers go here */
describe('HangDown Controllers', function() {
  describe('HangDownListCntr', function(){
    var scope, ctrl;

    beforeEach(function(){
      scope = { '$apply': function(){} },
      gapi.hangout.data.currentState = {},
      ctrl = new HangDownListCntr(scope)
    });

    //===========================================================================
    // INITILIZATIONS
    //===========================================================================
    it('should have a list of topics', function() {
      expect(scope.topics).toBeDefined();
    });

    //===========================================================================
    // ADDING TOPICS
    //===========================================================================
    it('should be able to add new topics', function(){
      expect(scope.newTopicBuffer).toBeDefined();
      expect(scope.topics.length).toEqual(0);

      scope.newTopicBuffer = 'This is my new topic';
      scope.addNewTopic();

      expect(scope.topics.length).toEqual(1);
      expect(scope.newTopicBuffer).toEqual('');
    });

    it('should not add empty topics', function(){
      scope.newTopicBuffer = '';
      scope.addNewTopic();

      expect(scope.topics.length).toEqual(0);
    });

    it('should be able to add multiple topics at once, divided by ";;"', function(){
      // Attempt to add multiple items.
      scope.newTopicBuffer = ' Thing 1;; Thing 2 ;;Thing3 ';
      scope.addNewTopic();

      // Check to make sure that the topics have been added.
      expect(scope.topics.length).toEqual(3);
      expect(scope.topics[0].label).toEqual('Thing 1');
      expect(scope.topics[1].label).toEqual('Thing 2');
      expect(scope.topics[2].label).toEqual('Thing3');
    });

    var sampleTopics = [
      { id: '1', label: 'This is a thing.', creator: 'Bret' },
      { id: '2', label: 'This is another thing.', creator: 'Alicia' },
      { id: '3', label: 'This is a third thing.', creator: 'Frank' },
      { id: '4', label: 'This is NOT a thing.', creator: 'Jim' },
      { id: '5', label: 'This is an after thing.', creator: 'Jan' }
    ];

    //===========================================================================
    // NAVIGATING TOPICS
    //===========================================================================
    it('should be able to advance topics', function(){
      scope.topics = sampleTopics;
      scope.activeTopicIndex = 2;

      scope.advanceTopic();
      expect(scope.activeTopicIndex).toEqual(3);
    });

    it('should not advance past the end of the topic list', function(){
      scope.topics = sampleTopics;
      scope.activeTopicIndex = scope.topics.length - 1;

      scope.advanceTopic();
      expect(scope.activeTopicIndex).toEqual(scope.topics.length - 1);
    });

    it('should be able to regress topics', function(){
      scope.topics = sampleTopics;
      scope.activeTopicIndex = 2;

      scope.regressTopic();
      expect(scope.activeTopicIndex).toEqual(1);
    });

    it('should not regress past the beginning of the topic list', function(){
      scope.topics = sampleTopics;
      scope.activeTopicIndex = 0;

      scope.regressTopic();
      expect(scope.activeTopicIndex).toEqual(0);
    });

    //===========================================================================
    // GAPI UPDATES
    //===========================================================================
    it('should not apply gapi updates if self-originated', function(){
      // Set initial state.
      scope.activeTopicIndex = 3;
      var currentUser = gapi.hangout.getLocalParticipant();

      // Attempt to push a "fake" change that originated with self.
      gapi.hangout.data.submitDelta({
        activeTopicIndex: '5',
        modifier: currentUser.id
      });

      // Make sure that the internal model has not changed.
      expect(scope.activeTopicIndex).toEqual(3);
    });

    it('should apply gapi updates that are not self-originated', function(){
      // Set initial state.
      scope.activeTopicIndex = 3;
      var currentUser = gapi.hangout.getLocalParticipant();

      // Attempt to push a "fake" change that originated with self.
      gapi.hangout.data.submitDelta({
        activeTopicIndex: '5',
        modifier: '99999'
      });

      // Make sure that the internal model has not changed.
      expect(scope.activeTopicIndex).toEqual(5);
    });

    //===========================================================================
    // DELETING TOPICS
    //===========================================================================
    it('should be able to delete topics', function(){
      scope.topics = sampleTopics;

      // Attempt to delete a topic.
      var topicToDelete = '4';
      scope.deleteTopic(topicToDelete);

      // Make sure that the topic is no longer present.
      expect(scope.topics.length).toBeLessThan(sampleTopics.length);
      for (var i = scope.topics.length - 1; i >= 0; i--) {
        expect(scope.topics[i].id).not.toEqual(topicToDelete);
      };
    });

    it('should gracefully ignore topics that do not exist', function(){
      scope.topics = sampleTopics;

      // Attempt to delete a non existant topic.
      var topicToDelete = '7';
      scope.deleteTopic(topicToDelete);

      // Make sure that the topic is no longer present.
      expect(scope.topics.length).toEqual(sampleTopics.length);
    });

    it('should not leave an active item index that is too large for the array', function(){
      scope.topics = sampleTopics;
      scope.activeTopicIndex = 4;

      // Attempt to delete a topic.
      var topicToDelete = '5';
      scope.deleteTopic(topicToDelete);

      // Make sure that the topic is no longer present.
      expect(scope.topics.length).toBeLessThan(sampleTopics.length);

      // Make sure that the activeTopicIndex is sensible.
      expect(scope.activeTopicIndex).toBeLessThan(scope.topics.length);
    });
  });
});
