/************************
 * david.utilities
 * 
 * The utilities classes are a library of helper functions to standardise functionality
 * or make tasks easier.
 */

define(
    function(){
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
            }
        };
        
        
        
        
        
        
        
        /*************
         * The david.utilities object
         *************/
        return david.utilities;
    });