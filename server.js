// Import required modules

const express = require('express');
const fs = require('fs');
const path = require('path');

// Create an Express server instance
const server = express();

// Define the server port
const PORT = 3000;

// Generate a timestamp for the filename
const TimeStamp = new Date().toISOString().replace(/:/g, '-');
const fil = `${TimeStamp}.txt`;

// Create a file with the timestamp content
fs.writeFile(`./${fil}`, TimeStamp, {flag: 'w+'}, (err) => {
    if(err){
        console.log(err);
    }else{
        console.log('file added successfully');
    }
});

// Handle GET requests to the root endpoint
server.get('/', (req, res) => {
    fs.readFile(`./${fil}`, 'utf-8', (err, data) => {
        if(err) throw err;
        console.log(data);
        res.send(data);
    });
});
 
// Start the server and log the running message
server.listen(PORT, () => {
    console.log(`serve running at http://localhost:${PORT}`);
});

