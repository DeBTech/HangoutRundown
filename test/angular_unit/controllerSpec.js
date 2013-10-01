'use strict';

/* jasmine specs for controllers go here */
describe('HangDown Controllers', function() {
  describe('HangDownListCntr', function(){
    var scope, ctrl, sampleTopics;

    beforeEach(function(){
      // Create a clean scope.
      scope = { '$apply': function(){} },

      // Create a clean shared state.
      gapi.hangout.data.currentState = {},

      // Initialize the a clean controller.
      ctrl = new HangDownListCntr(scope),

      // Make sure that sample topics are refreshed each test.
      sampleTopics = [
        { id: '1', label: 'This is a thing.', creator: 'Bret', startTime: null },
        { id: '2', label: 'This is another thing.', creator: 'Alicia', startTime: null },
        { id: '3', label: 'This is a third thing.', creator: 'Frank', startTime: null },
        { id: '4', label: 'This is NOT a thing.', creator: 'Jim', startTime: null },
        { id: '5', label: 'This is an after thing.', creator: 'Jan', startTime: null }
      ];

      gapi.isEnabled = false;
    });

    //===========================================================================
    // INITILIZATIONS
    //===========================================================================
    it('should have a list of topics', function() {
      expect(scope.topics).toBeDefined();
    });

    it('should have a timestamp of when the conversation started', function(){
      expect(scope.conversationStart).toBeDefined();
    });

    it('should initialize with the shared state if one already exists', function(){
      // Create a shared state.
      gapi.hangout.data.currentState = {
        topics: JSON.stringify(sampleTopics),
        activeTopicId: '4',
        conversationStart: 0
      };

      // For a new controller to be created.
      ctrl = new HangDownListCntr(scope);

      // Make sure that the initial state is correct.
      expect(scope.topics.length).toEqual(sampleTopics.length);
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('4');
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

    it('should start the conversation when the first topic is created', function(){
      var beforeTime = new Date().getTime();
      scope.newTopicBuffer = "Demo topic";
      scope.addNewTopic();
      var afterTime = new Date().getTime();

      expect(scope.conversationStart).not.toBeLessThan(beforeTime);
      expect(scope.conversationStart).not.toBeGreaterThan(afterTime);
      expect(scope.conversationStart).toEqual(scope.topics[scope.activeTopicIndex].startTime);
    });

    it('should not change the conversation start time after the first topic is created', function(){
      scope.newTopicBuffer = "Demo topic";
      scope.addNewTopic();

      var firstTime = scope.conversationStart;

      scope.newTopicBuffer = "Demo topic 2";
      scope.addNewTopic();

      expect(scope.conversationStart).toEqual(firstTime);
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

    it('should set the start time of the topic when navigating to it', function(){
      scope.topics = sampleTopics;

      var beforeTime = new Date().getTime();
      scope.advanceTopic();
      var afterTime = new Date().getTime();
      expect(scope.topics[scope.activeTopicIndex].startTime).toBeDefined();
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeNull();
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeLessThan(beforeTime);
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeGreaterThan(afterTime);

      beforeTime = new Date().getTime();
      scope.regressTopic();
      afterTime = new Date().getTime();
      expect(scope.topics[scope.activeTopicIndex].startTime).toBeDefined();
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeNull();
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeLessThan(beforeTime);
      expect(scope.topics[scope.activeTopicIndex].startTime).not.toBeGreaterThan(afterTime);
    });

    //===========================================================================
    // GAPI UPDATES
    //===========================================================================
    it('should not apply gapi updates if self-originated', function(){
      // Set initial state.
      gapi.isEnabled = true;
      scope.activeTopicIndex = 3;
      var currentUser = gapi.hangout.getLocalParticipant();

      // Attempt to push a "fake" change that originated with self.
      gapi.hangout.data.submitDelta({
        activeTopicIndex: '5',
        modifier: currentUser.id,
      });

      // Make sure that the internal model has not changed.
      expect(scope.activeTopicIndex).toEqual(3);
    });

    it('should apply gapi updates that are not self-originated', function(){
      // Set initial state.
      gapi.isEnabled = true;
      gapi.hangout.data.currentState = { topics: JSON.stringify(sampleTopics) };
      scope.activeTopicIndex = 3;

      // Attempt to push a "fake" change that originated with self.
      gapi.hangout.data.submitDelta({
        activeTopicId: JSON.stringify('5'),
        modifier: '99999'
      });

      // Make sure that the internal model has not changed.
      expect(scope.activeTopicIndex).toEqual(4);
    });

    //===========================================================================
    // REORDERING TOPICS
    //===========================================================================
    it('should not change the active topic if the list is reordered', function(){
      // Send a message to prime the system.
      scope.topics = sampleTopics;
      scope.newTopicBuffer = 'Demo Topic';  // Add another topic to force a selected ID.
      scope.addNewTopic();

      // Verify that the correct topic is selected.
      expect(scope.activeTopicIndex).toEqual(0);
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('1');

      // Change the order locally.
      scope.topics = scope.topics.reverse();

      // Signal that the order has changed.
      scope.topicSortConfig.stop({}, {});

      // Verify that the same topic is still selected.
      expect(scope.activeTopicIndex).toEqual(5);
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('1');
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

    it('should not change the active topic if a previous topic is deleted', function(){
      scope.topics = sampleTopics;

      // Set up the current selection.
      scope.goToTopic('3');

      // Current topic should be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('3');

      // Attempt to delete a topic.
      var topicToDelete = '1';
      scope.deleteTopic(topicToDelete);

      // Current topic should still be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('3');
    });

    it('should select the next topic if the current topic is deleted', function(){
      scope.topics = sampleTopics;

      // Set up the current selection.
      scope.goToTopic('3');

      // Current topic should be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('3');

      // Attempt to delete a topic.
      var topicToDelete = '3';
      scope.deleteTopic(topicToDelete);

      // Current topic should still be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('4');
    });

    it('should not leave an active item index that is too large for the array', function(){
      scope.topics = sampleTopics;

      // Set up the current selection.
      scope.goToTopic('5');

      // Current topic should be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('5');

      // Attempt to delete a topic.
      var topicToDelete = '5';
      scope.deleteTopic(topicToDelete);

      // Current topic should still be '3'.
      expect(scope.topics[scope.activeTopicIndex].id).toEqual('4');
    });

    it('should gracefully handle deleting the only topic', function(){
      scope.newTopicBuffer = 'Demo topic.';
      scope.addNewTopic();

      expect(scope.topics.length).toBeGreaterThan(0);
      var topicId = scope.topics[0].id;
      scope.deleteTopic(topicId);
      expect(scope.topics.length).toEqual(0);
    });

    //===========================================================================
    // MISC
    //===========================================================================
    it('should be able to format timestamp differences in a conversation-readable way', function(){
      expect(scope.formatDuration).toBeDefined();

      // First, create a known timestamp.
      var currentTime = new Date().getTime();
      // Subtract a predicatable number of seconds. 1 hr, 13 min, 30 sec
      var pastTime = currentTime - (1*60*60 + 13*60 + 30);

      var formattedDuration = scope.formatDuration(pastTime);

      expect(formattedDuration).toMatch(/[0-9]*1:13:3[0-9]/);
    });
  });
});
