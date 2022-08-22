[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)

[![RuneJS](https://i.imgur.com/QSXNzwC.png)](https://github.com/runejs/)

# Webclient

A browser-based game client written with TypeScript, React, and ThreeJS.

This project is very much an early work-in-progress and is not able to be used to log into the game at this time. Please use the existing [Java Game Client](https://github.com/runejs/refactored-client-435) to log into the [RuneJS game server](https://github.com/runejs/server).

Running the webclient requires the filestore HTTP server to first be running with a valid filestore index. 
Checkout the [`kiko/file-system` branch of the filestore repository](https://github.com/runejs/filestore/tree/kiko/file-system) and run the command `npm run index -- --build 435` to index the 435 game cache, then run `npm run http:js5` to load the game cache HTTP server.
