
var NB_UNITS_PER_PLAYER = 10;
//var UNITS_HEIGHT = 2.99;
var UNITS_HEIGHT = 3;// 4.4;
var TABLE_HEIGHT = 0.6;
var UNITS_Y = (UNITS_HEIGHT + TABLE_HEIGHT - 1) / 2;

var TEAM_A_COLOR = 0xFF1E14;
var TEAM_B_COLOR = 0x4107FF;

var gameManager;

function onLoad() {
    gameManager = new THREE.ATI_GameManager();
    gameManager.prepareGame();
    // Wait a bit for the sceneMaker to finish his job
    // ..and then go ahead with rendering...   ;-)
    setTimeout(function() {
        gameManager.startGame();
    }, 1000);
    gameManager.onGameReady();
}
