/*====================================
Bootstrapper for loading David Libraries

This module is standalone and does not required any other modules to be loaded
This module will load jQuery and backbone.js

Sample usage of adding Modules:
david.Bootstrap.addModule("david", 100, []);
david.Bootstrap.addModule("david.utilities", 100, ["david"]);

Adding a module from a subdirectory of the javascript includes
david.Bootstrap.addModule("subdir/customJS", 100, ["david"]);

Adding a call back to a specific module is as easy as:
david.Bootstrap.addModule("subdir/customJS", 100, ["david"]).addLoadedCallback(function(){initialiseDataStructures($bb,$jQ);});

This also sets up an "onPageInit" function.  If this function exists on a page,
it will be called as soon as the page is completely loaded.

jQuery can be referenced directly as either $jQ or jQuery, $ could cause conflicts with other libraries



Sample usage for loading Modules:
david.Bootstrap.loadModule("david.utilities");

Adding the customJS module from the above example
david.Bootstrap.loadModule("customJS");


Sample usage for setting up a callback when the modules are loaded:
david.Bootstrap.addLoadedCallback(function(){alert("The modules have been loaded")});

====================================*/

// TODO: Implement Styles so they are similar to modules, allowing dependency chains
// TODO: Implement caching flag to add time to URL if not set, forcing the browser not to cache
// TODO: Implement using the sessionID as part of the url if david.browser is available

