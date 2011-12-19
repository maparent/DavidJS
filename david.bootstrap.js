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

// TODO: Implement caching flag to add time to URL if not set, forcing the browser not to cache
// TODO: Implement using the sessionID as part of the url if david.browser is available

// Create global variables
var require, define;
(function() {
    var __CACHEBUSTER__ = 1.0 // Modify this to change the version number
    var __DEBUG__ = false;  // Set to false to turn off console messages
    
    var g_oBase = this; // Reference to the container (window or server usually)
    
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

    // Ensure david is defined
    g_oBase.david = typeof(g_oBase.david) == 'undefined' ? function(){} : window.david;
    
    // Create david.utilities for some required utilities, these will be overwritten by the real david.utilities when it is loaded
    g_oBase.david.utilities = typeof(g_oBase.utilities) == 'undefined' ? 
            {
                // Checks if the object is of the type specified.
                isType : function(toObject, tcType) {return Object.prototype.toString.call(toObject) === ("[object " + tcType + "]");}
            } : 
            david.utilities;
    
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
        
        // Stores if the bootstrap is ready for use
        var m_lLocked = true;
        
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
             * Loads the specified module, the module can be a string or an array of dependencies
             * taModules - the FULL url to the module specified.
             * usage example:
             *      No URL specified
             *     david.Bootstrap.loadModule("david.utilities");
             *      URL specified
             *     david.Bootstrap.loadModule("customDir/customJS");
             *      Dependiencies
             *     david.Bootstrap.loadModule(["david.utilities", "customDir/customJS"]);
             * Returns the a reference to the module
             */
            loadModule : function(taModules, toCallback)
            {
                var llModule = david.utilities.isType(taModules, "Array");
                
                // Ensure that the module is always in an array
                taModules = llModule ? taModules : [taModules];
                var lcModuleName = llModule ? "[" + taModules.toString() + "]" : taModules[0];
                
                // Get the module, if it does not already exist, add it here
                var loModule = this.getModule(lcModuleName);
                loModule = loModule == null ? david.Bootstrap.addModule({
                                name : llModule ? lcModuleName : taModules[0],
                                dependencies : llModule ? taModules : [], 
                                anonymous: llModule}) :
                                loModule;
                            
                // Add the callback to the module, if the module is completed loading, this will be executed here
                loModule.addLoadedCallback(toCallback);
                loModule.load();
                return loModule;
            },

            /***
            * Adds the module to the list of available modules.
            * toModule, an object with a name and dependencies
            */
            addModule : function(toModule)
            {
                // TODO: Remove this support when no longer used
                // Support for old ("lib/ckeditor/adapters/jquery", 100, ["lib/ckeditor/ckeditor"]);
                if (arguments.length == 3 && david.utilities.isType(toModule, "String"))
                {
                    toModule = {name: toModule,dependencies: arguments[2]};
                }

                // If the module is not already in the list
                var loModule = this.getModule(toModule.name);
                if (loModule == null)
                {
                    // Create the module and add it to the list of available modules
                    loModule = new david.Bootstrap.Module({
                            name : toModule.name,
                            dependencies : toModule.dependencies,
                            anonymous : toModule.anonymous,
                            definition: toModule.definition
                        });
                    m_oModules[loModule.getName()] = loModule;
                }
                else
                {
                    console.log("ADJUSTING Module [" + toModule.name + "]");
                    loModule.setDefinition(loModule.resolveDefinition(toModule.definition));
                    // Ensure all of the dependencies are pushed on to the module
                    for (var i=0, lnLength=toModule.dependencies.length; i<lnLength; i++)
                    {
                        loModule.addDependency(toModule.dependencies[i]);
                    }
                    
                    // If this module is loaded then we need to force the dependencies
                    if (loModule.isCompleted())
                    {
                        loModule.loadDependencies();
                    }
                }
                return loModule;
            },
            /**
             * Gets the module specified, this should be the full context to the module
             * tcModuleName the name of the module or a module object
             */
            getModule : function(toModule)
            {
                return m_oModules[david.utilities.isType(toModule, 'String') ? david.Bootstrap.extractModuleInfo(toModule).name : toModule.getName()] || null;
            },
            
            /**
             * helper function to extract the name and path from the url
             */
            extractModuleInfo : function(tcModuleURL)
            {
                var llAnonymous = !david.utilities.isType(tcModuleURL, "String");
                tcModuleURL = (llAnonymous ? tcModuleURL.toString() : tcModuleURL).toLowerCase();
                var loInfo = {
                    name : ((llAnonymous ? tcModuleURL : tcModuleURL.replace(/^.+!|.js$/g, "")).replace(david.Bootstrap.getDefaultRoot(), "")).toLowerCase(),
                    path : llAnonymous ? "" : tcModuleURL.replace(/^.+!|[^/]+(.js)?$|^http[s]?:\/\/[^/]+/g, ""),
                    plugin : llAnonymous ? "" : tcModuleURL.replace(/!?[^!]+$/g, "")
                    };
                loInfo.path = (/^[./]/.test(loInfo.path)) ? loInfo.path : david.Bootstrap.getDefaultRoot() + loInfo.path;
                return loInfo;
            },
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
            getPath : function(tcModuleName, tcModulePath)
            {
                return m_oPaths[tcModuleName] || tcModulePath + tcModuleName.replace(/^.+\//g, "") +".js?version=" + require.config.cachebuster;
            },
            /**
             * increases the number of modules that are loaded
             */
            incrementLoadedModules :function()
            {
                m_nLoadedModules++;
                this.setStatus("Loaded " + m_nLoadedModules + " / " + m_nModuleCount + " modules");
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
             * unlocks the bootstrap for external use
             */
            unlock : function()
            {
                m_lLocked = false;
            },
            /**
             * Checks if the bootstrap is locked
             */
            isLocked : function()
            {
                return m_lLocked;
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
             * Gets the root of the modules if one is not provided
             */
            getDefaultRoot : function()
            {
                return require.config.baseUrl;
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
            
            // The path for the module
            var m_cPath = "";

            // List of dependency keys
            var m_aDependencies = [];
            
            // List of dependencies that must be loaded before this resource can load
            var m_oSyncLock = {};
            
            // Reference to the script tag for this module
            var m_oTag = null;

            // contains the results of the executed module
            var m_oDefinition = null;
            
            // stores the flag indicating a module has completed
            var m_lIsCompleted = false;

            // stores the list of callbacks to run when this module is loaded
            var m_aLoadedCallbacks = [];
            
            // Stores if this was an anonymous module
            var m_lAnonymous = false;
            
            // Store the parent modules, or the modules requiring this module
            var m_aParents = [];
            
            //-------------------------------
            // Privileged functions
            //-------------------------------
            
            // GETS/SETS the name of the module
            this.getName = function(){return m_cName;};
            this.setName = function(tcName){m_cName = tcName.toLowerCase();};
            
            /** 
             * Check if this module has completed its load, completed means both
             * loaded and all callbacks have been called
             */
            this.isCompleted = function(){return m_lIsCompleted && m_aLoadedCallbacks.length == 0};
            this.setCompleted = function(){m_lIsCompleted = true;};
            
            /**
             * Get the list of modules that require this module
             */
            this.getParents = function(){return m_aParents};
            
            /**
             * Checks if this module is an anonymous module or not
             */
            this.isAnonymous = function(){return m_lAnonymous;};
            this.setAnonymous = function(tlAnonymous){m_lAnonymous = tlAnonymous;};
            
            // GETS/SETS the path of this module
            this.getPath = function(){return m_cPath};
            this.setPath = function(tcPath){m_cPath = tcPath;};
            
            // GETS the URL for this module
            this.getURL = function(){return david.Bootstrap.getPath(this.getName(), this.getPath());};
            
            // GET/SET the script tag that is associated with this module
            this.setTag = function(toTag){m_oTag = toTag;};
            this.getTag = function(){return m_oTag;};
            
            // Gets/Sets the definition of this module
            this.getDefinition = function(){return m_oDefinition};
            this.setDefinition = function(toDefinition){console.log("Setting definition of [" + this.getName() + "] to " + toDefinition); 
                m_oDefinition = toDefinition};
            
            /**
             * Checks if this module has been marked as loaded, loaded means
             * any scripts have been attached, or a definition has been added
             */
            this.isLoading = function(){return this.getTag() || m_oDefinition != null};
            
            /***
             * Adds the specified module as a dependent of this module
             * tcName - the name of the javascript file to add as a module.
             */
            this.addDependency = function(tcName)
            {
                var loInfo = david.Bootstrap.extractModuleInfo(tcName);
                // Make sure this module did not already have it as a dependency
                // No need to report an error if dependency already exists
                var lnIndex = this.getDependency(loInfo.name);
                if (lnIndex < 0)
                {
                    console.log("Adding dependency [" + loInfo.name + "] to [" + this.getName() +"]");
                    m_aDependencies.push(loInfo.name);
                    
                    // TODO: Manage plugins as plugins.
                    var lcPlugin = loInfo.plugin;
                    if (lcPlugin === "order")
                    {
                        console.log("synch locking dependency [" + loInfo.name + "] to [" + this.getName() + "]");
                        this.addSyncLock(loInfo.name);
                    }
                    else if (lcPlugin != "")
                    {
                        console.error("Plugin " + lcPlugin + " is not yet handled");
                    }
                    
                    var loModule = david.Bootstrap.getModule(tcName) || david.Bootstrap.addModule({
                        name : tcName,
                        dependencies : []
                    });
                    loModule.addParent(this);
                }
            };
            
            // GETS the list of dependencies if there are any
            this.getDependencies = function(){return m_aDependencies;};
            
            // Gets the index of the specified dependency
            this.getDependency = function(tcModule){return m_aDependencies.indexOf(tcModule);};
            
            /**
             * Adds a synchronous lock to this module.  Synchronous locks will
             * be loaded in the order they are added.
             */
            this.addSyncLock = function(tcName)
            {
                m_oSyncLock[tcName] = {};
            }
            
            /**
             * Removes the synch lock
             */
            this.removeSyncLock = function(tcName)
            {
                delete m_oSyncLock[tcName];
            }
            
            // GETS the list of sync locks if there are any
            this.getSyncLock = function(){return m_oSyncLock;};
            // Checks if tcModule is synchlocked to this module
            this.isSynchLocked = function(tcModule){return !(typeof(m_oSyncLock[tcModule]) === "undefined")};
            
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
                        m_aLoadedCallbacks[m_aLoadedCallbacks.length] = toCallback;
                    }
                }
            }
            
            /**
             * Checks if there are oustanding callbacks
             */
            this.hasCallbackFunctions = function(){return m_aLoadedCallbacks && m_aLoadedCallbacks.length > 0;};
            
            /**
             * This executes the callbacks when this module is completely loaded
             */
            this.executeLoadedCallbacks = function()
            {
                for (var i=0, lnLength = m_aLoadedCallbacks.length; i<lnLength; i++)
                {
                    var laArgs = this.getCallbackArguments();
                    laArgs = this.isAnonymous() && !this.getDefinition() ? laArgs.splice(1) : laArgs;
                    console.log("Executing module [" + this.getName() + "] callback " + (i + 1) + "/" + lnLength + "\n\targs: [" + laArgs + "]");
                    try
                    {
                        var loResult = m_aLoadedCallbacks[i].apply(this, laArgs);
                        if (loResult && !this.getDefinition())
                        {
                            this.setDefinition(loResult);
                        }
                    }
                    catch(ex)
                    {
                        console.error("Callback failed - \n" + m_aLoadedCallbacks[i] + "\n\n\n" + ex);
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
            var loInfo = david.Bootstrap.extractModuleInfo(toModule.name);
            this.setName(toModule.anonymous ? toModule.name : loInfo.name);
            this.setPath(loInfo.path);
            this.setDefinition(toModule.definition ? toModule.definition : null);
            this.setAnonymous(toModule.anonymous ? true : m_lAnonymous);
            
            david.Bootstrap.incrementModuleCount();
            
            for (var i=0, lnLength = (toModule.dependencies || []).length; i<lnLength; i++)
            {
                this.addDependency(toModule.dependencies[i]);
            }
        };
    })();

    //-------------------------------
    // NON - Privileged functions
    //-------------------------------

    david.Bootstrap.Module.prototype =
    {
        /**
         * Adds a parent module, a parent module is a module which requires
         * this module
         */
        addParent : function(toParent)
        {
            var laParents = this.getParents();
            if (laParents.indexOf(toParent) <0)
            {
                laParents.push(toParent);
            }
        },
        /**
         * This will load all of the dependencies for this module, this will
         * return true if there is still a lock in place after this call
         */
        loadDependencies : function()
        {
            console.log("Loading dependencies for [" + this.getName() + "]");
            var laDependencies = this.getDependencies();
            var llLoadingLocked = false;
            
            // Attempt to load each dependency that is not synch locked
            for (var i=0, lnLength = laDependencies.length; i<lnLength; i++)
            {
                var lcDependency = laDependencies[i];
                // Get the module
                var loModule = david.Bootstrap.getModule(lcDependency) || (this.isSynchLocked(lcDependency) ? null : david.Bootstrap.loadModule(lcDependency));
                // Any module could be synch locked
                if (this.isSynchLocked(lcDependency))
                {
                    if (!llLoadingLocked)
                    {
                        llLoadingLocked = true;
                        loModule = loModule || david.Bootstrap.loadModule(lcDependency);
                        if (loModule.isCompleted())
                        {
                            console.log("LOAD : Unlocking dependency [" + lcDependency + "] from [" + this.getName() + "]");
                            this.removeSyncLock(lcDependency);
                            llLoadingLocked = false;
                        }
                        else
                        {
                            console.log("LOAD : Dependency [" + lcDependency + "] blocking [" + this.getName() + "]");
                            if (!loModule.isLoading())
                            {
                                loModule.load();
                            }
                        }
                    }
                }
                else
                {
                    if (!loModule.isLoading())
                    {
                        loModule.load();
                    }
                }
            }
            return llLoadingLocked;
        },
        
        /***
         * Adds the script tag to the page
         * tcURL - The url for the tag source
         */
        addScriptTag : function()
        {
            if (!this.isAnonymous() && !this.getTag())
            {
                var lcURL = this.getURL();
                console.log("ADDING SCRIPT for [" + this.getName() + "] ("+ lcURL + ")");
                // Check if a script already exists on the page with this module
                var laScripts = document.getElementsByTagName("script");
                for (var i=0, lnLength = laScripts.length; i<lnLength; i++)
                {
                    // TODO: Need more testing on this, particularly with the urls with parameters
                    if (laScripts[i].src === lcURL)
                    {
                        console.log("Reusing script - " + lcURL);
                        this.setTag(laScripts[i]);
                        return;
                    }
                }
                
                // Make sure we are ready
                var loTag = document.createElement("script");
                loTag.src = lcURL;
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
        },
        
        /**
         * Event handler for loading of the script tag
         */
        onScriptLoaded : function(toEvent)
        {
            var loTag = toEvent.currentTarget || toEvent.srcElement;
            if (toEvent.type === "load" || loTag && /^(complete|loaded)$/.test(loTag.readyState));
            {
                console.log("SCRIPT loaded for module [" + loTag.module.getName() + "]");
                loTag.setAttribute("readyState", 4);
                var loModule = loTag.module;
                var loOutstanding = david.Bootstrap.outstanding;
                david.Bootstrap.outstanding = undefined;
                
                if (loOutstanding)
                {
                    if (loOutstanding.dependencies)
                    {
                        for (var i=0, lnLength = loOutstanding.dependencies.length; i<lnLength; i++)
                        {
                            loModule.addDependency(loOutstanding.dependencies[i]);
                        }
                    }
                    loModule.setAnonymous(true);
                    if (!loModule.hasCallbackFunctions())
                    {
                        loModule.addLoadedCallback(loOutstanding.definition);
                    }
                    else
                    {
                        loModule.setDefinition(loModule.resolveDefinition(loOutstanding.definition));
                    }
                    loModule.loadDependencies();
                }
                loTag.module = null;
                
                // Detach events
                if (loTag.detachEvent)
                {
                    loTag.detachEvent("onreadystatechange", loModule.onScriptLoaded);
                }
                else
                {
                    loTag.removeEventListener("load", loModule.onScriptLoaded, false);
                }
                loModule.complete();
            }
        },
        /**
         * Attempts to complete the loading of this module
         */
        complete : function()
        {
            // This can only be set as complete if all the dependencies are loaded
            var laDependencies = this.getDependencies();
            for (var i=0, lnLength = laDependencies.length; i<lnLength; i++)
            {
                var loModule = david.Bootstrap.getModule(laDependencies[i]);
                if (!loModule.isLoading())
                {
                    this.loadDependencies();
                    return;
                }
                else if (!loModule.isCompleted())
                {
                    return;
                }
            }
            
            this.setCompleted();
            this.executeLoadedCallbacks();
            david.Bootstrap.incrementLoadedModules();
            
            // Load any dependent parents
            var laParents = this.getParents();
            for (i=0, lnLength = laParents.length; i<lnLength; i++)
            {
                if (!laParents[i].isCompleted())
                {
                    laParents[i].complete();
                }
            }
            david.Bootstrap.onCompletedModule(this);
        },
        
        /**
         * Loads the module, loading takes place by adding a script tag to the head of the html 
         * if one does not already exist
         */
        load : function()
        {
            if ((this.isAnonymous() || !this.isLoading()) && !this.isCompleted())
            { 
                console.log("Starting load of module [" + this.getName() + "]");
                if (!this.loadDependencies())
                {
                    // The dependencies have loaded and there are no locks in place
                    if (this.isAnonymous())
                    {
                        // No script needed, we are complete
                        this.complete();
                    }
                    else
                    {
                        this.addScriptTag();
                    }
                }
            }
        },
        /**
         * Resolved the definition supplied into a value
         */
        resolveDefinition : function(toDefinition)
        {   
            if (david.utilities.isType(toDefinition, "Function"))
            {
                // Update the status
                var loArgs = this.getCallbackArguments();
                console.log("RESOLVING Definition for " + this.getName());                
                return toDefinition.apply(this.getDefinition(), loArgs.length > 1 ? loArgs.splice(1) : [this.getDefinition()]);
            }
            return toDefinition;
        }
    };




    // Store the object in require if needed, it may be a config argument
    var m_oOldRequire = require;
    // Clobber existing require
    require = function(taModules, toCallback)
    {
        console.log("REQUIRING : " + taModules.toString());
        var loConfig = !david.utilities.isType(taModules, "Array") && !david.utilities.isType(taModules, "String") ?
            taModules : null;
        
        // Adjust the parameters if this was a configuration object
        if (loConfig != null)
        {
            if (!david.utilities.isType(toCallback, "Array"))
            {
                taModules = toCallback;
                toCallback = arguments[2];
            }
        }
        
        var loReturn = david.Bootstrap.loadModule(taModules, toCallback);
        return loReturn == null ? null : loReturn.getDefinition();
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
            if (lcProperty == "debug")
            {
                if (!g_oBase.oldConsole)
                {
                    g_oBase.oldConsole = console;
                }
                g_oBase.console = !toConfig[lcProperty] ? 
                        {log : function(tcMessage){}, error : function(tcMessage){oldConsole.error(tcMessage)}} : 
                        oldConsole;
            }
            else
            {
                require.config[lcProperty] = toConfig[lcProperty];
            }
        }
    };
    
    // Set up some default david paths and configuration
    require.config({
        cachebuster : __CACHEBUSTER__,
        debug : __DEBUG__,
        baseUrl: "/resources/inc/javascript/",
        paths: {
            "underscore" : "/resources/inc/javascript/lib/underscore.js?version=" + __CACHEBUSTER__,
            "backbone" : "/resources/inc/javascript/lib/backbone-min.js?version=" + __CACHEBUSTER__,
            "jquery" : "/resources/inc/javascript/lib/jquery-1.7.min.js?version=" + __CACHEBUSTER__
        }
    });
    
    // if a require exsisted already, then see if it can be used as a config
    if (typeof(m_oOldRequire) != "undefined")
    {
        require.config(m_oOldRequire);
        m_oOldRequire = null;
    }
    
    // Clobber existing define
    define = function(tcModuleName, taDependencies, toCallback, tlForce)
    {
        if (tlForce || !david.Bootstrap.isLocked())
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
                console.log("DEFINING : " + tcModuleName);
                if (!taDependencies.length && toCallback.length)
                {
                    // TODO: Implement this
                    //taDependencies = ["require", "exports", "module"];
                }
                var loModule = david.Bootstrap.addModule({
                    name:tcModuleName, 
                    anonymous : true, 
                    dependencies: taDependencies,
                    definition : toCallback});
                if (!loModule.isCompleted())
                {
                    loModule.addLoadedCallback(toCallback);
                    loModule.load();
                }
            }
        }
        else
        {
            var loFunction = function(){
                define(tcModuleName, taDependencies, toCallback, true);
            };
            if (!david.Bootstrap.closures)
            {
                david.Bootstrap.closures = [];
            }
            if (tcModuleName === "underscore" || tcModuleName === "backbone")
            {
                loFunction.call();
            }
            else
            {
                david.Bootstrap.closures.push(loFunction);
            }
        }
    };
    define.amd = {};
    
    
    
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
    
    
    
    
    
    /**
     * Set up all of the requirements for the david framework
     */
    require(["order!jquery", "order!underscore"], function(toJQuery, toUnderscore)
    {
        // Setup the variables for the jquery and underscore
        g_oBase.$jQ = jQuery.noConflict();
        g_oBase._= toUnderscore;
        
        // redefine jquery so it will return the correct object
        define("jquery", [], function(){
            return $jQ;
        }, true);
        
        // Backbone is problematic with the AMD version of underscore, so load it separately
        require(["backbone"], function(toBackbone)
        {
            g_oBase.$bb = Backbone.noConflict();
            define("backbone", function(){
                return $bb;
            });
            david.Bootstrap.unlock();
            
            require(["david"]);
            
            if (david.Bootstrap.closures != null)
            {
                for (var i=0, lnLength = david.Bootstrap.closures.length; i<lnLength; i++)
                {
                    david.Bootstrap.closures[i].call();
                }
            }
        });
    });
})(this);