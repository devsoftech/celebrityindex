
YUI.add('tickrMojit-tests', function(Y) {

    var suite = new YUITest.TestSuite('tickrMojit-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        
        name: 'tickrMojit user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.tickrMojit;
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
            
            
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'tickrMojit']});
