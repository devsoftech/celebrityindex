
YUI.add('baseContainerMojit-tests', function(Y) {

    var suite = new YUITest.TestSuite('baseContainerMojit-tests'),
        controller = null,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        
        name: 'baseContainerMojit user tests',
        
        setUp: function() {
            controller = Y.mojito.controllers.baseContainerMojit;
        },
        tearDown: function() {
            controller = null;
        },
        
        'test mojit': function() {
            var ac,
                modelData,
                assetsResults,
                doneResults;
            modelData = { x:'y' };
            ac = {
                assets: {
                    addCss: function(css) {
                        assetsResults = css;
                    }
                },
                models: {
                    get: function(modelName) {
                        A.areEqual('baseContainerMojitModelFoo', modelName, 'wrong model name');
                        return {
                            getData: function(cb) {
                                cb(null, modelData);
                            }
                        }
                    }
                },
                composite:{
                    "execute": function (cfg, cb) {

                    }
                },
                done: function(data) {
                    doneResults = data;
                }
            };
            A.isTrue(true);
            
            
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'baseContainerMojit']});
