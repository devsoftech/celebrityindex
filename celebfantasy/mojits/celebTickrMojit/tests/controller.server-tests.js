
YUI.add('celebTickrMojit-tests', function(Y) {

    var suite = new YUITest.TestSuite('celebTickrMojit-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        
        name: 'celebTickrMojit user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.celebTickrMojit;
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
    
}, '0.0.1', {requires: ['mojito-test', 'celebTickrMojit']});
