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
    var pluginRef =
      window.location.href.toString() + "plugins/thirdparty/vortex-web-client.js";
    console.log ("Loading Plug-in: " + pluginRef);

    freeboard.loadDatasourcePlugin({
        type_name : "Vortex",
        display_name : "Vortex Datasource",
        description : "Vortex push Datasource",
        external_scripts : [ pluginRef ],

        settings   : [
            {
                name : "url",
                display_name : "URL",
                type : "text",
                description  : "The URL for the Vortex Web server.",
                required : true
            },
            {
                name        : "topic",
                display_name: "Topic",
                type        : "text",
                description  : "The Partition and Topic name for the data source formatted as partition-name/topicname.",
                required : true
            },
            {
                name        : "contentFilter",
                display_name: "Content Filter",
                type        : "text",
                default_value: "NONE",
                description  : "The content filter for the data source."
            },
            {
                name        : "timeFilter",
                display_name: "Time Filter",
                type        : "text",
                default_value: "0",
                description  : "The Topic type for the data source."
            },
            {
                name        : "topicType",
                display_name: "Type",
                type        : "text",
                default_value: "Auto",
                description  : "The Topic type for the data source."
            },
            {
                name        : "bestEffort",
                display_name: "Best Effort",
                type        : "boolean",
                default_value: "true",
                description  : "Control wether the data is received reliably or in best-effort manner."
            }

        ],

        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new vortexDataSource(settings, updateCallback));
        }
    });


    var vortexDataSource = function(settings, updateCallback)
    {
        var self = this;
        var currentSettings = settings;
        var runtime = createVortex();
        var dr = null;

        var onOpen=function()
        {
            console.info("Vortex(%s) Opened", currentSettings.url);
            createDataReader();
        };

        function createDataReader()
        {
            if (dr != null) dr.close();

            var reliability = currentSettings.bestEffort ? dds.Reliability.BestEffort : dds.Reliability.Reliable;
            var drQos = new dds.DataReaderQos(reliability);

            var cf = currentSettings.contentFilter;
            if ( cf != 'NONE') {
                console.log(">>>>>>>>>> Content Filter: " + cf);
                drQos = drQos.add(dds.ContentFilter(cf));
            }

            var tf = parseInt(currentSettings.timeFilter);
            console.log ('Time Filter: ' + tf);
            if (tf > 0)
                drQos = drQos.add(dds.TimeFilter(tf));


            var type =
                currentSettings.topicType == 'Auto' ? 'org.omg.dds.types.JSONTopicType' : currentSettings.type

            console.log ("Topic Type: " + type)
            var parts = currentSettings.topic.split('/');
            var partitionName= "";
            var topicName =  "";

            if (parts.length > 1) {
                partitionName = parts[0];
                topicName = parts[1];
                drQos = drQos.add(dds.Partition(partitionName));
            }
            else
                topicName = parts[0];


            var topic = new dds.Topic(0,
                topicName,
                new dds.TopicQos(dds.Reliability.BestEffort),
                type);
            runtime.registerTopic(topic);
            dr = new dds.DataReader(runtime, topic, drQos);
            var listener = function (data) {
                updateCallback (data)
            };
            dr.addListener(listener);
        }


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
            var vortex = new dds.runtime.Runtime();

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
            return vortex;
        };



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
