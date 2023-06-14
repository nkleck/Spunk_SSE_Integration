// here we will parse the Showcaseinfo data into the html page
// we parse the splunk_research_stories into the html page
// any other page building

'use strict';

define([
    'jquery',
    'underscore',
    'module',
    'bootstrap.popover',
    'splunkjs/mvc',
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/element/chart",
    "splunkjs/mvc/simplexml/element/map",
    "splunkjs/mvc/simplexml/element/table",
    "splunkjs/mvc/simplexml/element/single",
    "splunkjs/mvc/resultslinkview",
    "splunkjs/mvc/simplexml/ready!"
], function(
    $,
    _,
    module,
    showdown,
    Telemetry,
    BuildTile,
    SearchManager,
    ChartElement,
    MapElement,
    TableElement,
    SingleElement,
    ResultsLinkView,
    hljs,
    bookmark_names,
    SavedSearchSelectorModal
) {

    // console.log("Hello from ProcessSummaryUI.js")
    return {

        GenerateShowcaseHTMLBody: function GenerateShowcaseHTMLBody(myshowcaseinfo, ourStories) {
            // console.log("Hello from GenerateShowcaseHTMLBody")
            // console.log(myshowcaseinfo)
            // console.log(ourStories)

            // ok. in order for this to work we need the dashboard to have an empty row.
            // we can build the row ourselves because it wont have a data-cid="", so it wont render the background
            // If your dashboard does not have an empty row, go there and add one now
            // add the following in edit > source
            // <row><html></html></row>
            // the code below will find that row and build the showcase content

            // find last row on the page. we're going to build our html in a new row after that
            var allrows = document.querySelectorAll('[id^="row"]');
            // console.log(allrows)
            var last_row = allrows[allrows.length -1]
            var last_row_id = last_row.id

            // if multiple <html> on the page, content is incremented
            // so we are going to walk it from in last row down to the panel-body div
            // which is where we will start adding our data
            var lastrow = document.getElementById(last_row_id)
            // console.log(lastrow)
            // get div from the last row containing "content#"
            var lastrow_content1_div = lastrow.querySelector('[id^="content"]')

            // if there is not an empty last row or the presence of content# we will error
            try {
                // get child of our empty row <div class="panel-body html"> 
                var DivPanelBody = lastrow_content1_div.querySelector('.panel-body')
                // console.log(lastrow_content1_div)
            } catch (err) {
                console.log(err);
                console.log("This error occurs when we do not have a row to append our data.")
            }
            
            // Check that we have an found a row with content we can append to.
            // DivPanelBody!=null
            // Check that the <div class="panel-body html"></div> has no children. 
            // checking for a length >0 means there is no content in the new row
            // we need an empty row
            if ( DivPanelBody!=null && !DivPanelBody.children.length > 0 ) { 
                // We have an empty row to add our data to
                // console.log("We have an empty row to add data.")

                // adding the contentDescription div
                var DivContentDescription = document.createElement('div');
                DivContentDescription.id = 'contentDescription';
                DivContentDescription.dataset.showcaseid = myshowcaseinfo['id'];
                DivContentDescription.classList.add('contentDescription');
                DivPanelBody.appendChild(DivContentDescription);

                // building description section
                // <div class="descriptionBlock"> appends to id="contentDescription"
                    // <h2>Description</h2>
                    // <p>This search looks for RDP application network traffic and filters any source/destination pair generating more than twice the standard deviation of the average traffic.</p>
                var DivDescriptionBlock = document.createElement('div');
                DivDescriptionBlock.classList.add('descriptionBlock');

                var DivDescriptionBlock_h2 = document.createElement('h2');
                DivDescriptionBlock_h2.textContent = 'Description';
                DivDescriptionBlock.appendChild(DivDescriptionBlock_h2);

                var DivDescriptionBlock_p = document.createElement('p');
                // some of the descriptions start with html tags, regex out the first <p> stuff and use that. 
                if (myshowcaseinfo['description'].startsWith('<')) {
                    // console.log(myshowcaseinfo['description'].match(/<\s*p[^>]*>([^<]*)<\s*\/\s*p\s*>/)) // alternate regex: /<p>(.*?)<\/p>/g
                    DivDescriptionBlock_p.textContent = myshowcaseinfo['description'].match(/<\s*p[^>]*>([^<]*)<\s*\/\s*p\s*>/)[1];
                } else {
                    DivDescriptionBlock_p.textContent = myshowcaseinfo['description'];
                }
                DivDescriptionBlock.appendChild(DivDescriptionBlock_p);

                // add it all to id="contentDescription"
                DivContentDescription.appendChild(DivDescriptionBlock);

                // <div class="columnWrapper"> appends to id="contentDescription"
                    // <div class="releaseInformationBlock"></div>
                var DivColumnWrapper = document.createElement('div');
                DivColumnWrapper.classList.add('columnWrapper');

                var DivReleaseInformationBlock = document.createElement('div');
                DivReleaseInformationBlock.classList.add('releaseInformationBlock');
                DivColumnWrapper.appendChild(DivReleaseInformationBlock);

                // append these to id="contentDescription"
                DivContentDescription.appendChild(DivColumnWrapper);

                // display the table that presents the data in box1 and box2
                // <div style="display: table;">
                    // <div style="overflow: hidden; padding: 10px; margin: 0px; width: 50%; min-width:585px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">
                var DivTable = document.createElement('div');
                DivTable.style = 'display: table;';

                // append these to id="contentDescription"
                DivContentDescription.appendChild(DivTable);

                var empty_p = document.createElement('p');

                // the original ProcessSummaryUI creates all the content as strings in a variable (box1 and box2), then appends the variables to the page
                // idk how that is rendered to the DOM as elements. I suspect its a splunk function. until I figure that out, we will render each element below.
                // Thought: maybe its putting all the html strings into 1 variable and doing insertAdjacentHTML to the DivTable1
                // so we're going to work the page from top to bottom adding each section
                // box1 content:
                    // style = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 50%; min-width:585px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">'
                    // usecaseText
                    // areaText (Categories)
                    // relevance (Security Impact)
                    // alertVolumeText
                    // SPLEaseText                                          // not rendering
                    // security_content_fields["analytic_stories"]
                    // security_content_fields["dataset"]                   // i think this has to do with sample data. not rendering this
                    // security_content_fields["how_to_implement"]          // KEYS: howToImplement OR how_to_implement 
                    // security_content_fields["known_false_positives"]     // KEYS: knownFP OR known_false_positives
                    // security_content_fields["role_based_alerting"]       // no clue where this comes from (key)

                // All of our left side content gets added to THIS DIV
                var DivTable_Box1 = document.createElement('div');
                DivTable_Box1.style = 'overflow: hidden; padding: 10px; margin: 0px; width: 50%; min-width:585px; min-height: 250px; display: table-cell; border: 1px solid darkgray;';
                DivTable.appendChild(DivTable_Box1);

                // Check if Use Case info exists
                var usecaseText = ""
                if (typeof myshowcaseinfo['usecase'] != "undefined") {
                    usecaseText = "<p><h2>" + "Use Case" + "</h2>" + myshowcaseinfo['usecase'].split("|").join(", ") + "</p>"
                }

                // check if Category data exists
                // Keys: "category": "Malware|Zero Trust",
                // ADD LOGIC IF Zero Trust shows up. it gets an <a> and popover
                var areaText = ""
                if (typeof myshowcaseinfo['category'] != "undefined") {
                    let categories = myshowcaseinfo['category'].split("|").sort()
                    //Add External link to certain categories
                    for (var c = 0; c < categories.length; c++) {
                        if (categories[c] == "Zero Trust") {
                            let externallink = "https://www.splunk.com/en_us/form/zero-trust-security-model-in-government.html"
                            let externallinkDescription = "Read more about Splunk and Zero Trust here"
                            categories[c] = "<a class=\"external drilldown-link\" data-toggle=\"tooltip\" title=\"" + externallinkDescription + "\" target=\"_blank\" href=\"" + externallink + "\"> " + categories[c] + "</a>"
                        }
                    }
                    areaText = "<p><h2>" + "Category" + "</h2>" + categories.join(", ") + "</p>"
                }

                // check if Security Impact exists (relevance key)
                var relevance = ""
                if (typeof myshowcaseinfo['relevance'] != "undefined" && myshowcaseinfo['relevance'] != "") {
                    relevance = "<h2>" + "Security Impact" + "</h2><p>" + myshowcaseinfo['relevance'] + "</p>"
                }

                // check if alert volume exists and not "None"
                var alertVolumeText = ""
                if (myshowcaseinfo['alertvolume']  && myshowcaseinfo['alertvolume']!="None") { 
                    // build header
                    alertVolumeText = "<h2>" + "Alert Volume" + "</h2>"
                    // build span body and popover
                    if (myshowcaseinfo['alertvolume'] == "Very Low" || myshowcaseinfo['description'].match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/)) {
                        alertVolumeText += '<span class="dvPopover popoverlink" id="alertVolumetooltip" title="" data-placement="right" data-toggle="popover" data-trigger="hover" data-original-title="Alert Volume: Very Low" data-content="An alert volume of Very Low indicates that a typical environment will rarely see alerts from this search, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">' + "Very Low" + '</span>'
                    } else if (myshowcaseinfo['alertvolume'] == "Low" || myshowcaseinfo['description'].match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/)) {
                        alertVolumeText += '<span class="dvPopover popoverlink" id="alertVolumetooltip" title="" data-placement="right" data-toggle="popover" data-trigger="hover" data-original-title="Alert Volume: Low" data-content="An alert volume of Low indicates that a typical environment will occasionally see alerts from this search -- probably 0-1 alerts per week, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert if you decide it is relevant to your risk profile, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">' + "Low" + '</span>'
                    } else if (myshowcaseinfo['alertvolume'] == "Medium" || myshowcaseinfo['description'].match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/)) {
                        alertVolumeText += '<span class="dvPopover popoverlink" id="alertVolumetooltip" title="" data-placement="right" data-toggle="popover" data-trigger="hover"  data-original-title="Alert Volume: Medium" data-content="An alert volume of Medium indicates that you\'re likely to see one to two alerts per day in a typical organization, though this can vary substantially from one organization to another. It is recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">' + "Medium" + '</span>'
                    } else if (myshowcaseinfo['alertvolume'] == "High" || myshowcaseinfo['description'].match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/)) {
                        alertVolumeText += '<span class="dvPopover popoverlink" id="alertVolumetooltip" title="" data-placement="right" data-toggle="popover" data-trigger="hover" data-original-title="Alert Volume: High" data-content="An alert volume of High indicates that you\'re likely to see several alerts per day in a typical organization, though this can vary substantially from one organization to another. It is highly recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">' + "High" + '</span>'
                    } else if (myshowcaseinfo['alertvolume'] == "Very High" || myshowcaseinfo['description'].match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/)) {
                        alertVolumeText += '<span class="dvPopover popoverlink" id="alertVolumetooltip" title="" data-placement="right" data-toggle="popover" data-trigger="hover" data-original-title="Alert Volume: Very High" data-content="An alert volume of Very High indicates that you\'re likely to see many alerts per day in a typical organization. You need a well thought out high volume indicator search to get value from this alert volume. Splunk ES\'s Risk Framework is a starting point, but is probably insufficient given how common these events are. It is highly recommended that you either build correlation searches based on the output of this search, or leverage Splunk UBA with it\'s threat models to surface the high risk indicators.">' + "Very High" + '</span>'
                    } else {
                        console.log("Probably an error in grabbing the alert volume. Should be present.")
                    }
                }
                
                // check if analytic story exists
                // analytic stories have popover
                var analytic_stories = ""
                if (ourStories.length != 0) { 
                    analytic_stories = "<h2>" + "Analytic Story" + "</h2>"
                    // build each analytic story
                    let analytic_story_links = []
                    for ( i = 0; i < ourStories.length ; i++ ) {
                        // console.log(ourStories[i])
                        // console.log(ourStories[analytic_story])
                        var analytic_story_name = ourStories[i]['name']
                        var analytic_story_description = ourStories[i]['description']
                        var analytic_story_narrative = ourStories[i]['narrative']
                        // build the content in for the span
                        let content = "<h3>Description</h3><p>" + analytic_story_description.replace(/'/g, "").replace(/\n/g, "<br\>") + "</p>" + "<h3>Narrative</h3><p>" + analytic_story_narrative.replace(/'/g, "").replace(/\n/g, "<br\>").replace(/\\/g, "") + "</p>"
                        analytic_story_links.push("<span class='whatsthis analytic_story' data-toggle='popover' data-trigger='hover' data-placement='right' data-placement='right' data-html='true' title='" + analytic_story_name + "' data-content='" + content + "'>" + analytic_story_name + "</span>")
                    }
                    analytic_stories += analytic_story_links.join(", ")
                }

                // check if how to implement exists, add content
                // How to Implement can have 2 different keys, howToImplement OR how_to_implement AND sometimes includes html in the value. 
                var howToImplementText = ""
                var howToImplementHeader = ""
                var howToImplementBody = ""
                if ( myshowcaseinfo['howToImplement'] || myshowcaseinfo['how_to_implement'] ) { 
                    if ( myshowcaseinfo['howToImplement'] ) {
                        howToImplementHeader ="<h2>" + "How to Implement" + "</h2>"
                        howToImplementBody = myshowcaseinfo['howToImplement']
                    } else if ( myshowcaseinfo['how_to_implement'] ) {
                        howToImplementHeader ="<h2>" + "How to Implement" + "</h2>"
                        howToImplementBody = myshowcaseinfo['how_to_implement']
                    } else {
                        console.log("IDK. we failed to pull data from one of the howToImplement keys")
                    };
                    // some times it already comes wrapped in <p>, sometimes not. so we add the <p>
                    if ( !howToImplementBody.startsWith('<p>')) {
                        howToImplementBody = '<p>' + howToImplementBody + '</p>'
                    }
                    howToImplementText = howToImplementHeader + howToImplementBody
                }

                // check if known false positive exists
                // Known False Positives can have 2 different keys, knownFP OR known_false_positives AND sometimes includes html in the value.
                var known_false_positives = ""
                var known_false_positivesHeader = ""
                var known_false_positivesBody = ""
                if ( myshowcaseinfo['knownFP'] || myshowcaseinfo['known_false_positives'] ) { 
                    if ( myshowcaseinfo['knownFP'] ) {
                        known_false_positivesHeader = "<h2>" + "Known False Positives" + "</h2>"
                        known_false_positivesBody = myshowcaseinfo['knownFP']
                    } else if ( myshowcaseinfo['known_false_positives'] ) {
                        known_false_positivesHeader ="<h2>" + "Known False Positives" + "</h2>"
                        known_false_positivesBody = myshowcaseinfo['known_false_positives']
                    } else {
                        console.log("IDK. we failed to pull data from one of the known false positive keys")
                    };
                    // some times it already comes wrapped in <p>, sometimes not. so we add the <p>
                    if ( !known_false_positivesBody.startsWith('<p>')) {
                        known_false_positivesBody = '<p>' + known_false_positivesBody + '</p>'
                    }
                    known_false_positives = known_false_positivesHeader + known_false_positivesBody
                }

                // We're going to add a section to box1 to link to the correlation search in ES if it exists
                var correlation_search = ""
                if ( typeof myshowcaseinfo['search_name'] != "undefined" && myshowcaseinfo['search_name'] != "" ) {
                    var search_name = myshowcaseinfo['search_name']
                    correlation_search += "<h2>" + "Notes" + "</h2>"
                    correlation_search += '<p>This exists in Enterprise Security as correlation search: <b>' + search_name + '</b></p><p></p>'
                    correlation_search += "<button class=\"btn btn-primary mlts-submit external\" id=\"schedule-alert-button\" title=\"\" data-toggle=\"tooltip\" data-original-title=\"This content already exists in Enterprise Security. Click to Edit.\"><a style=\"color: inherit;text-decoration: none;\" target=\"_blank\" href=\"\/app\/SplunkEnterpriseSecuritySuite\/ess_content_management?textFilter=" + search_name.replace(/ /g, "%20") + "\">Edit in Enterprise Security</a></button> ";
                }

                // box2 content:
                    // style = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 49%; min-width:305px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0>"
                    // BookmarkStatus                               not rendering
                    // DataAvailabilityStatus                       not rendering
                    // Stage                                        
                    // mitreText
                    // mitreTechniqueText
                    // mitreThreatGroupText
                    // killchainText
                    // cisText                                      not rendering
                    // technologyText                               not rendering
                    // datasourceText
                    // datamodelText                                not rendering
                    // security_content_fields["asset_type"]        not rendering
                    // security_content_fields["references"]        not rendering


                // All of the right side content gets added to THIS DIV
                var DivTable_Box2 = document.createElement('div');
                DivTable_Box2.style = 'overflow: hidden; padding: 10px; margin: 0px; width: 49%; min-width:305px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0';
                DivTable.appendChild(DivTable_Box2);
                
                var stage = ""
                if ( myshowcaseinfo['journey']) {
                    stage = "<h2 style=\"margin-bottom: 5px;\">Journey</h2><span style=\"margin-top: 0; margin-bottom: 15px;\"><a target=\"_blank\" class=\"external link drilldown-icon\" href=\"\/app\/Splunk_Security_Essentials\/journey?stage=" + myshowcaseinfo['journey'].replace(/Stage_/g, "") + "\">" + myshowcaseinfo['journey'].replace(/_/g, " ") + "</a></span> ";
                }

                // Get MITRE ATTCK Tactic data.
                // There is a difference in the Showcaseinfo.json that comes in the app and what is being downloaded at runtime. 
                // This just means the app updated the showcaseinfo.json data. 
                // So now we have fields in every showcase for mitre tactic and its number
                // mitre_tactic: "TA0005|TA0001|TA0004|TA0003" mitre_tactic_display: "Defense Evasion|Initial Access|Privilege Escalation|Persistence"
                // if we error here, its most likely because the json is not updated and the data is not all there yet. look at what is available if we error
                // We can grab the missing info from here https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json

                // this is our string we put the whole mitre data into
                var mitreText = "";
                // look for tactic data
                if ( myshowcaseinfo['mitre_tactic'] && myshowcaseinfo['mitre_tactic_display'] ) {
                    let mitreTactic_Name = myshowcaseinfo['mitre_tactic_display'].split("|");
                    let mitreTactic_Number = myshowcaseinfo['mitre_tactic'].split("|");

                    // sometines the field starts with |, which results in the first value in the array to be "", which throws off generating data
                    if ( mitreTactic_Name[0] == "" ) {
                        mitreTactic_Name.shift();
                    }
                    if ( mitreTactic_Number[0] == "" ) {
                        mitreTactic_Number.shift();
                    }

                    // Remove "None" from list if its there
                    if (mitreTactic_Name.indexOf("None") >= 0) {
                        mitreTactic_Name.splice(mitreTactic_Name.indexOf("None"), 1);
                    }

                    // make sure these are not "None", sometimes there just is no mitre data for a showcase
                    if ( mitreTactic_Name.length > 0 ) {
                        // build the mitre tactic title section
                        mitreText = "<h2 style=\"margin-bottom: 5px;\">" + "MITRE ATT&CK Tactics" + "  (Click for Detail)</h2>"
                        // iterate over each mitre tactic and build html string
                        for (var i = 0; i < mitreTactic_Name.length; i++) {
                            // build popover tooltip data
                            let tooltip = mitreTactic_Number[i] + " - " + mitreTactic_Name[i]
                            // build the mitre tactic and append to string variable
                            mitreText += "<div id=\"mitre_override\" style=\"cursor: pointer\" data-toggle='tooltip' title='" + tooltip + "' mitre_tactic='" + mitreTactic_Number[i] + "' class=\"primary mitre_tactic_displayElements\"><a target=\"_blank\" href=\"\/app\/Splunk_Security_Essentials\/contents#mitre_tactic_display=" + mitreTactic_Name[i].replace(/ /g, "_") + "\">" + mitreTactic_Name[i] + "</a></div>";
                            // console.log(mitreText)
                        }
                        mitreText += "<br style=\"clear: both;\"/>"
                    } else {
                        console.log('No Mitre Tactic data. mitre_tactic_display key present, but it was "None".')
                    };
                } else {
                    console.log("No mitre tactic data found.")
                };
           
                // Get Mitre ATTCK Technique and Sub-Technique data
                // keys: "mitre_technique_display": "Network Service Discovery|Remote System Discovery", "mitre_technique": "T1021",
                // sub-technique keys: "mitre_sub_technique_display": "Remote Desktop Protocol", "mitre_sub_technique": "T1021.001",
                var mitreTechnique = "";
                // look for mitre technique data
                if ( myshowcaseinfo['mitre_technique'] && myshowcaseinfo['mitre_technique_display'] ) {
                    let mitreTechnique_Name = myshowcaseinfo['mitre_technique_display'].split("|");
                    let mitreTechnique_Number = myshowcaseinfo['mitre_technique'].split("|");

                    // sometines the field starts with |, which results in the first value in the array to be "", which throws off generating data
                    if ( mitreTechnique_Name[0] == "" ) {
                        mitreTechnique_Name.shift();
                    }
                    if ( mitreTechnique_Number[0] == "" ) {
                        mitreTechnique_Number.shift();
                    }

                    // Remove "None" from list if its there
                    if (mitreTechnique_Name.indexOf("None") >= 0) {
                        mitreTechnique_Name.splice(mitreTechnique_Name.indexOf("None"), 1);
                    }

                    // make sure these are not "None", sometimes there just is no mitre technique data for a showcase
                    if ( mitreTechnique_Name.length > 0 ) { 
                        // build the mitre technique title section
                        mitreTechnique = "<h2 style=\"margin-bottom: 5px;\">" + "MITRE ATT&CK Techniques" + "  (Click for Detail)</h2>"
                        // iterate over each mitre technique and build html string
                        for ( var i = 0; i < mitreTechnique_Name.length; i++ ) {
                            // build popover tooltip data
                            let tooltip = mitreTechnique_Number[i] + " - " + mitreTechnique_Name[i]
                            // build the mitre technique and append to string variable
                            mitreTechnique += "<div id=\"mitre_override\" style=\"cursor: pointer\" data-toggle='tooltip' title='" + tooltip + "' mitre_technique='" + mitreTechnique_Number[i] + "' class=\"primary mitre_technique_displayElements\"><a target=\"_blank\" href=\"\/app\/Splunk_Security_Essentials\/contents#mitre_technique_combined=" + tooltip.replace(/ /g, "_") + "\">" + mitreTechnique_Name[i] + "</a></div>";
                        }
                        // if no subtechnique we append the section's ending <br>
                        if ( typeof myshowcaseinfo['mitre_technique_display'] == "undefined" || myshowcaseinfo['mitre_technique_display'] == "" || myshowcaseinfo['mitre_technique_display'] == "None" ) {
                            mitreTechnique += "<br style=\"clear: both;\"/>"
                        };
                    } else {
                        console.log('No Mitre Technique data. mitre_technique_display key present, but it was "None".')
                    };
                } else {
                    console.log("No mitre technique data found.")
                }
                // Look for mitre sub-technique data
                if ( myshowcaseinfo['mitre_sub_technique_display'] && myshowcaseinfo['mitre_sub_technique'] ) {
                    let mitreSubTechnique_Name = myshowcaseinfo['mitre_sub_technique_display'].split("|");
                    let mitreSubTechnique_Number = myshowcaseinfo['mitre_sub_technique'].split("|");

                    // sometines the field starts with |, which results in the first value in the array to be "", which throws off generating data
                    if ( mitreSubTechnique_Name[0] == "" ) {
                        mitreSubTechnique_Name.shift();
                    }
                    if ( mitreSubTechnique_Number[0] == "" ) {
                        mitreSubTechnique_Number.shift();
                    }

                    // Remove "None" from list if its there
                    if (mitreSubTechnique_Name.indexOf("None") >= 0) {
                        mitreSubTechnique_Name.splice(mitreSubTechnique_Name.indexOf("None"), 1);
                    }

                    // make sure these are not "None",
                    if ( mitreSubTechnique_Name.length > 0 ) {
                        // build title if we did not already build it in the Technique search
                        if ( mitreTechnique == "") {
                            mitreTechnique = "<h2 style=\"margin-bottom: 5px;\">" + "MITRE ATT&CK Techniques" + "  (Click for Detail)</h2>"
                        }
                        // iterate over each mitre technique and build html string
                        for ( var i = 0; i < mitreSubTechnique_Name.length; i++ ) {
                            // build popover tooltip
                            let tooltip = mitreSubTechnique_Number[i] + " - " + mitreSubTechnique_Name[i]
                            // build mitre sub-technique and append to string variable
                            mitreTechnique += "<div id=\"mitre_override\" style=\"cursor: pointer\" data-toggle='tooltip' title='" + tooltip + "' mitre_sub_technique='" + mitreSubTechnique_Number[i] + "' class=\"primary mitre_technique_displayElements mitre_sub_technique_displayElements\"><a target=\"_blank\" href=\"\/app\/Splunk_Security_Essentials\/contents#mitre_technique_combined=" + tooltip.replace(/ /g, "_") + "\">" + mitreSubTechnique_Name[i] + "</a></div>";
                        }
                    }
                    mitreTechnique += "<br style=\"clear: both;\"/>"
                }

                // Get Mitre Attck Threat Group Data
                // Keys: "mitre_threat_groups": "FIN7|Aoqin Dragon|LuminousMoth|Tropic Trooper|Darkhotel|APT28|Turla|Gamaredon Group|Mustang Panda",
                var mitreThreatGroupText = ""
                // look for mitre threat group data
                if (typeof myshowcaseinfo['mitre_threat_groups'] != "undefined" && myshowcaseinfo['mitre_threat_groups'] != "" && myshowcaseinfo['mitre_threat_groups'] != "None" ) { 
                    let mitreThreatGroups = myshowcaseinfo['mitre_threat_groups'].split("|");

                    // sometines the field starts with |, which results in the first value in the array to be "", which throws off generating data
                    if ( mitreThreatGroups[0] == "" ) {
                        mitreThreatGroups.shift();
                    }
                    // Remove "None" from list if its there
                    if (mitreThreatGroups.indexOf("None") >= 0) {
                        mitreThreatGroups.splice(mitreThreatGroups.indexOf("None"), 1);
                    }

                    // build the mitre threat group title section
                    if (mitreThreatGroups.length > 0 && mitreThreatGroupText == "") { 
                        mitreThreatGroupText = "<h2 style=\"margin-bottom: 5px;\">" + "MITRE Threat Groups" + " (" + "Click for Detail" + ")</h2>"
                        // iterate over each mitre technique and build html string
                        for ( var i = 0; i < mitreThreatGroups.length; i++ ) {
                            mitreThreatGroupText += "<div div id=\"mitre_groups_override\" class=\"mitre_threat_groupsElements\"><a target=\"_blank\" href=\"\/app\/Splunk_Security_Essentials\/contents#mitre_threat_groups=" + mitreThreatGroups[i].replace(/ /g, "_") + "\">" + mitreThreatGroups[i] + "</a></div>";
                        }
                        mitreThreatGroupText += "<br style=\"clear: both;\"/>"
                    }
                }

                // Get CKC Data
                // Keys: "killchain": "Reconnaissance|Delivery",
                var killchainText = ""
                if (typeof myshowcaseinfo['killchain'] != "undefined" && myshowcaseinfo['killchain'] != "") {
                    let killchain = myshowcaseinfo['killchain'] ? myshowcaseinfo['killchain'].split("|") : [];
                    if (killchain.length > 0 && killchainText == "") {
                        killchainText = "<h2 style=\"margin-bottom: 5px;\">" + "Kill Chain Phases" + " <a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\" class=\"external drilldown-icon\" target=\"_blank\"></a></h2>"
                    }
                    let numAdded = 0;
                    for (var i = 0; i < killchain.length; i++) {
                        if (killchain[i] == "None") {
                            continue;
                        }
                        numAdded++;
                        killchainText += "<div class=\"killchain\">" + killchain[i] + "</div>"
                    }
                    killchainText += "<br style=\"clear: both;\"/>"
                    if (numAdded == 0) {
                        killchainText = ""
                    }
                }

                // Get Data Source info
                // Keys: "datasource": "Network Communication",
                var datasourceText = ""
                if (typeof myshowcaseinfo['datasource'] != "undefined" && myshowcaseinfo['datasource'] != "Other" && myshowcaseinfo['datasource'] != "") {
                    datasources = myshowcaseinfo['datasource'].split("|")
                    if (datasources.length > 0 && datasourceText == "") {
                        datasourceText = "<h2>Data Sources</h2>"
                    }
                    for (var i = 0; i < datasources.length; i++) {
                        var link = datasources[i].replace(/[^\w\- ]/g, "")
                        var description = datasources[i]
                        datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"\/app\/Splunk_Security_Essentials\/data_source?datasource=" + link + "\">" + description + "</a></div>"
                    }
                    datasourceText += "<br style=\"clear: both;\"/>"
                }

                // put all our variables in box2 variable
                var box1 = usecaseText + areaText + relevance + alertVolumeText + analytic_stories + howToImplementText + known_false_positives + correlation_search
                var box2 = stage + mitreText + mitreTechnique + mitreThreatGroupText + killchainText + datasourceText

                // add box2 to the page
                DivTable_Box1.insertAdjacentHTML("afterbegin", box1);
                DivTable_Box2.insertAdjacentHTML("afterbegin", box2);

                console.log("Done rendering page.")

                // The popover js logic
                /* console.log("inside ready function") */
                $("[data-toggle=tooltip]").tooltip({html: true})
                $("[data-toggle=popover]").popover({trigger: "hover", html: true, placement: "right"})


            } else {
                // We do not have an empty row on the page to append our data
                console.log("Error: No empty row found. Please create an empty row for this script to append data.")
                console.log("You can add a row by going to Edit > Source and then pasting the following in: <row><html></html></row>    before the last </form>")
            }

        }
    }
});