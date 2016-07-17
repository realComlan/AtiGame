# AtiGame: An African traditional game of strategy.

This small javascript software is intended to bring the famous Ati Game to the computer. 

# What is this game, huh?
Ati is an African traditional game, which is played on a board. It's designed for two players at maximum.
Each player is given a set of units that he manage to align in order to win.

# Project file structure

- AtiGame/public_html/assets/js/GameLib.js: This is the file containing most of the game logic
- AtiGame/public_html/assets/js/Game.js: This file is just the facade. It makes use of the objects
  declared in ./GameLib.js. It is the file which contains the onLoad() method that the index.html wil call
