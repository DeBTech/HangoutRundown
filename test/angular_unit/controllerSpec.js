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
      expect(scope.conversationStart).toBeDefined();

      expect(scope.pastTopics).toEqual([]);
      expect(scope.currentTopic).toBeNull();
      expect(scope.futureTopics).toEqual([]);
      expect(scope.conversationStart).toBeNull();

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
      expect(newTopic.startTime).toBeNull();
      expect(newTopic.duration).toBeNull();
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
  // TIMERS
  //===========================================================================
  describe('timers', function(){
    beforeEach(function(){
      jasmine.Clock.useMock();
    });

    it('should not start the conversation until a topic is created', function(){
      expect(scope.conversationStart).toBeNull();
    });

    it('should start the conversation when the first topic is created', function(){
      var preTime = new Date().getTime();
      scope.model.addTopic('New Topic', 'Test User');
      var postTime = new Date().getTime();

      expect(scope.conversationStart).not.toBeLessThan(preTime);
      expect(scope.conversationStart).not.toBeGreaterThan(postTime);
      expect(scope.currentTopic.startTime).not.toBeLessThan(preTime);
      expect(scope.currentTopic.startTime).not.toBeGreaterThan(postTime);
    });

    it('should not change the conversation start time after the first topic is created', function(){
      scope.model.addTopic('New Topic', 'Test User');
      var origConversationStart = scope.conversationStart;

      scope.model.addTopic('Another New Topic', 'Test User');
      expect(scope.conversationStart).toEqual(origConversationStart);
    });

    it('should keep the time for past topics', function(){
      scope.model.addTopic('New Topic', 'Test User');
      expect(scope.currentTopic.startTime).not.toBeNull();
      expect(scope.currentTopic.duration).toBeNull();

      scope.model.addTopic('Another New Topic', 'Test User');
      expect(scope.futureTopics[0].startTime).toBeNull();
      expect(scope.futureTopics[0].duration).toBeNull();

      scope.model.advanceTopics();
      expect(scope.currentTopic.startTime).not.toBeNull();
      expect(scope.currentTopic.duration).toBeNull();

      expect(scope.pastTopics[0].startTime).toBeNull();
      expect(scope.pastTopics[0].duration).toMatch(/0+:0+:0+/);
    });
  });

  //===========================================================================
  // GAPI
  //===========================================================================
  describe('gapi interface', function(){
    beforeEach(function(){
      gapi.isEnabled = true;
    });

    it('should initialize the gapi correctly if it has\'t been already', function(){
      // Verify that the GAPI has an empty state.
      expect(Object.keys(gapi.hangout.data.currentState).length).toEqual(0);

      // Create a new controller interface.
      ctrl = new HangDownListCntr(scope);

      // Make sure that the required elements have be defined.
      var newState = gapi.hangout.data.getState();
      expect(newState.conversationStart).toBeDefined();
      expect(newState.currentTopic).toBeDefined();
      expect(newState.pastTopics).toBeDefined();
      expect(newState.futureTopics).toBeDefined();
    });

    it('should initialize with the shared state if one already exists', function(){
      // Create a sample state.
      var startTime = new Date().getTime();
      var newTopic = scope.model.createTopic('New Topic', 'Test User');
      newTopic.startTime = startTime;
      gapi.hangout.data.currentState = {
        conversationStart: JSON.stringify(startTime),
        currentTopic: JSON.stringify(newTopic)
      };

      // Create a new controller interface.
      ctrl = new HangDownListCntr(scope);

      // Validate the state.
      expect(scope.conversationStart).toEqual(startTime);
      expect(scope.currentTopic.contents).toEqual('New Topic');
      expect(scope.currentTopic.startTime).toEqual(startTime);
    });

    it('should not apply gapi updates if self-originated', function(){
      scope.model.addTopic('New Topic', 'Test User');

      // Create a sample update.
      var newTopic = scope.model.createTopic('Another New Topic', 'Test User');
      gapi.hangout.data.submitDelta({
        currentTopic: JSON.stringify(newTopic),
        modifier: scope.currentUser.id
      });

      expect(scope.currentTopic.contents).toEqual('New Topic');
    });

    it('should apply gapi updates that are not self-originated', function(){
      scope.model.addTopic('New Topic', 'Test User');

      // Create a sample update.
      var newTopic = scope.model.createTopic('Another New Topic', 'Test User');
      gapi.hangout.data.submitDelta({
        currentTopic: JSON.stringify(newTopic),
        modifier: 'NonId'
      });

      expect(scope.currentTopic.contents).toEqual('Another New Topic');
    });
  });

  //===========================================================================
  // MISC
  //===========================================================================
  describe('randomly', function(){
    it('should be able to format durations in a conversation-readable way', function(){
      expect(scope.formatDuration).toBeDefined();

      var fromTime = new Date().getTime();
      var toTime = fromTime + (1*60*60 + 13*60 + 30)*1000;
      var formattedDuration = scope.formatDuration(fromTime, toTime);
      expect(formattedDuration).toMatch(/[0-9]*1:13:3[0-9]/);
    });
  });
});
