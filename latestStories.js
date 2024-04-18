const http = require("http");
const https = require("https");
const fs = require('fs');
const { JSDOM } = require('jsdom');

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
        // Extract latest stories using jsdom
        const latestStories = extractLatestStories(data);

        // Send JSON response with the extracted data
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(latestStories));
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

// Function to extract latest stories using jsdom
const extractLatestStories = (htmlString) => {
  // Initialize an array to store the extracted stories
  const latestStories = [];

  // Create a DOM-like environment using jsdom
  const dom = new JSDOM(htmlString);
  const document = dom.window.document;

  // Select the container element for latest stories
  const container = document.querySelector('.most-popular-feed__item-container');

  // If container exists, iterate over each story item and extract data
  if (container) {
    const items = container.querySelectorAll('.most-popular-feed__item');
    items.forEach((item) => {
      const titleElement = item.querySelector('.most-popular-feed__item-headline');
      const linkElement = item.querySelector('a');
      if (titleElement && linkElement) {
        const title = titleElement.textContent.trim();
        const link = linkElement.getAttribute('href');
        latestStories.push({ title, link });
      }
    });
  }

  return latestStories;
};

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Route the request to appropriate handler
  handleTimeStoriesRequest(req, res);
});

// Define the port to listen on
const PORT = 3000;
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
