# Spunk_SSE_Integration
Pulls showcase content from Splunk Security Essentials into your own dashboards

This repo contains js and css files that will pull the showcase and mitre information from Splunk Security Essentials (SSE) and render it below your visualizations. The js script will pull the security content from SSE and render it below the visualizations in your dashboard. I find that the SSE App does not proivde a good place to hold many of the SSE visualizations. So I build the searches in another Splunk App and use these scripts to pull the showcase content below my dashboard panels. 

In order for this scrip to work you need to do the following:
1. Name your dashboard in the same format as the SSEShowcaseInfo json. For instnace: basic_scanning
2. Add `<form version="1.1" script="runPageScript_SSOC.js" stylesheet="ssoc_sse.css">` to the top of the dashboard page
3. Add an empty row containg a html tag below your panels. `<row><html></html></row>` 


You can find all of the SSE content in https://[YOUR SPLUNK SERVER]/en-US/splunkd/__raw/services/SSEShowcaseInfo?locale=en-US. Use this json to find the SSE showcase you want to pull data from and name your dashboard in the same manner as it is stored in the json (ie: remote_desktop_network_bruteforce)