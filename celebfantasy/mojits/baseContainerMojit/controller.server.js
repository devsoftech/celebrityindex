/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('baseContainerMojit', function(Y, NAME) {

/**
 * The baseContainerMojit module.
 *
 * @module baseContainerMojit
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            var config = ac.config.get('');
            ac.composite.execute(config, function(data, meta){
                ac.assets.addCss('./index.css');
                ac.assets.addJs('./ticker.js');
                console.log(data);
                ac.done(data, meta);    
            });
            
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-config-addon', 'mojito-composite-addon', 'baseContainerMojitModelFoo']});
