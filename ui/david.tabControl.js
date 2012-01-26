
define(["jquery"], function($jQ){
    
    // Private methods closure
    var loMethods = {
        init : function(){
            return this.each(function(){
                // Remove the scroll bars
                $jQ(".tabs", this).css(
                {
                    "overflow": "inherit",
                    "height" : "inherit"
                });
                
                // Remove the forced height of the tabs
                $jQ(".tabPanel", this).css({"height" : "inherit",
                        "display" : "none"});
                
                // Listen for a hash changed event
                var loCallback = david.utilities.createCallback(function(tcHash){$jQ(this).tabControl('select', tcHash);}, this);
                david.browser.registerHashListener(loCallback);
                
                // If there is no tab selected, select the first one
                $jQ(this).tabControl('select', david.browser.getHash() || $jQ(".tabs > div", this)[0].id);
                
            });
            
        },
        select : function(tcTabID){
            $jQ(".tabPanel", this).css('display', 'none');
            $jQ("#" + tcTabID, this).css('display', 'block');
            $jQ(".tabList > li a", this).removeClass("selected");
            $jQ("[href='#" + tcTabID + "']", this).addClass("selected");
        }
    }
    
    $jQ.fn.tabControl = function(tcMethod){
        if (loMethods[tcMethod])
        {
            return loMethods[tcMethod].apply(this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if(!tcMethod || david.utilities.isType(tcMethod, "Object"))
        {
            return loMethods.init.apply(this, arguments);
        }
        else
        {
            $jQ.error("Method" + lcMethod + "does not exist");
        }
    };
    
    
    david.tabControl = {
        init : function(toElement){
            // Initialise the jQuery plugin
            $jQ(toElement).tabControl();
        }
    };
    
    return david.tabControl;
    
});