const http = require("http");
const https = require("https");
const fs = require('fs');

// URL of the website we want to fetch
const url = "https://time.com/";

// Function to handle requests for fetching time stories
const handleTimeStoriesRequest = (req, res) => {
  // Check if the request method is GET and the URL is "/getTimeStories"
  if (req.method === "GET" && req.url === "/getTimeStories") {
    // Make a GET request to the specified URL
    https.get(url, (response) => {
      let data = "";

      // Accumulate data as it is received
      response.on("data", (chunk) => {
        data += chunk;
      });

      // When all data has been received
      response.on("end", () => {
        // Call the function to extract data manually
        const array = extractStories(data);

        // Limit the response to the first 6 stories
        const responseData = array.slice(0, 6);
        // Send JSON response with the extracted data
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseData));
      });
    })
      // Handle errors during the request
      .on("error", (error) => {
        console.error(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      });
  } else {
    // If the request does not match "/getTimeStories", handle as default request
    handleDefaultRequest(req, res);
  }
};

// Function to handle default requests
const handleDefaultRequest = (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    // Serve the index.html file for the root URL
    serveStaticFile('index.html', res);
  } else {
    // Default case for any other routes
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
};

// Function to serve static files
const serveStaticFile = (filename, res) => {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      // If there's an error reading the file, send 500 Internal Server Error
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      // Send the contents of the file
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
};

// Function to manually extract stories from HTML string
const extractStories = (html) => {
  const array = [];
  let currentIndex = 0;

  while (true) {
    // Find the index of the next story
    const startIndex = html.indexOf('<li class="latest-stories__item">', currentIndex);
    if (startIndex === -1) {
      console.log("No more stories found, exiting loop");
      break; // No more stories found, exit loop
    }

    // Find the index of the closing tag for the current story
    const endIndex = html.indexOf('</li>', startIndex);
    if (endIndex === -1) {
      console.log("Closing tag </li> not found, exiting loop");
      break; // No end tag found, exit loop
    }

    // Extract the content of the current story
    const storyContent = html.slice(startIndex, endIndex + '</li>'.length);
    console.log("Extracted story content:", storyContent);

    // Find the title and link within the story content
    const titleStartIndex = storyContent.indexOf('<h3 class="latest-stories__item-headline">');
    const titleEndIndex = storyContent.indexOf('</h3>', titleStartIndex);
    const title = storyContent.slice(titleStartIndex + '<h3 class="latest-stories__item-headline">'.length, titleEndIndex);
    console.log("Extracted title:", title);

    const linkStartIndex = storyContent.indexOf('<a href="');
    const linkEndIndex = storyContent.indexOf('">', linkStartIndex);
    const link = 'https://time.com' + storyContent.slice(linkStartIndex + '<a href="'.length, linkEndIndex);
    console.log("Extracted link:", link);

    array.push({ title: title.trim(), link });
    currentIndex = endIndex + '</li>'.length; // Move currentIndex to the end of the current story
  }

  return array;
};


// Create an HTTP server
const server = http.createServer((req, res) => {
  // Route the request to appropriate handler
  handleTimeStoriesRequest(req, res);
});

// Define the port to listen on
const PORT = 3001;
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
