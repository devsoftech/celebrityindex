/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('baseContainerMojitModelFoo', function(Y, NAME) {

/**
 * The baseContainerMojitModelFoo module.
 *
 * @module baseContainerMojit
 */

    /**
     * Constructor for the baseContainerMojitModelFoo class.
     *
     * @class baseContainerMojitModelFoo
     * @constructor
     */
    Y.namespace('mojito.models')[NAME] = {

        init: function(config) {
            this.config = config;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {function(err,data)} The callback function to call when the
         *        data has been retrieved.
         */
        getData: function(callback) {
            callback(null, { some: 'data' });
        }

    };

}, '0.0.1', {requires: []});
