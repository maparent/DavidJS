
/*====================================
Root of the David JavaScript framework
Nearly all of the other modules depend on this module.

This module should be loaded using david.Bootstrap.


====================================*/

define(["david.utilities", "order!jquery", "order!underscore", "order!backbone"],
    function($du, $jQ, _, $bb){
        
        
        // The name of the attribute to search for plugin modules
        var DAVIDPLUGIN = "data-module";
        // The name of the attribute to search for overriding the "init" function
        var INITOVERRIDE = "data-init";

        /* look for and load any plugins, plugins are elements with an attribute data-module.
           Chose data-module to be similar to requireJS' data-main script loading.  In this
           case we are loading a module, not a main, hence the terminology change.  By default
           the method init will be called, passing the element as the only parameter, init can be
           overridden by also supplying a data-init attribute for more flexibility
        */
        $jQ("[" + DAVIDPLUGIN + "]").each(function(tnIndex, toElement){
            toElement = $jQ(toElement);
            require(toElement.attr(DAVIDPLUGIN), function(toModule){
                $du.initialiseModule(toModule, toElement, tnIndex, toElement.attr(INITOVERRIDE));
            });
        });
        
        
        
        /**
         * Creates an object for the namespace specified, or if the namespace exists
         * returns that namespace
         */
        david.namespace = function(tcNamespace)
        {   
            var laParts = tcNamespace.split('.');

            window[laParts[0]] = window[laParts[0]] ? window[laParts[0]] : {};
            var loCurrent = window[laParts[0]];

            for (var i = 1, lnLength=laParts.length; i<lnLength; i++)
            {
                if (!loCurrent[laParts[i]])
                {
                    loCurrent[laParts[i]] = {};
                }
                loCurrent = loCurrent[laParts[i]];
            }
            return loCurrent;
        }
        
        
        
        
        
        
        
        return {};
        
// Ensure david namespace is defined
//if (_.isUndefined(david))
//{
//    alert("The david framework is not defined. Incorrect javascript dependancy loading.");
//}

//
//
///**
// * Creates an object for the namespace specified, or if the namespace exists
// * returns that namespace
// */
//david.namespace = function(tcNamespace)
//{   
//    var laParts = tcNamespace.split('.');
//    
//    window[laParts[0]] = window[laParts[0]] ? window[laParts[0]] : {};
//    var loCurrent = window[laParts[0]];
//
//    for (var i = 1, lnLength=laParts.length; i<lnLength; i++)
//    {
//        if (!loCurrent[laParts[i]])
//        {
//            loCurrent[laParts[i]] = {};
//        }
//        loCurrent = loCurrent[laParts[i]];
//    }
//    return loCurrent;
//}
////david.namespace = function(tcNamespace)
////{   
////    var laParts = tcNamespace.split('.');
////    var laFirst = _.first(laParts);
////   
////    // create a global namespace with first item if not already created
////    window[laFirst] = window[laFirst] ? window[laFirst] : {};
////    var loCurrent = window[laFirst];
////    
////    _.each(_.rest(laParts), function(laPart){
////        
////        if(_.isUndefined(laPart)){
////            loCurrent[laPart] = {};
////        }
////        loCurrent = loCurrent[laPart];
////    });
////    return window[laFirst];
////}
//
///**
// * Sets the status message on the page
// */
//david.setStatus = function(tcMessage)
//{
//    // Check if the status bar exists on the page yet
//    if (typeof(david._statusBar) == "undefined")
//    {
//        david._statusBar = 
//            jQuery("<div id='_statusbar' class='statusElement'></div>")
//                    .appendTo(document.body);
//    }
//    
//    david._statusBar.text(tcMessage)
//    david._statusBar.fadeIn("fast");        
// 
//    if (this._statusBarTimeout)
//    {
//        clearTimeout(this._statusBarTimeout);
//    }
//    this._statusBarTimeout = setTimeout( 
//        function() {
//            david._statusBar.fadeOut("slow");
//            this._statusBarTimeout = 0;
//        } ,1000);
//}
//
//
//david.User = $bb.Model.extend({
//    initialize : function(){
//        this.url = "/DO/User/" + this.get("guid");
//    },
//    parse: function(toResponse){
//        // If the response is null, then the user is not valid (or anonymous)
//        if (toResponse != null)
//        {
//            console.log("User Response:",toResponse);
//        }
//    }
//});
//
//
///** Creation of the browser helper utilities */
//david.browser = (function($){
//    
//    // Global application cookie identifier
//    var SESSION_COOKIE = "goliath_app_id";
//    var SESSION_PARAMETER = "sessionID";
//    
//    // The Location Controller handles all browser URL related functionallity
//    var m_oLocationController = (function(){
//        
//        // Private methods and variables
//        var m_oURLParameters = null;
//
//
//        // The public interface for this controller
//        return {
//            getHref: function(){return location.href;},
//            getHash: function(){return location.hash;},
//            getHost: function(){return location.host;},
//            getHostname: function(){return location.hostname;},
//            getPathname: function(){return location.pathname;},
//            getPort: function(){return location.port;},
//            getProtocol: function(){return location.protocol;},
//            getSearch: function(){return location.search;},
//            // Sends the browser to a new page, this will update the history
//            setLocation: function(tcURL){location.assign(this.cleanLocation(tcURL));},
//            // Sends the browser to a new page, but does not change history
//            replaceLocation: function(tcURL){location.replace(this.cleanLocation(tcURL));},
//            // Sets up a url to be used as a web service call
//            getWebServiceURL :function(tcURL){return "/WS/" + this.cleanLocation(tcURL);},
//            // Makes sure the url is valid and adds a session id if required
//            cleanLocation: function(tcURL)
//            {
//                tcURL = tcURL || "/";
//                // Add the session id if needed
//                if (!m_oCookieController.usesCookies() && 
//                    (tcURL.indexOf(SESSION_PARAMETER) < 0 || !tcURL.indexOf(this.getHost()) >= 0 || tcURL.indexOf('.') == 0 || tcURL.indexOf('/') == 0))
//                {
//                    var lcSessionID = david.browser.sessionController.getSessionID();
//                    if (lcSessionID != null)
//                    {
//                        tcURL += ((tcURL.indexOf('?') >= 0) ? "&" : "?" ) + SESSION_PARAMETER + "=" + lcSessionID;
//                    }
//                }
//                return tcURL;
//            },
//            /**
//             * Gets an object containing all of the parameters of the url for example, a url such as the following:
//             * http://localhost:8080/collector?projectID=myProject&testParameter=12349987
//             * would return the following object:
//             * {
//             *  projectID: "myProject",
//             *  testParameter: "12349987"
//             * }
//             */
//            getURLParameters: function()
//            {
//                if (!m_oURLParameters)
//                {
//                    m_oURLParameters = {};
//                    var laSearch = this.getSearch();
//                    laSearch = ((laSearch.length > 0) ? laSearch.substring(1) : laSearch).split('&');
//
//                    for (var i=0, lnLength = laSearch.length; i<lnLength; i++)
//                    {
//                        var laParam = laSearch[i].split("=");
//                        m_oURLParameters[laParam[0]] = laParam[1];
//                    }
//                }
//                return m_oURLParameters;
//            },
//            /**
//             * Gets the value of an individual parameter on the url, if the parameter does not
//             * exist, this will return null rather than undefined
//             */
//            getURLParameter: function(tcParameter)
//            {
//                return this.getURLParameters()[tcParameter] || null;
//            }
//        };
//
//    })();
//        
//    // The Cookie controller handles all of the cookie related functions
//    var m_oCookieController = (function(){
//        
//        // The public interface for this controller
//        return {
//            // Checks if we are allowed to use cookies
//            usesCookies: function()
//            {
//                var lnDate = new Date().getTime();
//                var lcCookie = "goliath.test";
//
//                this.setCookie(lcCookie, lnDate);
//
//                var lnCookieValue = this.getCookie(lcCookie);
//                this.deleteCookie(lcCookie);
//
//                // This replaces the usesCookies function with the functions below,
//                // this will mean the comparison is only called once
//                this.usesCookies = (lnDate == lnCookieValue) ?
//                    function(){return true;} :
//                    function(){return false;};
//
//                return this.usesCookies();
//            },
//            /**
//             * Gets the current value of a cookie, or null if the cookie doesn't
//             * exist
//             */
//            getCookie: function(tcName)
//            {
//                var laResults = document.cookie.match ( '(^|;) ?' + tcName + '=([^;]*)(;|$)' );
//                return (laResults) ? laResults[2] : null;
//            },
//
//            /**
//             * Sets the value of a cookie
//             */
//            setCookie: function(tcName, tcValue, tdExpires, tcPath, tcDomain, tlSecure )
//            {
//                if (tdExpires)
//                {
//                    tdExpires = tdExpires * 1000 * 60 * 60 * 24;
//                }
//                var ldExpires_date = new Date(new Date().getTime() + (tdExpires));
//
//                document.cookie = tcName+'='+escape(tcValue) +
//                    ((tdExpires) ? ';expires=' + escape(ldExpires_date.toGMTString()) : '') +
//                    ';path=' + escape(tcPath || '/' ) +
//                    ';domain=' + escape(tcDomain || '') +
//                    ( (tlSecure ) ? ';secure' : '' );
//            },
//
//            /**
//             * Deletes a cookie
//             */
//            deleteCookie: function(tcName, tcPath, tcDomain )
//            {
//                if (this.getCookie(tcName))
//                {
//                    document.cookie = tcName + '=' +
//                        ';path=' + escape(tcPath || '/') +
//                        ';domain=' + escape(tcDomain || '') +
//                        ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
//                }
//            }
//
//        };
//
//    })();
//        
//        // The session controller handles all of the user and session related functions
//    var m_oSessionController = (function(){
//        
//        var m_cSessionID = null;
//        var m_nUpdateTimeout = -1;
//        var m_oUser = null;
//        
//        // Create a backbone model for keeping all of the session information
//        // up to date
//        var m_oSessionModel = new ($bb.Model.extend({
//            
//            
//            initialize :function(){
//                console.log("init session");
//                // Try to find the session id
//                m_cSessionID = m_oCookieController.usesCookies() ?
//                    m_oCookieController.getCookie(SESSION_COOKIE) : null;
//                m_cSessionID = m_cSessionID || m_oLocationController.getURLParameter(SESSION_PARAMETER);
//                console.log("session id:",m_cSessionID)
//                this.url = m_oLocationController.getWebServiceURL("SessionInformation");
//                
//            },
//            onKeepAliveChanged : function(toSessionModel, tlKeepAlive)
//            {
//                console.log("trying to keep alive");
//                
//                if (tlKeepAlive)
//                {
//                    // Get the session information, including the expiry time
//                    toSessionModel.fetch();
//                }
//                else
//                {
//                    // Stop updating the session, this will not expire the session right away
//                    if (m_nUpdateTimeout >= 0)
//                    {
//                        window.clearTimeout(m_nUpdateTimeout);
//                        m_nUpdateTimeout = -1;
//                    }
//                }
//            },
//            onUserGUIDChanged : function(toSessionModel, tcUserGUID)
//            {
//                console.log("GUID changed:",tcUserGUID);
//                m_oUser = new david.User({guid : tcUserGUID});
//                m_oUser.fetch();
//                    
//            },
//            parse : function(toResponse)
//            {   
//                console.log("fetched session informaiton:",toResponse);
//                
//                this.set({isExpired : toResponse.base.isexpired});
//                this.set({expires : toResponse.base.expires});
//                this.set({expiryLength : toResponse.base.expirylength});
//                this.set({authenticated : toResponse.base.authenticated});
//                this.set({userGUID : toResponse.base.userguid});
//                this.set({language : toResponse.base.language});
//                this.set({userDisplayName : toResponse.base.userdisplayname});
//                this.set({isMultilingual : toResponse.base.ismultilingual});
//                
//                // Prepare for another fetch if needed
//                var loClosure = this;
//                m_nUpdateTimeout = window.setTimeout(
//                        function(){loClosure.fetch();}, this.get("expiryLength") * .75);
//            }
//        }))();
//        // Event binding for the session model
//        m_oSessionModel.bind("change:keepAlive", m_oSessionModel.onKeepAliveChanged, m_oSessionModel);
//        m_oSessionModel.bind("change:userGUID", m_oSessionModel.onUserGUIDChanged, m_oSessionModel);
//        
//        // Checking for online/offline
//        var checkNetwork = function()
//        {
//            if (navigator.onLine)
//            {
//                $.ajaxSetup({
//                    async: true,
//                    cache: false,
//                    context: $(document),
//                    dataType: "json",
//                    error: function(toRequest, tnStatus, toEx)
//                    {
//                        m_oSessionModel.set({online : false});
//                    },
//                    success : function(toData, tnStatus, toRequest)
//                    {
//                        m_oSessionModel.set({online : true});
//                    },
//                    timeout : 5000,
//                    type : "GET",
//                    url: "/WS/DO/User"
//                });
//                $.ajax();
//            }
//            else
//            {
//                m_oSessionModel.set({online : false});
//            }
//        }
//        // bind to the online and offline events
//        $(document.body).bind("online", checkNetwork);
//        $(document.body).bind("offline", checkNetwork);
//        checkNetwork();
//        
//        // The public interface for this controller
//        return {
//            getSessionID : function(){return m_cSessionID;},
//            isOffline : function(){return !m_oSessionModel.get('online')},
//            getUserDisplayName : function(){return m_oSessionModel.get('userDisplayName');},
//            setKeepAlive : function(tlKeepAlive){m_oSessionModel.set({keepAlive : tlKeepAlive});},
//            isAnonymous : function(){return m_oSessionModel.get("isAnonymous");},
//            bind : function(tcProperty, toFunction, toContext){m_oSessionModel.bind(tcProperty, toFunction, toContext)},
//            getModel : function(){return m_oSessionModel;}
//        };
//        
//        })();
//        
//        
//        
//        
//        
//    // Returns the public interfact to the browser utilities
//       return {
//        cookieController : m_oCookieController,
//        locationController : m_oLocationController,
//        sessionController : m_oSessionController,
//        createActiveXObject : function(tcName){try{ return new ActiveXObject(tcName);}catch(toEX){return null;}},
//        
//        // HTML 5 support functions
//        isOffline: function(){return m_oSessionController.isOffline();},
//        geolocationSupported: function(){this.geolocationSupported = !!navigator.geolocation ? function(){return true;} : function(){return false;};
//            return this.geolocationSupported()},
//        offlineSupported : function(){this.offlineSupported = !!window.applicationCache ? function(){return true;} : function(){return false;};
//            return this.offlineSupported()},
//        webWorkersSupported : function(){this.webWorkersSupported = !!window.Worker ? function(){return true;} : function(){return false;};
//            return this.webWorkersSupported()},
//        localStorageSupported: function(){
//            try{this.localStorageSupported = 'localStorage' in window && window['localStorage'] != null ?
//                    function(){return true;} :
//                    function(){return false;};}catch (e){this.localStorageSupported = function(){return false;};}
//            return this.localStorageSupported();
//        },
//        javaSupported : function() {this.javaSupported = navigator.javaEnabled ?
//                function(){return true;} : function(){return false;}; return this.javaSupported();},
//        flashSupported : function() {
//            var llSupported = ((navigator.plugins && navigator.plugins.length > 0)
//                    && (navigator.mimeTypes && 
//                                navigator.mimeTypes["application/x-shockwave-flash"] && 
//                                navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin)) ||
//                        ((navigator.appVersion.indexOf("Mac")==-1 && window.execScript) &&
//                            this.createActiveXObject("ShockwaveFlash.ShockwaveFlash") !=null);
//            this.flashSupported = llSupported ?
//                function(){return true;} : function(){return false;}; return this.flashSupported();},
//        videoSupported: function(){this.videoSupported = 
//                !!document.createElement('video').canPlayType ?
//                function(){return true;} : function(){return false;}; return this.videoSupported();},
//        canvasSupported: function(){this.canvasSupported = 
//                !!document.createElement('canvas').getContext ?
//                function(){return true;} : function(){return false;}; return this.canvasSupported();},
//        canvasTextSupported: function(){this.canvasTextSupported = 
//                !this.canvasSupported() ? function(){return false;} :
//                typeof(document.createElement('canvas').getContext('2d').fillText) == 'function' ?
//                function(){return true;} : function(){return false;}; return this.canvasTextSupported();},
//        
//        // Location related helper functions
//        getURLParameter : function(tcParameterName){return this.locationController.getURLParameter(tcParameterName);},
//        setLocation : function(tcURL, tlUpdateHistory){tlUpdateHistory ? this.locationController.setLocation(tcURL) : this.locationController.replaceLocation(tcURL);},
//        
//        // Session related helper functions
//        keepAlive : function(tlKeepAlive){this.sessionController.setKeepAlive(tlKeepAlive);},
//        getUserDisplayName : function(){return this.sessionController.getUserDisplayName();},
//        isAnonymous : function(){this.sessionController.isAnonymous();},
//        bindToProperty : function(tcProperty, toFunction){this.sessionController.bind("change:" + tcProperty, toFunction);}
//    };
//    
//})($jQ);
//
//david.security = (function($){
//    
//    
//    var m_oAuthenticateController = (function(){
//
//        
//        
//        var isAuthenticated = null;
//        
//        var m_oAuthenticate = function(data,callback){
//            console.log("sending", JSON.stringify(data));
//            $.ajax({
//                contentType: "application/json",
//                context: document.body,
//                data: JSON.stringify(data),
//                dataType: "json",
//                type:"POST",
//                url: "/WS/SigninService/",
//                success: function(){
//                    callback("Register Success.");
//                },
//                error: function(){
//                    callback("Register Failure.");
//                },
//                complete: function(jqXHR, textStatus){
//                    console.log(jqXHR, textStatus);
//                }
//            });
//        }
//        
//        var m_oRegister = function(data, callback){
//            console.log("sending", JSON.stringify(data));
//            $.ajax({
//                url: "/WS/UserRegisterService/",
//                contentType: "application/json",
//                dataType: "json",
//                context: document.body,
//                data: JSON.stringify(data),
//                type:"POST",
//                success: function(){
//                    callback("Register Success.");
//                },
//                error: function(){
//                    callback("Register Failure.");
//                },
//                complete: function(jqXHR, textStatus){
//                    console.log(jqXHR, textStatus);
//                }
//            });
//        }
//        
//        var m_oSignout = function(){
//              if(david.browser.sessionController.isAnonymous() == "false")
//              {
//                  $.ajax({
//                      type: 'get',
//                      dataType: "json",
//                      url: "/WS/SignoutService/"
//                  });
//              }
//              else
//              {
//                  console.log("you are not logged in!");
//              }
//        }
//        
//        
//        //thinking about watching session to logout on manual changes to session:
//        //david.browser.bindToProperty("", m_oSignout)
//        var m_oChangePassword = function(info){
//              var data = info || {OldPassword:"myOldPassword", NewPassword:"myNewPassword"};
//              $.ajax({
//                  type: 'post',
//                  dataType: "json",
//                  data: data,
//                  url: "/WS/ChangePasswordService/",
//                  complete: function(jqXHR, textStatus){
//                      console.log(jqXHR,textStatus);
//                  }
//              });
//              
//        }
//        
//        //public interface to this controller.
//        return{
//            login : m_oAuthenticate,
//            register : m_oRegister,
//            signout : m_oSignout,
//            changePassword : m_oChangePassword
//        }
//        
//    })();
//        
//    
//    return {
//        authenticateController : m_oAuthenticateController
//    }
//    
//    david.davidLoaded = function(backbone, jquery)
//    {
//        console.log("david loaded.");
//        if (typeof(onPageInit) == "function")
//        {
//            onPageInit.call();
//        }
//    }
//    
//    
//})($jQ);

});
