
YUI.add('leaderBoardMojit-tests', function(Y) {

    var suite = new YUITest.TestSuite('leaderBoardMojit-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        
        name: 'leaderBoardMojit user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.leaderBoardMojit;
        },
        tearDown: function() {
            controller = null;
        },
        
        'test mojit': function() {
            var ac,
                modelData,
                assetsResults,
                doneResults;
            
            A.isNotNull(controller);
            A.isFunction(controller.index);
            
            
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'leaderBoardMojit']});
