/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('celebTickrMojit', function(Y, NAME) {

/**
 * The celebTickrMojit module.
 *
 * @module celebTickrMojit
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
            ac.done({});
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon', 'celebTickrMojitModelFoo']});
