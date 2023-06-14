// ok. in order for this to work we need the dashboard to have an empty row.
// we can build the row ourselves because it wont have a data-cid="", so it wont render the background
// If your dashboard does not have an empty row, go there and add one now
// add the following in edit > source below your panels
// <row><html></html></row>

'use strict';

// set the runtime environment, which controls cache busting
var runtimeEnvironment = 'production';

var build;


// get app and page names
var pathComponents = location.pathname.split('?')[0].split('/');
var appName = pathComponents[3]
var pageName = pathComponents[4];


// path to the root of the current app
var appPath = "../app/" + appName;

// Queue translation early, before other work occurs
window.localeString = location.href.replace(/\/app\/.*/, "").replace(/^.*\//, "")
window.startTime = Date.now()


console.log(pathComponents)
//console.log(appName)
//console.log(appPath)
//console.log(window.localeString)
//console.log($C)
//console.log($C['SPLUNKD_PATH'])
//console.log($C['SPLUNKD_PATH'] + "/services/SSEShowcaseInfo?locale=" + window.localeString)


// lets get the page name, which is used to pull the specific showcaseinfo data we will use to build the page
var show_name = pageName.replace("attck_", "")
// var show_name = "sser_spike_in_smb_traffic" // testing with remote_desktop_network_bruteforce or basic_scanning or sser_spike_in_smb_traffic
console.log(show_name)

// START HERE
// Lets rebuild this section with something referenced here: https://www.golinuxcloud.com/javascript-wait-for-async-to-finish/
// and we call it before moving along down this page with 
// secondFunction()
// if this works, we'll repeat the process with the research stories json (or jsut stories), whichever we can find
// build in a check to see if we need to DL the research story data. if not, moveon

require(
    [
        'jquery'
        //Splunk.util.make_full_url('/static/app/' + appName + '/components/controls/ProcessSummaryUI.js')
    ],
    function(
        $
    ) {

        // declare for our variables
        var myshowcaseinfo = {}
        var ourStories = []
        var myjsonStories = []

        // we need to grab the data before we build the page. so we start that here. 
        async function fetchDataandStories() {
            console.log("Fetching ShowcaseInfo.json. This could take a bit")
            console.log("Fetching Analytic Stories. This could take a bit")
            const [showcaseResponse, storiesResponse] = await Promise.all([
                fetch($C.SPLUNKD_PATH + "/services/SSEShowcaseInfo?locale=" + window.localeString),
                fetch('https://content.splunkresearch.com/stories?community=false')
            ]);
          
            const jsonShowcase = await showcaseResponse.json();
            const jsonStories = await storiesResponse.json();
          
            return [jsonShowcase, jsonStories];
        }

        // this ensures we wait for the data to return before we move on to building the page
        async function call_fetchDataandStories() {
            await fetchDataandStories()
            .then(([jsonShowcase, jsonStories]) => {
                myshowcaseinfo = jsonShowcase['summaries'][show_name];
                myjsonStories = jsonStories;
            })
            .catch(error => {
                console.log(error.message)
            })
        }

        // Move on with code once we've grabbed the data
        $.when(call_fetchDataandStories()).then(function() {
            console.log("Hazzah! Done grabbing Showcase data and Analytic Stories.")
            //check our response is not 'undefined'
            if (myshowcaseinfo != undefined) {
                console.log("Showcase was found")
                // console.log(myshowcaseinfo)
                // console.log(myjsonStories)

                async function checkForStories() {
                    // check to see if our showcase data needs story data
                    if (myshowcaseinfo.hasOwnProperty("story")) {
                        // we have Splunk Research Stories
                        // lets get the story IDs, request the data, and extract our stories from data
                        // we'll need the k:v description and narrative for each story
                        var storyKeyList = []
                        storyKeyList = myshowcaseinfo['story'].split("|");
                        // console.log(storyKeyList)
                        // console.log("in checkForStories function")
                        // extract our stories here
                        // iterate over our story keys
                        for ( storykey in storyKeyList) {
                            // console.log(storyKeyList[storykey])
                            // iterate over the stories returned in the json data
                            for ( story in myjsonStories['stories']) {
                                // console.log(myjsonStories['stories'][story])
                                if (myjsonStories['stories'][story]['id'] == storyKeyList[storykey]) {
                                    // console.log("we have a story id match")
                                    // console.log(storyKeyList[storykey])
                                    // console.log(myjsonStories['stories'][story])
                                    ourStories.push((myjsonStories['stories'][story]))
                                }
                            }
                        }
                        // console.log(ourStories)
                        return ourStories
                    } else {
                        console.log("There are no analytic stories tied to this showcase. Thats ok :)")
                        // return ourStories
                    }
                };

                // we need to parse the story data so we only have the stories that go with our showcase
                async function call_checkForStories(){
                    await checkForStories()
                    .then(ourStories => {
                        // waiting checkForStories to finish. cause i dont know any other way to do that
                        // console.log(myshowcaseinfo)
                        // console.log(ourStories)
                    })
                    .catch(error => {
                        console.log(error.message)
                    })
                  };

                $.when(call_checkForStories()).then(function(){
                    // ready to build the html page
                    console.log("We're ready to build the html page")
                    // console.log(myshowcaseinfo)
                    // console.log(ourStories)

                    // send the data to the ProcessSummaryUI script to build the page
                    require(["jquery",
                             "underscore",
                             Splunk.util.make_full_url('/static/app/' + appName + '/components/controls/ProcessSummaryUI.js')
                             // may need more stuff here
                             // "splunkjs/mvc",
                             // "splunkjs/mvc/utils",
                             // "splunkjs/mvc/tokenutils",
                             // "splunkjs/mvc/simplexml",
                             // "splunkjs/mvc/searchmanager",
                             // "splunkjs/ready!",
                            ],
                            function($,
                                _,
                                ProcessSummaryUI
                                // may need a lot more stuff here :mvc, utils, TokenUtils, DashboardController, SearchManager, Telemetry, Ready
                            ) {
                                // look at cusotm_content.js to see DL of data and parsing for ProcessSummary
                                // look at bookmarked_content.js to see usage of processsummary
                                let summaryUI = ProcessSummaryUI.GenerateShowcaseHTMLBody(myshowcaseinfo, ourStories);
                            }
                    )

                })

            } else {
                console.log("ERROR: We did not pull back data for: " + show_name);
                console.log('Be sure to name this xml page the name of the showcase you are trying to pull info from.')
                console.log("You can see all of the showcase data here: " + $C.SPLUNKD_PATH + "/services/SSEShowcaseInfo?locale=" + window.localeString)
            }

        })

})