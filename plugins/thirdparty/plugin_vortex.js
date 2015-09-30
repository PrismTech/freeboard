/**
 * PrismTech licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with the
 * License and with the PrismTech Vortex product. You may obtain a copy of the
 * License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License and README for the specific language governing permissions and
 * limitations under the License.
 */
(function()
{
    freeboard.loadDatasourcePlugin({
        type_name : "prismtech_vortex",
        display_name : "PrismTech Vortex",
        description : "A push datasource based on PrismTech Vortex Web",
        external_scripts : [
            "http://localhost:8000/plugins/thirdparty/vortex-web-client.js"
        ],
        settings : [
            {
                name : "url",
                display_name : "URL",
                type : "text",
                required : true
            },
            {
                name : "domain",
                display_name : "Domain",
                type : "text",
                required : true
            },
            {
                name : "topic",
                display_name : "Topic",
                type : "text",
                required : true
            },
            {
                name : "topic_type",
                display_name : "Topic type",
                type : "text",
                required : true
            },
            {
                name : "topic_reg_type",
                display_name : "Topic registration type",
                type : "text",
                required : false
            },
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new vortexDataSource(settings, updateCallback));
        }
    });

    var vortexDataSource = function(settings, updateCallback)
    {
        var self = this;
        var currentSettings = settings;
        var vortex = null;
        var dr = null;

        var onOpen=function()
        {
            console.info("Vortex(%s) Opened", currentSettings.url);

            var tqos = new dds.TopicQos();
            var topic = new dds.Topic(currentSettings.domain, currentSettings.topic, tqos, currentSettings.topic_reg_type, currentSettings.topic_type);

            vortex.registerTopic(topic);
            topic.onregistered = function() {

                // defining the DataReader QoS
                var drQos = new dds.DataReaderQos();

                // creating the Vortex DataReader
                if(dr === null)
                    dr = new dds.DataReader(vortex, topic, drQos);

                dr.addListener(onData);
            };
        };

        var onClose=function()
        {
            console.info("Vortex(%s) Closed", currentSettings.url);
        };

        var onData=function(data)
        {
            updateCallback(data);
        };

        function createVortex()
        {
            if(vortex) vortex.close();

            var url=currentSettings.url;
            vortex = new dds.runtime.Runtime();

            // Connecting to the Vortex Web Server
            vortex.connect(url, "uid:pwd");

            vortex.onconnect = function()
            {
                onOpen();
            }

            vortex.ondisconnect = function()
            {
                onClose();
            }
        };

        createVortex();

        self.updateNow = function()
        {
            //createVortex();
        };

        this.onDispose = function()
        {
            vortex.close();
            vortex = {};
        };

        this.onSettingsChanged = function(newSettings)
        {
            currentSettings = newSettings;

            createVortex();
        };
    };

    
}());
