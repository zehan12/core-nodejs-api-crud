// curl "http://localhost:4100"

// internal module imports
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// variable
const port = 4100;
const hostname = "127.0.0.1";
const dataDir = path.join(__dirname, "/data/");

console.log(dataDir);
// handler function
const handler = (req, res) => {
  //* checking requested method and url
  console.log(`req.method:${req.method} & req.url:${req.url}`);

  var body = "";
  req.on("data", function (data) {
    body += data;
    console.log("A chunk of data has arrived in buffer format: ", data);
    // Too much POST data, kill the connection!
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6) {
      // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
      req.connection.destroy();
    }
    if (body.length > 1e7) {
      // 10MB
      res.writeHead(413, "Request Entity Too Large", {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ error: "Request Entity Too Large" }));
    }
  });

  req.on("end", () => {
    // captured data in stringified JSON format
    const data = body;
    console.log(`Capture data in Stringified JSON format: ${data}`);

    /*
|--------------------------------------------------------------------------
|  // CREATE
|--------------------------------------------------------------------------
|  // @route     POST /api/users
|  // @desc      This route will create json file on user's username
|  // @param     { Object } req - Request object
|  // @param     { Object } res - Response object
|  // @property  { Object } .......
|  // @returns   { JSON } - A JSON object representing the status and message

 curl --header "Content-Type: application/json" \
      --request POST \
      --data '{"name":"zehan","email":"livelovezehan@gmail.com","username":"zehan12","bio":"software engineer"}' \
      http://localhost:4100/api/users
*/

    // Check for POST request coming on '/api/users'
    if (req.method === "POST" && req.url === "/api/users") {
      try {
        // Parse data
        const userData = JSON.parse(data);
        console.log("Parsed Data:", userData);
        const username = userData.username;

        // Check whether this username exists in the users directory or not
        // We have to create a file using username + append .json to create a proper file
        // wx flag ensures that given username.json should not already exist in users directory, otherwise throws an error
        fs.open(dataDir + username + ".json", "wx", (err, fd) => {
          // - fs.open(path, flags, [mode], callback)
          //   - path (String): The path to the file to be opened.
          //   - flags (String): The flags to specify the file system operation:
          //     - "wx" stands for write-exclusive, which means the file should not exist.
          //   - [mode] (Number, optional): Permissions for the file (only used on file creation).
          //   - callback (Function): A callback function that is called when the operation completes.
          //     - err (Error): If an error occurs, this parameter holds the error object.
          //     - fd (Number): If successful, this parameter holds the file descriptor for the opened file.
          if (err) {
            console.error(err.message);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          } else {
            // fd is pointing to the newly created file inside the users directory
            // Once the file is created, we can write content to the file
            // Since `userData` already contains the JSON data, we can use it for writing to the file

            // Now, let's break down the `fs.writeFile` function:

            // `fd` is the file descriptor pointing to the newly created file
            // `data` is the JSON data to be written to the file

            fs.writeFile(fd, data, (err) => {
              if (err) {
                console.error(err.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              } else {
                // If no error occurred during file write, close the file

                // If no error occurred during file write, close the file

                // Now, let's break down the `fs.close` function:

                // `fd` is the file descriptor pointing to the file to be closed
                fs.close(fd, (err) => {
                  if (err) {
                    console.error(err.message);
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: err.message }));
                  } else {
                    // Send a success response to the client
                    console.log(`${username} successfully created`);
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        success: `${username} successfully created`,
                      })
                    );
                  }
                });
              }
            });
          }
        });
      } catch (parseError) {
        // Handle JSON parsing error
        console.error("JSON Parsing Error:", parseError.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }
    }
  });
};

http
  .createServer(handler)
  .listen(port, hostname)
  .on("listening", () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
