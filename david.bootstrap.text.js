/*====================================
Text plugin will load the required file as a text file.


====================================*/

require.config({debug : true});

define(function(){
    
    // REGEX FROM requirejs text plugin
    var m_oXmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im;
    var m_oBodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im;
    
    var m_aLoading = [];
    
    /**
     * Gets the actual MSXML object, this function executes once and
     * optimised itself based on the results.  jquery may or may not be loaded
     * at this point, so we will just make the assumption that it is not and
     * create our own request
     */
    var getXHTTPRequest = (function()
    {
        // Create the connector
        if (window.XMLHttpRequest)
        {
            getXHTTPRequest = function()
            {
                try
                {
                    return new XMLHttpRequest();
                }
                catch (ex)
                {
                    console.error(ex);
                }
            };
            return getXHTTPRequest;
        }
        else if (window.ActiveXObject)
        {
            // MS Browser
            var laMSXML = new Array('Msxml2.XMLHTTP.6.0','Msxml2.XMLHTTP.5.0',
                'Msxml2.XMLHTTP.4.0','Msxml2.XMLHTTP.3.0',
                'Msxml2.XMLHTTP','Microsoft.XMLHTTP');

            for (var i=0, lnLength = laMSXML.length; i<lnLength; i++)
            {
                try
                {
                    var loReturn = new ActiveXObject(laMSXML[i]);
                    if (loReturn != null)
                    {
                        getXHTTPRequest = function()
                        {
                            return new ActiveXObject(laMSXML[i]);
                        }
                        return loReturn;
                    }
                }
                catch (e)
                {
                    // No need to log anything here as we are just figuring out the right object to use
                }
            }
        }

        // It could not be created, so we need to inform the user.
        getXHTTPRequest = function()
        {
            console.error("Your browser doesn't seem to support XMLHttpRequests");
            return null;
        }
        return getXHTTPRequest;
    })();
    
    
    return {
        onLoaded : function (toModule)
        {
            // Do nothing here as it is handled in the completeLoad function
        },
        load : function (toModule)
        {
            var loSelf = this;
            toModule.forceJS(/\.js$/.exec(toModule.getName()));
            
            // Instead of loading through normal means, we will use an ajax request
            var loRequest = getXHTTPRequest();
            loRequest.open("GET", toModule.getURL(), true);
            loRequest.onreadystatechange = function (toEvent)
            {
                // Wait for the completed resoure
                if (loRequest.readyState === 4) 
                {
                    // The content has completed the load so we can clean up and notify
                    loSelf.completeLoad(toModule, loRequest.responseText);
                }
            };
            loRequest.send(null);
        },
        completeLoad : function(toModule, tcResult)
        {
            tcResult = tcResult || "";
            tcResult = tcResult.replace(m_oXmlRegExp, "");
            var loMatches = tcResult.match(m_oBodyRegExp);
            tcResult = loMatches ? loMatches[0] : tcResult;
            
            // Create a tag for the content
            var loTag = document.createElement("div");
            loTag.innerHTML = tcResult;
            toModule.setTag(loTag);
            toModule.setDefinition(loTag);
            toModule.complete();
        }
    };
}, true);