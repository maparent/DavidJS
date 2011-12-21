/*====================================
Ordering plugin for david bootstrap.

This plugin will load any modules indicated in the order they are presented.


====================================*/
define(function(){
    
    var m_aLoading = [];
    
    
    return {
        onLoaded : function (toModule)
        {
            // Clear out the loaded module
            var lnIndex = m_aLoading.indexOf(toModule.getName());
            if (lnIndex >= 0)
            {
                m_aLoading.splice(lnIndex,1);
            }
            
            // Load the next one
            if (m_aLoading.length > 0)
            {
                var loModule = david.Bootstrap.getModule(m_aLoading[0]);
                loModule.plugin.load(loModule);
            }
        },
        load : function (toModule)
        {
            // If the module is already loaded then there is nothing to do
            if (!toModule.isLoading() && !toModule.isCompleted())
            {
                if (m_aLoading.indexOf(toModule.getName()) < 0)
                {
                    m_aLoading.push(toModule.getName());
                }
                
                // If this is the top module on the list, start to load it
                if (m_aLoading[0] === toModule.getName())
                {
                    toModule.load();
                }
            }
        }
    };
}, true);