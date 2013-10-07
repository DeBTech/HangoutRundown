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
  });

  //===========================================================================
  // UI METHODS
  //===========================================================================
  describe('ui methods', function(){
    it('should be able to advance topics', function(){
      expect(scope.model.advanceTopics).toBeDefined();

      var currentTopic = scope.model.createTopic('New Topic', 'Test User');
      var nextTopic = scope.model.createTopic('Another New Topic', 'Test User');

      scope.currentTopic = currentTopic;
      scope.futureTopics.push(nextTopic);
      scope.model.advanceTopics();

      expect(scope.pastTopics.length).toEqual(1);
      expect(scope.currentTopic.id).toEqual(nextTopic.id);
      expect(scope.futureTopics.length).toEqual(0);
    });

    it('should not advance topics if there are no future topics', function(){
      var currentTopic = scope.model.createTopic('New Topic', 'Test User');

      scope.currentTopic = currentTopic;
      scope.model.advanceTopics();

      expect(scope.pastTopics.length).toEqual(0);
      expect(scope.currentTopic.id).toEqual(currentTopic.id);
    });

    it('should be able to add new topics', function(){
      expect(scope.model.addTopic).toBeDefined();

      var topicToAdd = 'New Topic';
      scope.model.addTopic(topicToAdd, 'Test User');
      expect(scope.currentTopic).not.toBeNull();
      expect(scope.currentTopic.contents).toEqual(topicToAdd);
    });

    it('should trim topics before adding them', function(){
      scope.model.addTopic('   New Topic ', 'Test User');
      expect(scope.currentTopic.contents).toEqual('New Topic');
    });

    it('should add additional topics to the future topics list', function(){
      var firstTopicToAdd = 'New Topic';
      var secondTopicToAdd = 'Another Topic';

      scope.model.addTopic(firstTopicToAdd, 'Test User');
      scope.model.addTopic(secondTopicToAdd, 'Test User');

      expect(scope.currentTopic.contents).toEqual(firstTopicToAdd);
      expect(scope.futureTopics.length).toEqual(1);
      expect(scope.futureTopics[0].contents).toEqual(secondTopicToAdd);
    });

    it('should not try to add empty topics', function(){
      scope.model.addTopic('', 'Test User');
      expect(scope.currentTopic).toBeNull();
    });

    it('should be able to add multiple topics at once, divided by ";;" or "<newline>"', function(){
      var multiTopic = "This is ;; my multi;; topic \n string;;that is \n here.";
      scope.model.addTopic(multiTopic, 'Test User');
      expect(scope.currentTopic.contents).toEqual('This is');
      expect(scope.futureTopics[0].contents).toEqual('my multi');
      expect(scope.futureTopics[1].contents).toEqual('topic');
      expect(scope.futureTopics[2].contents).toEqual('string');
      expect(scope.futureTopics[3].contents).toEqual('that is');
      expect(scope.futureTopics[4].contents).toEqual('here.');
    });
  });

  //===========================================================================
  // TOPICS
  //===========================================================================
  describe('topic model', function(){
    it('should correctly create new topics', function(){
      expect(scope.model.createTopic).toBeDefined();

      var newTopic = scope.model.createTopic('New Topic', 'Temp User');

      expect(newTopic.id).toBeDefined();
      expect(newTopic.creator).toEqual('Temp U');
      expect(newTopic.contents).toEqual('New Topic');
      expect(newTopic.duration).toEqual(0);
    });

    it('should create topics with unique ids', function(){
      var newTopic = scope.model.createTopic('New Topic', 'Temp User');
      var newTopic2 = scope.model.createTopic('New Topic2', 'Temp User');
      expect(newTopic.id).not.toEqual(newTopic2.id);
    });

    it('should be able to find topics by id in a topic list', function(){
      expect(scope.model.findTopicInList).toBeDefined();

      var topicList = [];
      topicList.push(scope.model.createTopic('New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('Another New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('A Third New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('A Final New Topic', 'Test User'));

      var searchIndex = 2;
      expect(scope.model.findTopicInList(topicList[searchIndex].id, topicList)).toEqual(searchIndex);
    });

    it('should not be able to find non-existant topics in a topic list', function(){
      var topicList = [];
      topicList.push(scope.model.createTopic('New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('Another New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('A Third New Topic', 'Test User'));
      topicList.push(scope.model.createTopic('A Final New Topic', 'Test User'));

      expect(scope.model.findTopicInList('NonId', topicList)).toEqual(-1);
    });

    it('should be able to delete the current topic', function(){
      expect(scope.model.deleteTopic).toBeDefined();

      scope.currentTopic = scope.model.createTopic('New Topic', 'Test User');
      scope.model.deleteTopic(scope.currentTopic.id);
      expect(scope.currentTopic).toBeNull();
    });

    it('should replace the current topic with the next future topic if deleted', function(){
      scope.currentTopic = scope.model.createTopic('New Topic', 'Test User');
      scope.futureTopics.push(scope.model.createTopic('Another New Topic', 'Test User'));

      scope.model.deleteTopic(scope.currentTopic.id);

      expect(scope.currentTopic).not.toBeNull();
      expect(scope.currentTopic.contents).toEqual('Another New Topic');
      expect(scope.futureTopics.length).toEqual(0);
    });

    it('should be able to delete future topics', function(){
      scope.currentTopic = scope.model.createTopic('New Topic', 'Test User');
      scope.futureTopics.push(scope.model.createTopic('Another New Topic', 'Test User'));
      
      scope.model.deleteTopic(scope.futureTopics[0].id);

      expect(scope.currentTopic).not.toBeNull();
      expect(scope.futureTopics.length).toEqual(0);
    });

    it('should not be able to delete past topics', function(){
      scope.pastTopics.push(scope.model.createTopic('Another New Topic', 'Test User'));
      
      scope.model.deleteTopic(scope.pastTopics[0].id);

      expect(scope.pastTopics.length).toEqual(1);
    });
  });

  //===========================================================================
  // CONVERSATION
  //===========================================================================
  // Use jasmine.Clock.useMock();
  xit('should start the conversation when the first topic is created', function(){ expect(true).toBe(false); });

  xit('should not change the conversation start time after the first topic is created', function(){ expect(true).toBe(false); });

  xit('should update durations on every tick', function(){ expect(true).toBe(false); });

  //===========================================================================
  // GAPI
  //===========================================================================
  xit('should initialize the gapi correctly if it has\'t been already', function(){ expect(true).toBe(false); });
  xit('should initialize with the shared state if one already exists', function(){ expect(true).toBe(false); });

  xit('should not apply gapi updates if self-originated', function(){ expect(true).toBe(false); });
  xit('should apply gapi updates that are not self-originated', function(){ expect(true).toBe(false); });

  //===========================================================================
  // MISC
  //===========================================================================
  xdescribe('randomly', function(){
    xit('should be able to format durations in a conversation-readable way', function(){
      expect(scope.formatDuration).toBeDefined();
      var duration = 1*60*60 + 13*60 + 30;
      var formattedDuration = scope.formatDuration(duration);
      expect(formattedDuration).toMatch(/[0-9]*1:13:3[0-9]/);
    });
  });
});
