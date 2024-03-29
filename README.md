# COMEM Beer API

This is an academic project developed in order to deepen the basics of RESTful APIs and their implementation, for a latter mobile application development.

The application is made by [Nathan Zweifel](https://github.com/zweifelna), [Robin Zweifel](https://github.com/zweiro) and [Steve Mettraux](https://github.com/Smettraux).

The application is built with the following technologies:

## How to test ?

Clone the repository:

 -- with ssh:
```bash
git clone git@github.com:zweifelna/beer-api.git
```

  -- with https:
```bash
git clone https://github.com/zweifelna/beer-api.git
```

Install the dependencies:
```bash
cd beer-api
npm install
```

then start the server:
```bash
npm run dev
```

For the purpose of testing, you can [get postman here](https://www.getpostman.com/).

Navigate to [localhost:3000](http://localhost:3000/api/v1).
Now, with the use of postman, you can test the API, following our [API documentation](https://comem-beer-api.herokuapp.com/api/v1/apidoc/).


## Deployed API journey example.

1. Follow [this link](https://comem-beer-api.herokuapp.com/api/v1/) to see the index of the application.

2. From the index, you must first navigate to the [users](https://comem-beer-api.herokuapp.com/api/v1/user/) endpoint, and create a new user.

3. Then, you may navigate to the [beers](https://comem-beer-api.herokuapp.com/api/v1/beer/) endpoint, and check the list of beers. You can also create a new beer, or [add a comment to an existing beer](https://comem-beer-api.herokuapp.com/api/v1/beer/6192d43002b8b72c117c41a8/comment).

## WebSocket

We implemented a WebSocket server, which allows you to receive messages from the server, such as when a user logs in, and when a new comment is added to a beer.

You will recieve messages in a format that is similar to the one below:
```json
{
  "action performed" : "beer_comment_added",
  "user who commented" : "userId",
  "beer commented on" : "beerId",
}
```

### Connect the WS server:

In postman, you can connect the WS server by adding the following address: `ws:comem-beer-api.herokuapp.com`, and then click on the `Connect` button.
You can then see the messages in the console.