var require, define, david, $jQ, $BB;
(function() {
    
    /** 
     * We include index of here so that the bootstrap can be used standalone
     * Return the integer value of the index of the object in the array
     * Returns -1 if the object is not found
     */ 
    Array.prototype.indexOf = Array.prototype.indexOf || function(toObject /*, from */)
    {
        var lnFrom = Number(arguments[1]) || 0;
        lnFrom = (lnFrom < 0) ? 0 : Math.floor(lnFrom);

        for (var lnLength = this.length; lnFrom<lnLength;lnFrom++)
        {
            if (this[lnFrom] === toObject)
            {
                return lnFrom;
            }
        }
        return -1;
    };
    
    /**
     * Pads the string on the left using the character provided, ensures the string is
     * no longer than tnFinal length after padding.  For the moment this only uses
     * the first character of the tcPadPattern
     */
    String.prototype.padLeft = function(tcPadPattern, tnFinalLength)
    {
        var lcString = this;
        while (lcString.length < tnFinalLength)
        {
            lcString = tcPadPattern[0] + lcString
        }
        return lcString;
    }

    // Ensure david is defined
    david = typeof(david) == 'undefined' ? function(){} : david;
    // Ensure console is defined, for browsers that do not support
    console = typeof(console) == 'undefined' ? {log : function(){}} : console;

    // Create david.utilities for some core utilities, these may be overwritten by david when it is loaded
    david.utilities = typeof(david.utilities) == 'undefined' ? function(){} : david.utilities;

    /**
     * Checks if the object is of the type specified.
     */
    david.utilities.isType = function(toObject, tcType) 
    {
        return Object.prototype.toString.call(toObject) === ("[object " + tcType + "]");
    }
    
    // Create the Bootstrap Object (Singleton)
    david.Bootstrap = (function(){

        //-------------------------------
        // Private member variables
        //-------------------------------

        // Contains the list of modules
        var m_oModules = {};

        // Number of modules that need to be loaded
        var m_nModuleCount = 0;

        // Number of modules that have been loaded
        var m_nLoadedModules = 0;

        // Stores the splash screen if it has been created
        var m_oSplash;

        // Stores the timeout for appending the splash screen
        var m_nSplashTimeout;

        // Stores the list of paths for module lookups
        var m_oPaths = {};
        
        // The context that we are loading in
        var m_aContext = [];
        
        //-------------------------------
        // Private member functions
        //-------------------------------

        /**
         * Checks if all of the modules have finished loading
         */
        var isModuleLoadComplete = function()
        {
            for (var lcModule in m_oModules)
            {
                if (!m_oModules[lcModule].isCompleted())
                {
                    return false;
                }
            }
            return true;
        };

        return {
            /**
             * Adds a path for the specified module.  After the path has been
             * set, loading this module will always happen from the path specified.
             * This will overwrite any old path
             */
            setPath : function(tcModuleName, tcPath)
            {
                m_oPaths[tcModuleName] = tcPath;
            },
            
            /**
             * Gets the full path for the module specified
             */ 
            getPath : function(tcModuleName)
            {
                return m_oPaths[tcModuleName] || (this.extractModuleInfo(tcModuleName).url);
            },
            
            // GET/SET the context
            pushContext : function(toModule){m_aContext[m_aContext.length] = toModule;},
            peekContext : function(){return m_aContext.length > 0 ? m_aContext[m_aContext.length-1] : null;},
            popContext : function(){var loReturn = this.peekContext(); m_aContext.length = m_aContext.length-1},

            /**
             * helper function to extract the name and path from the url
             */
            extractModuleInfo : function(tcModuleURL)
            {
                var llAnonymous = !david.utilities.isType(tcModuleURL, "String");
                tcModuleURL = (llAnonymous ? tcModuleURL.toString() : tcModuleURL).toLowerCase();
                var loInfo = {
                    name : (llAnonymous ? tcModuleURL : tcModuleURL.replace(/^.+!|.+\/|.js$/g, "")).replace(david.Bootstrap.getDefaultRoot(), ""),
                    path : llAnonymous ? "" : tcModuleURL.replace(/^.+!|[^/]+(.js)?$|^http[s]?:\/\/[^/]+/g, ""),
                    plugin : llAnonymous ? "" : tcModuleURL.replace(/!?[^!]+$/g, "")
                    };
                loInfo.path = (/^[./]/.test(loInfo.path)) ? loInfo.path : david.Bootstrap.getDefaultRoot() + loInfo.path;
                loInfo.url = loInfo.path + loInfo.name + ".js?version=" + david.Bootstrap.getCacheBuster();
                return loInfo;
            },
        
            /***
            * Adds the module to the list of available modules.
            * tcModuleName - The name of the javascript file
            * tnLength - the size of the module in bytes
            * taDepends - and array of dependent module names
            */
            addModule : function(toModule)
            {
                if (arguments.length == 3 && david.utilities.isType(toModule, "String"))
                {
                    // Support for old ("lib/ckeditor/adapters/jquery", 100, ["lib/ckeditor/ckeditor"]);
                    toModule = {
                      name: toModule,
                      dependencies: arguments[2]
                    };
                }
                
                toModule.info = this.extractModuleInfo(toModule.name);
                toModule.name = toModule.info.name;
                
                // If the module is not already in the list
                var loModule = this.getModule(toModule.name);
                if (loModule == null)
                {
                    console.log("Adding module " + toModule.name + " from path " + toModule.info.path);
                    loModule = new david.Bootstrap.Module({name : toModule.name,
                        path : toModule.info.path,
                        anonymous : toModule.anonymous,
                        definition : toModule.definition,
                        dependencies : toModule.dependencies});
                    david.Bootstrap.incrementLoadedModules();
                    m_oModules[loModule.getName()] = loModule;
                }
                else
                {
                    console.log("ADJUSTING Module " + toModule.name);
                    loModule.setDefinition(loModule.resolveDefinition(toModule.definition));
                    // Ensure all of the dependencies are pushed on to the module
                    for (var i=0, lnLength=toModule.dependencies.length; i<lnLength; i++)
                    {
                        loModule.addDependency(toModule.dependencies[i]);
                    }
                }
                return loModule;
            },
            /**
             * Gets the module specified
             * tcModuleName the name of the module or a module object
             */
            getModule : function(toModule)
            {
                var lcName = (typeof(toModule) === 'string') ? toModule : toModule.getName();
                return m_oModules[this.extractModuleInfo(lcName).name] || null;
            },
            /**
             * Loads the specified module
             * tcModuleURL - the FULL url to the module specified.
             * usage example:
             *      No URL specified
             *     david.Bootstrap.loadModule("david.utilities");
             *      URL specified
             *     david.Bootstrap.loadModule("customDir/customJS.js");
             */
            loadModule : function(tcModuleURL)
            {
                var loModule = this.getModule(this.extractModuleInfo(tcModuleURL).name);
                if (loModule != null)
                {
                    loModule.load();
                }
                else
                {
                    console.log('Attempted to load ' + tcModuleURL + "(" + lcURL + ")" + " which has not been set up as a module");
                    throw("Invalid module " + tcModuleURL);
                }
                return loModule;
            },
            /**
             * Function that occurs when a module has completed its load
             */
            onCompletedModule : function (toModule)
            {
                // If all the modules are complete, then hide the splash screen
                if (isModuleLoadComplete())
                {
                    this.hideSplash();
                }
            },
            /**
             * If this module has marked any scripts as blocked, this will
             * notify the blocked scripts to somplete
             */
            executeBlockedScripts : function(toModule)
            {
                var laBlocked = toModule.getBlockedScripts();
                for (var i=0, lnLength = laBlocked.length; i<lnLength; i++)
                {
                    console.log("UNLOCKING module " + laBlocked[i].getName());
                    if (!laBlocked[i].loadDependencies())
                    {
                        laBlocked[i].load();
                    }
                }
            },
            
            /**
             * increases the number of modules that are loaded
             */
            incrementLoadedModules :function()
            {
                m_nLoadedModules++;
            },
            incrementModuleCount : function()
            {
                m_nModuleCount++;
            },
            /**
             * Gets the total number of modules that are being loaded
             **/
            getModuleCount :function()
            {
                return m_nModuleCount;
            },
            /**
             * Gets the number of bytes that are loaded
             */
            getLoadedModules:function()
            {
                return m_nLoadedModules;
            },
            /**
             * Sets the status of the load, if david is loaded, this will use
             * david to create a status bar
             */
            setStatus : function(tcStatus)
            {
                console.log(tcStatus);
                if (david.setStatus)
                {
                    david.setStatus(tcStatus);
                }
            },
            /**
             * Gets the root of the modules if one is not provided
             */
            getDefaultRoot : function()
            {
                return require.config.baseUrl;
            },
            /**
             * Gets the version for adding to the JS urls
             */
            getCacheBuster : function()
            {
                return require.config.cachebuster;
            },
            /**
             * Creates the splash screen if needed, then displays it
             */
            showSplash : function()
            {
                if (!m_oSplash)
                {
                    m_oSplash = document.getElementById("grpSplash") || document.createElement("div");
                    m_oSplash.style.width = (self.innerWidth || (document.documentElement && document.documentElement.clientWidth) || document.body.clientWidth) + "px";
                    m_oSplash.style.height = (self.innerHeight || (document.documentElement && document.documentElement.clientHeight) || document.body.clientHeight) + "px";
                    m_oSplash.style.position = "absolute";
                    m_oSplash.style.top = "0px";
                    m_oSplash.style.left = "0px";
                    m_oSplash.style.background = "white url('/resources/images/ajax-loader.gif') no-repeat center";
                    m_oSplash.id="grpSplash";
                    this.appendSplashWhenReady();                   
                }
            },
            
            /**
             * this defers display of the splash screen until it is safe
             */
            appendSplashWhenReady : function()
            {
                if (m_oSplash.parentElement == null)
                {
                    try
                    {
                        // IE6 may throw an error if it is not in a state where it can append 
                        document.body.appendChild(m_oSplash);
                    }
                    catch (loEX)
                    {
                        m_nSplashTimeout = window.setTimeout(david.Bootstrap.appendSplashWhenReady, 10);
                    }
                }
            },
            /**
             * Hides the splash screen if it is displayed
             */
            hideSplash : function()
            {
                if (m_nSplashTimeout != 0)
                {
                    window.clearTimeout(m_nSplashTimeout);
                    m_nSplashTimeout = -1;
                }
                var loFunction = function(){
                        if (m_oSplash && m_oSplash.parentNode)
                        {
                            m_oSplash.parentNode.removeChild(m_oSplash);
                            m_oSplash = null;
                        }
                    };
                   
                if ($jQ != null)
                {
                    $jQ("#grpSplash").fadeOut("fast",loFunction);
                }
                else
                {
                    loFunction();
                }
            }
        };
    })();
    
    /**
     * The module class, encapsulates the concept of a module
     */
    david.Bootstrap.Module = (function()
    {
        //-------------------------------
        // Static variables
        //-------------------------------

        /**
         * Constructor function.  Creates a new instance of Module
         * Takes an object as a parameter, the object should have the following properties
         * dependencies, the string list of dependent modules
         * name, the name of the module
         */
        return function(toModule)
        {
            //-------------------------------
            // Private member variables
            //-------------------------------

            // Name of the module
            var m_cName = "";

            // List of dependencies (contains Module objects)
            var m_aDependencies = [];
            
            // List of dependencies that must be loaded before this resource can load
            var m_aSyncLock = [];
            
            // The list of scripts that this module is blocking
            var m_oBlockedScripts = [];

            // Reference to the script tag for this module
            var m_oTag = null;

            // contains the results of the executed module
            var m_oDefinition = null;
            
            // stores the flag indicating a module has completed
            var m_lIsCompleted = false;

            // stores the list of callbacks to run when this module is loaded
            var m_aLoadedCallbacks = [];
            
            //-------------------------------
            // Privileged functions
            //-------------------------------

            // GETS/SETS the name of the module
            this.getName = function(){return m_cName;};
            this.setName = function(tcName){m_cName = tcName.toLowerCase();};

            // GETS the URL for this module
            this.getURL = function(){return david.Bootstrap.getPath(this.getName());};
            
            // Adds the module to the list of modules that are being blocked by this script
            this.addBlockedScript = function(toModule)
            {
                if (m_oBlockedScripts.indexOf(toModule) < 0)
                {
                    m_oBlockedScripts[m_oBlockedScripts.length] = toModule;
                }
            },
                
            this.getBlockedScripts = function(){return m_oBlockedScripts;};

            // GETS the list of dependencies if there are any
            this.getDependencies = function(){return m_aDependencies;};
            
            // GETS the list of sync locks if there are any
            this.getSyncLock = function(){return m_aSyncLock;};
            
            /**
             * Checks if this module has been marked as loaded, loaded means
             * any scripts have been attached, or a definition has been added
             */
            this.isLoaded = function(){return this.getTag() || m_oDefinition != null};

            // GET/SET the script tag that is associated with this module
            this.setTag = function(toTag){m_oTag = toTag;m_lIsLoaded = true;};
            this.getTag = function(){return m_oTag;};

            /** 
             * Check if this module has completed its load, completed means both
             * loaded and all callbacks have been called
             */
            this.isCompleted = function(){return m_lIsCompleted};
            this.setCompleted = function(){m_lIsCompleted = true;};
            
            // Gets/Sets the definition of this module
            this.getDefinition = function(){return m_oDefinition};
            this.setDefinition = function(toDefinition){m_oDefinition = toDefinition};

            /***
             * Adds the specified module as a dependent of this module
             * tcName - the name of the javascript file to add as a module.
             */
            this.addDependency = function(tcName)
            {
                if (tcName)
                {
                    var loInfo = david.Bootstrap.extractModuleInfo(tcName);
                    tcName = loInfo.name;
                    // Make sure this module did not already have it as a dependency
                    // No need to report an error if dependency already exists
                    if (!this.hasDependency(tcName))
                    {
                        // TODO: Manage plugins as plugins.
                        var lcPlugin = loInfo.plugin;
                        if (lcPlugin === "order")
                        {
                            console.log("synch locking dependency " + tcName + " to " + this.getName());
                            this.addSyncLock(tcName);
                        }
                        console.log("Adding dependency " + tcName + " to " + this.getName());
                        m_aDependencies[m_aDependencies.length] = tcName;
                    }
                }
            },
            /**
             * Adds a synchronous lock to this module.  Synchronous locks will
             * be loaded in the order they are added.
             */
            this.addSyncLock = function(tcName)
            {
                if (tcName)
                {
                    m_aSyncLock[m_aSyncLock.length] = david.Bootstrap.extractModuleInfo(tcName).name;
                }
            }

            /**
             * Adds a callback to this module.  When this module and all of its
             * dependencies are loaded, this callback will be executed
             */
            this.addLoadedCallback = function(toCallback)
            {
                if (!toCallback) {return;}

                // If the callback is added and we are already ready, then just execute
                if (this.isCompleted())
                {
                    toCallback();
                }
                else
                {
                    if (m_aLoadedCallbacks.indexOf(toCallback) < 0)
                    {
                        m_aLoadedCallbacks.push(toCallback);
                    }
                }
            }
            
            /**
             * This executes the callbacks when this module is completely loaded
             */
            this.executeLoadedCallbacks = function()
            {
                for (var i=0, lnLength = m_aLoadedCallbacks.length; i<lnLength; i++)
                {
                    var laArgs = this.getCallbackArguments();
                    console.log("Executing callback " + laArgs);
                    try
                    {
                        m_aLoadedCallbacks[i].apply(this, laArgs);
                    }
                    catch(ex)
                    {
                        console.log("Callback failed - \n" + m_aLoadedCallbacks[i] + "\n\n\n" + ex);
                    }
                }
                m_aLoadedCallbacks.length = 0;
            }
            
            
            // Gets an array of dependency objects which can be passed to a callback
            this.getCallbackArguments = function()
            {
                
                var laDependencies = this.getDependencies();
                var loArgs = [this.getDefinition()];
                for (var i=0, lnLength = laDependencies.length; i<lnLength; i++)
                {
                    if (laDependencies[i] === "require")
                    {
                        console.log("REQUIRE!");
                        loArgs[i+1] = {};
                    }
                    else if (laDependencies[i] === "exports")
                    {
                        console.log("exports!");
                        loArgs[i+1] = {};
                    }
                    else if (laDependencies[i] === "module")
                    {
                        console.log("module!");
                        loArgs[i+1] = {
                            id:this.getName(),
                            uri:this.getURL(),
                            exports:{}
                        };
                    }
                    else
                    {
                        loArgs[i+1] = david.Bootstrap.getModule(laDependencies[i]).getDefinition();
                    }
                    console.log("pushed " + laDependencies[i] + " to argument " + (i+1));
                }
                return loArgs;
            }

            //-------------------------------
            // Initialisation function
            //-------------------------------
            this.setName(toModule.name);
            this.setDefinition(toModule.definition);
            
            for (var i=0, lnLength = (toModule.dependencies || []).length; i<lnLength; i++)
            {
                this.addDependency(toModule.dependencies[i]);
            }
            david.Bootstrap.incrementModuleCount();
        };
    })();

    //-------------------------------
    // NON - Privileged functions
    //-------------------------------

    david.Bootstrap.Module.prototype =
    {
        /***
         * Checks if this module is dependent on the module passed in
         * toModule - the name or module
         * returns true if this module is dependent on the module specified
         */
        hasDependency : function(toModule)
        {
            toModule = david.Bootstrap.getModule(toModule);
            var lcName = toModule != null ? toModule.getName() : null;
            var laDepends = this.getDependencies();
            for (var i=0, lnLength = laDepends.length; i<lnLength; i++)
            {
                if (laDepends[i] === lcName)
                {
                    return true;
                }
            }
            return false;
        },
        /**
         * This will load all of the dependencies for this module, this will
         * return true if there is a lock in place after this call
         */
        loadDependencies : function()
        {
            var i, lnLength, llLocked = false;
            var laDepends = this.getDependencies();
            var laSync = this.getSyncLock();
            // load all of the dependencies
            for (i=0, lnLength = laDepends.length; i<lnLength; i++)
            {
                var loModule = david.Bootstrap.getModule(laDepends[i]) || david.Bootstrap.addModule({name:laDepends[i]});
                if (loModule.getDefinition())
                {
                    // This module is already finished
                    continue;
                }
                if (laSync.indexOf(laDepends[i]) >= 0)
                {
                    if (!llLocked)
                    {
                        // Synchronous module, if it is not loaded, load it now
                        llLocked = !loModule.isLoaded() || !loModule.isCompleted();
                        if (llLocked)
                        {
                            loModule.addBlockedScript(this);
                            console.log("LOADING SYNCHRONOUS " + loModule.getName() + " blocking " + this.getName());
                            loModule.load();
                        }
                    }
                }
                else
                {
                    console.log("LOADING ASYNCHRONOUS " + loModule.getName());
                    // Asynchronous module
                    loModule.load();
                }
            }
            return llLocked;
        },
        /**
         * Resolved the definition supplied into a value
         */
        resolveDefinition : function(toDefinition)
        {   
            if (david.utilities.isType(toDefinition, "Function"))
            {
                // Update the status
                david.Bootstrap.setStatus("(" + this.getName() + ")" + david.Bootstrap.getLoadedModules() + " /" + david.Bootstrap.getModuleCount() + " modules");
                var loArgs = this.getCallbackArguments();
                console.log("RESOLVING Definition for " + this.getName());                
                return toDefinition.apply(this.getDefinition(), loArgs.length > 1 ? loArgs.splice(1) : [this.getDefinition()]);
            }
            return toDefinition;
        },
        /**
         * Loads the module, loading takes place by adding a script tag to the head of the html 
         * if one does not already exist
         */
        load : function()
        {
            if (this.isLoaded() && !this.isCompleted())
            {
                // The module has been loaded, make sure the callbacks have been called
                var laDepends = this.getDependencies();
                for (var i=0, lnLength = laDepends.length; i<lnLength; i++)
                {
                    var loModule = david.Bootstrap.getModule(laDepends[i]) || david.Bootstrap.addModule({name:laDepends[i]});
                    if (!loModule.isCompleted()|| !loModule.getDefinition())
                    {
                        console.log("LOAD : Dependency " + loModule.getName() + " blocking " + this.getName());
                        loModule.addBlockedScript(this);
                        loModule.load();
                        return;
                    }
                }
                
                // If this module is blocked then the code would have exited already
                if (this.getTag())
                {
                    if (this.getTag().getAttribute("readyState") == 4)
                    {
                        this.setCompleted();
                        // Ensure any blocked modules are laoded
                        this.load();
                    }
                    else
                    {
                        console.log("LOAD : waiting for script to load for " + this.getName());
                    }
                }
                else
                {
                    console.log("NO TAGS!!!!!!!!!!!!");
                }
            }
            else if (!this.isLoaded())
            {
                // If there are no sync locks, load this module
                if (this.getSyncLock().length == 0 || !this.loadDependencies())
                {
                    console.log("LOAD : Add tag for " + this.getName());
                    this.addScriptTag(this.getURL());
                }
            }
            else
            {
                // If we are not resolved AND if no tag was created for this module
                if (!this.resolved && !this.getTag())
                {
                    this.resolved = true;
                    this.setDefinition(this.resolveDefinition(this.getDefinition()));
                }
                
                if(this.resolved)
                {
                    if (!this.finalised)
                    {
                        this.finalised = true;
                        console.log("COMPLETING Module " + this.getName());
                        david.Bootstrap.onCompletedModule(this);
                        this.executeLoadedCallbacks();
                        console.log("COMPLETED CALLBACKS " + this.getName());

                        console.log("LOAD : resolving blocked scripts");
                        david.Bootstrap.executeBlockedScripts(this);
                    }
                }
                else
                {
                    this.resolved = true;
                    this.setDefinition(this.resolveDefinition(this.getDefinition()));
                    this.load();
                }
            }
        },
        /***
         * Adds the script tag to the page
         * tcURL - The url for the tag source
         */
        addScriptTag : function(tcURL)
        {
            if (!this.isLoaded())
            {
                console.log("ADDING SCRIPT for " + this.getName());
                // Check if a script already exists on the page with this module
                var laScripts = document.getElementsByTagName("script");
                for (var i=0, lnLength = laScripts.length; i<lnLength; i++)
                {
                    // TODO: Need more testing on this, particularly with the urls with parameters
                    if (laScripts[length].src === tcURL)
                    {
                        console.log("Reusing script - " + tcURL);
                        this.setTag(laScripts[i]);
                        return;
                    }
                }
                
                // Make sure we are ready
                var loTag = document.createElement("script");
                loTag.src = tcURL;
                loTag.type = "text/javascript";
                loTag.charset = "utf-8";
                loTag.async = true;
                loTag.module = this;
                this.setTag(loTag);
                this.addEventListener(loTag, this.onScriptLoaded, typeof(loTag.readyState) != 'undefined' ? "readystatechange" : "load"); 
                document.getElementsByTagName("head")[0].appendChild(loTag);
            }
        },
        /**
         * Event handler for loading of the script tag
         */
        onScriptLoaded : function(toEvent)
        {
            var loTag = toEvent.currentTarget || toEvent.srcElement;
            if (toEvent.type === "load" || loTag && /^(complete|loaded)$/.test(loTag.readyState));
            {
                console.log("SCRIPT Loaded " + loTag.module.getName());
                loTag.setAttribute("readyState", 4);
                var loArgs = david.Bootstrap.outstanding;
                david.Bootstrap.outstanding = undefined;
                var loModule = loTag.module;
                loTag.module = null;
                if (loArgs && !(loModule.getDefinition()))
                {
                    console.log("pushing anonymous definition to " + loModule.getName())
                    loModule.setDefinition(loArgs.definition);
                    for (var i=0, lnLength = (loArgs.dependencies||[]).length; i<lnLength; i++)
                    {
                        loModule.addDependency(loArgs.dependencies[i]);
                    }
                    loModule.loadDependencies();
                }
                
                // Detach events
                if (loTag.detachEvent)
                {
                    loTag.detachEvent("onreadystatechange", loModule.onScriptLoaded);
                }
                else
                {
                    loTag.removeEventListener("load", loModule.onScriptLoaded, false);
                }
                loModule.load();
            }
        },
        /**
         * Adds an event listener to the element specified
         */
        addEventListener : function(toElement, toCallback, tcEventType)
        {
            if (toElement.addEventListener)
            {
                toElement.addEventListener(tcEventType, function(e){
                    toCallback(e)
                    }, false);
            }
            else if (toElement.attachEvent)
            {
                toElement.attachEvent("on" + tcEventType, function(e){
                    toCallback(window.event)
                    });
            }
        }
    };




    // TODO: implement loading of styles correctly
    // TOOD: implement loading of templates correctly
    // TODO: implement css dependencies
    // TODO: implement less dependencies
    // TODO: implement html dependencies
    david.Bootstrap.loadStyle=function(tcURL)
    {
        var llFound = false;
        var loTag = null;

        var lcScript = tcURL.substr(tcURL.lastIndexOf("/") + 1, tcURL.indexOf(".css") - tcURL.lastIndexOf("/")-1).toLowerCase();
        loTag = david.createElement("link");
        loTag.rel = "stylesheet";
        loTag.type = "text/css";
        loTag.href = tcURL;

        var laStyles = document.getElementsByTagName("link");
        for (var i=0, lnLength = laStyles.length; i<lnLength; i++)
        {
            if (laStyles[i].getAttribute("href").toLowerCase().indexOf("/" + lcScript.toLowerCase() + ".css") >= 0)
            {
                loTag = laStyles[i];
                llFound = true;
                break;
            }
        }

        if (!llFound)
        {
            document.getElementsByTagName("head")[0].appendChild(loTag);
        }
    }

    // Store the object in require if needed, it may be a config argument
    var m_oOldRequire = require;
    // Clobber existing require
    require = function(taModules, toCallback)
    {
        // Ensure that the module is always in an array
        taModules = david.utilities.isType(taModules, "Array") ? taModules : [taModules];
        // Ensure that each module required is loaded, the last (first in the list) module will execute the callback
        var loRootModule = david.Bootstrap.getModule(taModules[0]);
        if (loRootModule == null)
        {
            console.log("REQUIRE - Preaparing " + taModules[0]);
            loRootModule = david.Bootstrap.addModule({
                        name:taModules[0],  
                        definition : null,
                        dependencies: []
                    });
            david.Bootstrap.pushContext(loModule);
        }
        
        if (taModules.length > 1)
        {
            var loBlockingModule = loRootModule;
            // We don't need to load the first module it is the root
            for (var i=taModules.length-1, lnLength = 1; i>=lnLength; i--)
            {
                console.log("REQUIRE - Preaparing dependency " + taModules[0] + "/" + taModules[i]);
                var loInfo = david.Bootstrap.extractModuleInfo(taModules[i]);
                var loModule = david.Bootstrap.getModule(taModules[i]);
                if (loModule == null)
                {
                    loModule = david.Bootstrap.addModule({
                            name:taModules[i],  
                            definition : null,
                            dependencies: []
                        });
                }
                if (loInfo.plugin === "order")
                {
                    loBlockingModule.addDependency(taModules[i]);
                    loBlockingModule = loModule;
                }
            }
        }
        loRootModule.addLoadedCallback(toCallback);
        loRootModule.load();
        
        return loRootModule == null ? null : loRootModule.getDefinition();
    }
    
    if (typeof(m_oOldRequire) != "undefined")
    {
        require.config(m_oOldRequire);
        m_oOldRequire = null;
    }
    
    /**
     * Configures the require functionallity
     */
    require.config = function(toConfig){
        david.Bootstrap.showSplash();
        // TODO: Support more than just paths
        for (var lcProperty in toConfig)
        {
            if (lcProperty == "paths")
            {
                for (var lcPath in toConfig.paths)
                {
                    david.Bootstrap.setPath(lcPath, toConfig.paths[lcPath]);
                }
            }
            else
            {
                require.config[lcProperty] = toConfig[lcProperty];
            }
        }
    };
    
    
    // Set up some default david paths and configuration
    require.config({
        baseUrl: "/resources/inc/javascript/",
        paths: {
            "underscore" : "/resources/inc/javascript/lib/underscore.js",
            "backbone" : "/resources/inc/javascript/lib/backbone-min.js",
            "jquery" : "/resources/inc/javascript/lib/jquery-1.7.min.js"
        },
        cachebuster : 1.0
    });

    // Clobber existing define
    define = function(tcModuleName, taDependencies, toCallback)
    {
        var llAnonymous = !david.utilities.isType(tcModuleName, "String");
        // Sort out all of the arguments
        if (llAnonymous)
        {
            // Shift all of the arguments
            toCallback = taDependencies;
            taDependencies = tcModuleName;
            tcModuleName = null;
        }
        if (!david.utilities.isType(taDependencies, "Array"))
        {
            toCallback = taDependencies;
            taDependencies = [];
        }
        
        if (llAnonymous)
        {
            if (david.Bootstrap.outstanding)
            {
                throw ("multiple anonymous definitions");
            }
            console.log("DEFINE - storing anonymous module");
            // TODO: Process the exports
            // Store the anonymous module
            david.Bootstrap.outstanding = 
                {
                    name : tcModuleName,
                    dependencies : taDependencies,
                    definition : toCallback
                };
        }
        else
        {
            console.log("DEFINE - " + tcModuleName);
            if (!taDependencies.length && toCallback.length)
            {
                // TODO: Implement this
                //taDependencies = ["require", "exports", "module"];
            }
            david.Bootstrap.addModule({name:tcModuleName, dependencies: taDependencies, definition: toCallback}).load();
        }
    };
    define.amd = {};
    
    /**
     * Set up all of the requirements for the david framework
     */
    require(["order!jquery", "order!underscore"], function(nothing, $underscore)
    {
        $jQ = jQuery.noConflict();
        window._= $underscore;
        
        define("jquery", function(){
            return $jQ;
        });
        
        require(["order!backbone"], function($bb)
        {
            $BB = Backbone.noConflict();
            
            define("backbone", function(){
                return $BB;
            });
            
            require(["david"]);
        });
    });
})(this);