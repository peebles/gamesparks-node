# Example

This simple example script demonstrates how to autenticate with a game username and
password, then use the SDK to get the user's account details.

This example requires a `config.json` file be present in this directory.  This file
must contain your Gamesparks apiKey and "server" secret.  The "server" secret can be
found in the Gamesparks web app; Overview page, click the padlock in the top right. 
You want the "Server API Secret".

The config file should look like this:

```javascript
{
    "gameApiKey": "xxxxxxxxxxxxxx",
    "secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "testUser": {
	"username": "testUser",
	"password": "123"
    }
}
```

The `testUser` information should be the name of an existing user in your game
database.

This example connects to the "preview" server.

To run this example, create the `config.json` file as described above and run

```bash
npm install async
node ./example/account-details.js
```


