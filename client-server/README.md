# Client/Server

There are two scripts in this directory: "server.js" and "client.js".  The idea here
is to launch the server, which listens on a localhost port for commands sent to it
by the client.  The server connects to Gamesparks and acts as both a sender and a listener
so it may receive asynchronious messages from the Gamesparks server.  The server will
listen on the local port using a small HTTP library for various commands sent to
it by the client.

The client can (1) authenticate an existing Gamesparks user and then (2) send `LogEventRequests`
on behalf of that user.  It can then authenticate another user and send `LogEventRequests` on
behalf of that user or the previous user.  The client can also send arbitrary request types with
arbirary data as well, so you can do just about anything the Gamesparks test harness lets you do.

As an example:

```bash
# authenticate player1
node ./client-server/client.js --auth --username player1 --password 123

# execute a cloud-code event as player1
node ./client-server/client.js --username player1 --event JoinRoomById --data '{"id":{"$oid": "573b87051474e704c7e5e82f"}}'

# authenticate another user
node ./client-server/client.js --auth --username player2 --password 456

# and execute a cloud-code event for that user
node ./client-server/client.js --username player1 --event JoinRoomById --data '{"id":{"$oid": "573b87051474e704c7e5e82f"}}'

# and another event for player1
node ./client-server/client.js --username player1 --event LeaveRoom --data '{"id":{"$oid": "573b87051474e704c7e5e82f"}}'

# and for player2
node ./client-server/client.js --username player2 --event LeaveRoom --data '{"id":{"$oid": "573b87051474e704c7e5e82f"}}'

# register a new user
node ./client-server/client.js --type RegistrationRequest --data '{"displayName": "player3", "userName": "player3", "password":"789"}'

# authenticate this new user
node ./client-server/client.js --auth --username player3 --password 789

# and execute a cloud-code function
node ./client-server/client.js --username player3 --event JoinRoomById --data '{"id":{"$oid": "573b87051474e704c7e5e82f"}}'
```

If any Gamesparks messages are sent from Gamesparks to any one of the authenticated users on the server, the server will
receive the messages and display them on the console.

When you exit the server and restart it, you must re-authenticate the users you wish to send `LogEventRequests` for.  That
information is kept in the server's memory and is lost when the server exists.

## Config

The server requires a `config.json` file be present in this directory.  This file
must contain your Gamesparks apiKey and "server" secret.  The "server" secret can be
found in the Gamesparks web app; Overview page, click the padlock in the top right. 
You want the "Server API Secret".

The config file should look like this:

```javascript
{
    "gameApiKey": "xxxxxxxxxxxxxx",
    "secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Detailed Usage

```bash
node ./client-server/server.js [port]
```

The `port` is optional and defaults to 8080.

There are three ways you can run the client:

```bash
node ./client-server/client.js [ --host URL ] --auth  --username USERNAME --password PASSWORD
node ./client-server/client.js [ --host URL ] --event EVENT-KEY [ --username USERNAME ] --data JSON-STRING **OR** --file JSON-FILE 
node ./client-server/client.js [ --host URL ] --type REQUEST-TYPE [ --username USERNAME ] --data JSON-STRING **OR** --file JSON-FILE
```

The `host` is optional and defaults to "http://localhost:8080".

The `--auth` form of the command line is to authenticate a Gamesparks user.  You must do this before executing any cloud-code functions
that expect to get the calling user with `Spark.getPlayer()`.  You can authenticate as many users as you need and identify them in
calls to the `--event` form with `--username`.

The `--event` form of the command line is a short cut for calling cloud-code functions.  `EVENT-KEY` is the short name of the cloud-code
function to call.  `--username` is optional.  If specified the server.js will use `USERNAME` to look up the credentials of a previously
authenticated user.  If it is not specified, it will default to the last authenticated user.  You can then specify either `--data` with
a JSON string or you can specify `--file` with a **full pathname** to a JSON formatted file that will be parsed and sent as the data to
the cloud-code function.

The `--type` form of the command line exists so you can send any arbitrary request to the Gamesparks server.  You could in fact use
this form to send LogEventRequests instead of the `--event` form, its just a little harder:

```bash
node ./client-server/client.js --type LogEventRequest --data '{"eventKey": "JoinRoom", "id":{"$oid": "573b87051474e704c7e5e82f"}}'
```

