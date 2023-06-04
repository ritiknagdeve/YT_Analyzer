const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");

const link = 'https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj';
let cTab;


(async function(){
    try {
        let browserOpen = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        })

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(link);

        await cTab.waitForSelector(".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28", {visible:true});
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText},".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28");
        // console.log(name);

        let allData = await cTab.evaluate(getData , ".byline-item.style-scope.ytd-playlist-byline-renderer")

        console.log(name , allData.noOfVideos, allData.noOfViews);

        let TotalVideos = allData.noOfVideos.split(" ")[0];
        
        let currentVideos = await getCVideosLength();
        console.log(currentVideos);
        
        while(TotalVideos - currentVideos >= 20){
        // while(currentVideos < TotalVideos){

            await scrollToBottom();
            currentVideos = await getCVideosLength();
        }
        let finalList = await getStats();
        // console.log(finalList);

        let pdfDoc = new pdf; 
        pdfDoc.pipe(fs.createWriteStream("play.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();


    } catch (error) {
        console.error('An error occurred:', error);
    }
})();


function getData(selector){
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText;

    return {
        noOfVideos,
        noOfViews
    }
}

async function getCVideosLength(){
    
    let length = await cTab.evaluate(getLength , "#container>#thumbnail .yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail");
    return length;
}

function getLength(durationSelect){
    let durationElem = document.querySelectorAll(durationSelect);
    return durationElem.length;
}

async function scrollToBottom(){
    await cTab.evaluate(goToBottom)
    function goToBottom(){
        window.scrollBy(0, window.innerHeight);
    }
}
async function getStats(){
    let list = await cTab.evaluate(getNameAndDuration ,"#video-title", "#text.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;
}

function getNameAndDuration(videoselector , durationSelector){
    let videoElem = document.querySelectorAll(videoselector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for(let i = 0; i < durationElem.length; i++){
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;

        currentList.push({videoTitle, duration});

    }
    return currentList;
}