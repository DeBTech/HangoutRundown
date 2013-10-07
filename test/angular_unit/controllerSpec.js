'use strict';

/* jasmine specs for controllers go here */
describe('HangDownListController', function(){
  var scope, ctrl;

  beforeEach(function(){
    // Create a clean scope.
    scope = { '$apply': function(){} },

    // Create a clean shared state.
    gapi.hangout.data.currentState = {},

    // Initialize the a clean controller.
    ctrl = new HangDownListCntr(scope),

    gapi.isEnabled = false;
  });

  //===========================================================================
  // INITILIZATIONS
  //===========================================================================
  describe('initialization functions', function(){
    it('should initialize to a known state', function() {
      expect(scope.pastTopics).toBeDefined();
      expect(scope.currentTopic).toBeDefined();
      expect(scope.futureTopics).toBeDefined();
      expect(scope.conversationDuration).toBeDefined();

      expect(scope.pastTopics).toEqual([]);
      expect(scope.currentTopic).toBeNull();
      expect(scope.futureTopics).toEqual([]);
      expect(scope.conversationDuration).toBeNull();

      expect(scope.model).toBeDefined();
    });

    xit('should initialize with the shared state if one already exists', function(){ expect(true).toBe(false); });
  });

  //===========================================================================
  // UI METHODS
  //===========================================================================
  xdescribe('ui methods', function(){
    xit('should be able to advance topics', function(){ expect(true).toBe(false); });
    xit('should not advance topics if there are no future topics', function(){ expect(true).toBe(false); });

    it('should be able to add new topics', function(){
      var topicToAdd = 'New Topic';
      scope.addTopic(topicToAdd);
      expect(scope.currentTopic.contents).toEqual(topicToAdd);
    });
    it('should add additional topics to the future topics list', function(){
      var firstTopicToAdd = 'New Topic';
      var secondTopicToAdd = 'Another Topic';

      scope.addTopic(firstTopicToAdd);
      scope.addTopic(secondTopicToAdd);

      expect(scope.currentTopic.contents).toEqual(firstTopicToAdd);
      expect(scope.futureTopics.length).toEqual(1);
      expect(scope.futureTopics[0].id).toEqual(secondTopicToAdd);
    });
    it('should not try to add empty topics', function(){

    });
    xit('should be able to add multiple topics at once, divided by ";;" or "<newline>"', function(){ expect(true).toBe(false); });
  });

  //===========================================================================
  // TOPICS
  //===========================================================================
  xdescribe('topic model', function(){
    it('should correctly create new topics', function(){
      expect(scope.model.createTopic).toBeDefined();

      var newTopic = scope.model.createTopic('New Topic', 'Temp User');

      expect(newTopic.id).toBeDefined();
      expect(newTopic.creator).toEqual('Temp U');
      expect(newTopic.contents).toEqual('New Topic');
      expect(newTopic.duration).toBeDefined();
      expect(newTopic.duration).toBeNull();
    });

    it('should create topics with unique ids', function(){
      var newTopic = scope.model.createTopic('New Topic', 'Temp User');
      var newTopic2 = scope.model.createTopic('New Topic2', 'Temp User');
      expect(newTopic.id).not.toEqual(newTopic2.id);
    });

    xit('should be able to find topics by id in a topic list', function(){ expect(true).toBe(false); });
    xit('should be able to delete future topics', function(){ expect(true).toBe(false); });
    xit('should be able to delete the current topic', function(){ expect(true).toBe(false); });
    xit('should not be able to delete past topics', function(){ expect(true).toBe(false); });
  });

  //===========================================================================
  // CONVERSATION
  //===========================================================================
  xit('should start the conversation when the first topic is created', function(){ expect(true).toBe(false); });

  xit('should not change the conversation start time after the first topic is created', function(){ expect(true).toBe(false); });

  xit('should update durations on every tick', function(){ expect(true).toBe(false); });

  //===========================================================================
  // GAPI
  //===========================================================================
  xit('should initialize the gapi correctly if it has\'t been already', function(){ expect(true).toBe(false); });

  xit('should not apply gapi updates if self-originated', function(){ expect(true).toBe(false); });
  xit('should apply gapi updates that are not self-originated', function(){ expect(true).toBe(false); });

  //===========================================================================
  // MISC
  //===========================================================================
  xdescribe('randomly', function(){
    it('should be able to format timestamp differences in a conversation-readable way', function(){
      expect(scope.formatDuration).toBeDefined();
      var duration = 1*60*60 + 13*60 + 30;
      var formattedDuration = scope.formatDuration(duration);
      expect(formattedDuration).toMatch(/[0-9]*1:13:3[0-9]/);
    });
  });
});
