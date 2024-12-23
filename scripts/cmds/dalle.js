const axios = require('axios');
const path = require('path');
const fs = require('fs');

module.exports = {
    config: {
        name: "dalle",
        version: "1.5.B",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: "Generate images using dalle",
        longDescription: "Generate images using GPT AI model with custom prompts",
        category: "ai",
        guide: "{pn} [prompt]"
    },

    onStart: async function ({ api, event, args, message, usersData }) {
        const prompt = args.join(" ");
        if (!prompt) {
            return message.reply("Please provide a prompt to generate an image.");
        }

        const processingMessage = await message.reply("Processing your image request, please wait...");

        try {
            // Get the image URL from the API
            const response = await axios.get(`https://priyansh-ai.onrender.com/imagine?&prompt=${encodeURIComponent(prompt)}`);
            const imageUrl = response.data.url;

            if (!imageUrl) {
                if (processingMessage?.messageID) {
                    message.unsend(processingMessage.messageID);
                }
                return message.reply("Failed to generate image. Please try again.");
            }

            // Create temp directory if it doesn't exist
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Generate a unique filename
            const imageFileName = path.join(tempDir, `dalle_${Date.now()}.webp`);

            // Download the image
            const imageResponse = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'arraybuffer'
            });

            // Save the image to temp directory
            fs.writeFileSync(imageFileName, imageResponse.data);

            // Get user data
            const userData = await usersData.get(event.senderID);
            const userName = userData.name;
            const title = `Here Is Your Requested Picture Ms/Mr ${userName}`;

            // Send the image
            if (processingMessage?.messageID) {
                message.unsend(processingMessage.messageID);
            }

            await message.reply({
                body: title,
                attachment: fs.createReadStream(imageFileName)
            });

            // Clean up: Delete the temporary file
            setTimeout(() => {
                try {
                    if (fs.existsSync(imageFileName)) {
                        fs.unlinkSync(imageFileName);
                    }
                } catch (err) {
                    console.error("Error deleting temporary file:", err);
                }
            }, 5000); // Delete after 5 seconds

        } catch (error) {
            console.error("Error in dalle command:", error);
            if (processingMessage?.messageID) {
                message.unsend(processingMessage.messageID);
            }
            return message.reply("An error occurred while generating the image. Please try again later.");
        }
    }
};