/************************
 * david.utilities
 * 
 * The utilities classes are a library of helper functions to standardise functionality
 * or make tasks easier.
 */

define(["jquery"],
    function($jQ){
        /*********************
         * UPDATE THE STRING PROTOTYPE
         *********************/
        
        
        /**
         * Pads the string on the left using the character provided, ensures the string is
         * no longer than tnFinal length after padding.
         */
        String.prototype.padLeft = function(tcPadPattern, tnFinalLength)
        {
            var loRE = new RegExp(".{" + tnFinalLength + "}$");
            var lcPadding = "";
            do
            {
                lcPadding += tcPadPattern;
            } while(lcPadding.length < tnFinalLength);
            return loRE.exec(lcPadding + this);
        }
        
        /**
         * Pads the string on the right using the character provided, ensures the string is
         * no longer than tnFinal length after padding.
         */
        String.prototype.padRight = function(tcPadPattern, tnFinalLength)
        {
            var loRE = new RegExp("^.{" + tnFinalLength + "}");
            var lcPadding = "";
            do
            {
                lcPadding += tcPadPattern;
            } while(lcPadding.length < tnFinalLength);
            return loRE.exec(lcPadding + this);
        }
        
        /**
         * Trims all white space from the front of the string
         */
        String.prototype.lTrim = function()
        {
            return this.replace(/^\s+/, '');
        }
        /**
         * Trims all white space from the back of the string
         */
        String.prototype.rTrim = function()
        {
            return this.replace(/\s+$/, '');
        }
        /**
         * Trims all white space from both sides of the string
         */
        String.prototype.allTrim = function()
        {
            return this.replace(/^\s+|\s+$/g, '');
        }
        
        
        /***********************
         * End of string prototype manipulation
         ***********************/
        
        david.utilities = {
            /**
             * Checks if the object passed is the type specified
             */
            isType : function(toObject, tcType)
            {
                return Object.prototype.toString.call(toObject) === ("[object " + tcType + "]");
            },
            /** 
             * Takes a URL and "Cleans" it by adding to the url, the default is to add the version from cachebuster
             * This can be overridden in other modules
             */
            cleanURL : function(tcURL)
            {
                return tcURL + (tcURL.indexOf("?") < 0 ? "?" : "&") + "version=" + require.config.cachebuster;
            },
            /**
             * Initialises toModule by calling toInitFunction or "init" passing the
             * element and index as a parmeter.  toModule should already be loaded
             * for this call.
             */
            initialiseModule : function(toModule, toElement, tnIndex, toInitFunction)
            {
                toInitFunction = toInitFunction || "init";
                if (toModule[toInitFunction])
                {
                    toModule[toInitFunction].apply(toModule, [toElement, tnIndex]);
                };
            },
            
            /** Creates an element using the namespace if possible **/
            createFunction : function(tcName)
            {
                this.createFunction = 
                    document.createElementNS ? 
                        function(tcName){return document.createElementNS( 'http://www.w3.org/1999/xhtml', tcName);} :
                        function(tcName){return document.createElement(tcName);};
                
                return this.createFunction(tcName);
            },
            
            /*
             * Creates an element using the tag name
             * Cloning of an element is faster than creating, so we keep a copy
             * of every element that we have created in order to clone them if
             * multiples are needed
             */
            createElement : function(tcTagName)
            {
                tcTagName = tcTagName.toLowerCase();
                return (this.createElement[tcTagName] || (this.createElement[tcTagName] = this.createFunction(tcTagName))).cloneNode(false);
            },
            
            /**
             * Creates a callback function which will call toMethod on toTarget and return the result.
             */
            createCallback : function(toMethod, toTarget){return function(){toMethod.apply(toTarget, arguments);}}
        };
        
        
        
        
        
        /*************
         * The david.utilities object
         *************/
        return david.utilities;
    });