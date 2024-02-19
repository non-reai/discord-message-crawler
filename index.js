import fetch from 'node-fetch'
import fs from 'fs'

const CHANNEL_ID = "" //channel id
const STARTING_MESSAGE_ID = "" //the starting message
const DISCORD_TOKEN = "" // discord token here

let lastCrawledMessage = ""
let messagesCrawled = 0

async function crawlChannel(messageId) {
	const response = await fetch(`https://discord.com/api/v9/channels/${CHANNEL_ID}/messages?before=${messageId}&limit=100`, {
		"headers": {
			"authorization": DISCORD_TOKEN,
		},
		"method": "GET",
	});

    if (response.status == "429") {
        console.log("ratelimited "+Number(response.headers.get("X-RateLimit-Reset-After")) * 1000)
        setTimeout(()=>{
            crawlChannel(messageId)
        }, Number(response.headers.get("X-RateLimit-Reset-After")) * 1000 + 1000)
    }
	
	const parsedMessages = await response.json()
	
    if (messagesCrawled == 0) {
        fs.writeFileSync("messages.json", "[")
    } 

    parsedMessages.forEach((element, index) => {
        messagesCrawled++
        fs.appendFileSync("messages.json","\n"+JSON.stringify(element,null,2))
        if (!(parsedMessages.length < 100) || !(index == parsedMessages.length - 1)) {
            fs.appendFileSync("messages.json",",")
        }
        lastCrawledMessage = element.id
    });

    if (parsedMessages.length < 100) {
        fs.appendFileSync("messages.json","\n]")
        return
    }

    console.log(parsedMessages)

    setTimeout(()=>{
        crawlChannel(parsedMessages[parsedMessages.length - 1].id)
    },250)
}

crawlChannel(STARTING_MESSAGE_ID)

process.on('SIGINT', function() {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)" );
    console.log("Messages Crawled: "+messagesCrawled)
    console.log("Last Crawled Message Id: "+lastCrawledMessage)

    process.exit();
})
