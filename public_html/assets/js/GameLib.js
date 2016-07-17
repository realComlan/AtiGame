
/* global sceneMaker, THREE, TWEEN, Infinity, TEAM_B_COLOR, TEAM_A_COLOR, UNITS_HEIGHT, NB_UNITS_PER_PLAYER, UNITS_Y */

/**
 // *********************************************************
 NOTE : Three.js'core file has been hacked at line 7539...
 for the purpose of this game...
 
 Comment the instruction...
 // if ( object.visible === false ) return;
 ...if that file is replaced...     ;-)
 
 // **********************************************************
 
 */

// ***********************
// ATI *** PACKAGE * MONDE
// ***********************

/**
 * @author todeale@BrainSploit
 *
 * ATI_Position
 * 
 * Each object of this class represents an intersect point on the
 * game board on which the players can place their units..
 *
 * Each position must know its neighbors which are the other positions
 * to which the player can move his unit from this one
 *
 * ;-)
 */
THREE.ATI_Position = function (point, neighbors) {
    this.type = 'ATI_Position';

    this.free = true;
    this.neighbors = (neighbors !== undefined) ? neighbors : [];
    this.point = (point !== undefined) ? point : new THREE.Vector3(0, 0, 0);
};

THREE.ATI_Position.prototype = {
    constructor: THREE.ATI_Position,
    getNeighbors: function () {

        return this.neighbors;
    },
    setNeighbors: function (neighbors) {

        this.neighbors = neighbors;
    },
    copy: function (source) {

        this.neighbors = source.neighbors;
        this.free = source.free;

        return this;
    },
};

/**
 * @author todeale@BrainSploit
 *
 * ATI_Unit
 * 
 *
 * ;-)
 */
THREE.ATI_Unit = function (position, owner, mesh) {

    this.type = 'ATI_Unit';

    this.position = position;
    this.owner = owner;
    this.mesh = mesh;
    this.frozen = false;
};

THREE.ATI_Unit.prototype = {
    constructor: THREE.ATI_Unit,
    copy: function (source) {

        THREE.ATI_Element.prototype.copy.call(this, source);

        this.owner = source.owner;
        this.mesh = source.mesh;
        this.frozen = source.frozen;

        return this;
    },
    toJSON: function (meta) {

        var data = THREE.Object3D.prototype.toJSON.call(this, meta);

        data.object.owner = this.owner;
        data.object.mesh = this.mesh;
        data.object.frozen = this.frozen;

        return data;
    }
};

/**
 * @author todeale@BrainSploit
 *
 *
 * ;-)
 */
THREE.ATI_Player = function (name, units) {

    this.type = 'ATI_Player';

    this.name = name;
    this.units = units;
    this.hasRoomToPlay = true;
    this.nbUnitsLost = 0;
};

THREE.ATI_Player.prototype = {
    constructor: THREE.ATI_Player,
    copy: function (source) {

        THREE.ATI_Element.prototype.copy.call(this, source);

        this.name = source.name;
        this.units = source.units;
        this.hasRoomToPlay = true;
        this.nbUnitsRemaining = source.nbUnitsRemaining;

        return this;
    },
    toJSON: function (meta) {

        var data = THREE.Object3D.prototype.toJSON.call(this, meta);

        data.object.name = this.name;
        data.object.units = this.units;
        data.object.nbUnitsRemaining = this.nbUnitsRemaining;

        return data;
    }
};


// ***********************
// ATI *** PACKAGE * RULES
// ***********************

/**
 * @author todeale@BrainSploit
 *
 *
 * ;-)
 */
THREE.ATI_GameManager = function () {

    Object.call(this);

    gameManager = this;

    this.type = 'ATI_GameManager';

    this.state = 'PREPARING'; // PREPARING | STARTING | SETTLING | PLAYING | MOVING_UNIT | FINISHING_ENEMY | PAUSED | STOPPING | GAME_FINISHED
    this.toleranceSpheres = [];
    this.movingUnit = null;

    // First, we need to initialize the players
    this.players = {
        redPlayer: new THREE.ATI_Player("red.player"),
        bluePlayer: new THREE.ATI_Player("blue.player")
    };
    // ...then the units...    :-|
    this.units = {
        redUnits: [],
        blueUnits: [],
        nbRedUnitsPlaced: 0,
        nbBlueUnitsPlaced: 0
    };

    for (var i = 0; i < NB_UNITS_PER_PLAYER; i++) {
        var redUnit = new THREE.ATI_Unit(null, this.players.redPlayer, null);
        var blueUnit = new THREE.ATI_Unit(null, this.players.bluePlayer, null);

        this.units.redUnits.push(redUnit);
        this.units.blueUnits.push(blueUnit);
    }

    this.players.redPlayer.units = this.units.redUnits;
    this.players.bluePlayer.units = this.units.blueUnits;

    this.currentPlayer = this.players.redPlayer;
    this.sceneMaker = new THREE.ATI_SceneMaker();

    var isRedPlaying = gameManager.currentPlayer.name === "red.player";
    gameManager.rotate_sphere_A_Y = isRedPlaying ? 0.25 : 0;
    gameManager.rotate_sphere_B_Y = 0.25 - gameManager.rotate_sphere_A_Y;

    gameManager.chrono = new THREE.Clock();
    gameManager.chrono.start();
    gameManager.CLICK_ECART = 5;
};

THREE.ATI_GameManager.prototype = {
    constructor: THREE.ATI_GameManager,
    copy: function (source) {

        gameManager.players = source.players;
        gameManager.units = source.units;
        gameManager.currentPlayer = source.currentPlayer;

        return gameManager;
    },
    toJSON: function (meta) {

        var data = THREE.Object3D.prototype.toJSON.call(this, meta);

        data.object.players = this.players;
        data.object.units = this.units;
        data.object.currentPlayer = this.currentPlayer;

        return data;
    },
    prepareGame: function () {
        gameManager.state = 'PREPARING';
        sceneMaker.prepareGame(gameManager.units);
        gameManager.strategicVerts = gameManager.sceneMaker.getStrategicVertices();
        sceneMaker.registerListeners();
    },
    startGame: function () {
        gameManager.state = 'STARTING';
        gameManager.sceneMaker.startGame();

        function testPlacement() {
            gameManager.units.redUnits[0].mesh.visible = true;
            gameManager.units.redUnits[1].mesh.visible = true;
            gameManager.units.blueUnits[0].mesh.visible = true;
            gameManager.units.blueUnits[1].mesh.visible = true;

            gameManager.performUserRequest(gameManager.units.redUnits[0], gameManager.strategicVerts[0], gameManager.strategicVerts[0].neighbors[0]);
            gameManager.performUserRequest(gameManager.units.redUnits[1], gameManager.strategicVerts[3], gameManager.strategicVerts[3].neighbors[0]);
            gameManager.performUserRequest(gameManager.units.blueUnits[0], gameManager.strategicVerts[12], gameManager.strategicVerts[12].neighbors[0]);
            gameManager.performUserRequest(gameManager.units.blueUnits[1], gameManager.strategicVerts[20], gameManager.strategicVerts[20].neighbors[0]);
        }
        
        function initPlacements() {
            gameManager.state = 'SETTLING';
            // First we show  the prompt page...
            // TODO
            // ...then, we init placements
            sceneMaker.redSphere.position.set(10, 2, 0);
            sceneMaker.blueSphere.position.set(-10, 2, 0);

            sceneMaker.redSphere.visible = true;
            sceneMaker.blueSphere.visible = true;

            for (var i in gameManager.strategicVerts) {
                var geometry = new THREE.SphereBufferGeometry(0.75);
                var material = new THREE.MeshPhongMaterial({transparent: true});

                var sphere = new THREE.Mesh(geometry, material);
                sphere.position.x = gameManager.strategicVerts[i].point.x;
                sphere.position.y = gameManager.strategicVerts[i].point.y;
                sphere.position.z = gameManager.strategicVerts[i].point.z;
                sphere.visible = false;
                gameManager.toleranceSpheres.push(sphere);
                sceneMaker.scene.add(sphere);
            }
            gameManager.cubeAdded = false;
        }
        
        function chooseBeginner() {
        }
        
        function cleanMemory() {
            delete sceneMaker.prepareGame;
            delete sceneMaker.startGame;
            delete sceneMaker.getStrategicVertices;
            delete gameManager.prepareGame;
            delete gameManager.startGame;
        }

        // testPlacement();
        initPlacements(); // TODO :-|
        chooseBeginner(); // TODO :-|
        cleanMemory();    // TODO :-|
//        gameManager.state = 'PLAYING';
    },
    onGameReady: function () {
    },
    stopGame: function () {
        gameManager.state = 'STOPPING';
    },
    endGame: function () {
    },
    update: function () {
//        if (gameManager.units.nbRedUnitsPlaced < NB_UNITS_PER_PLAYER
//                || gameManager.units.nbBlueUnitsPlaced < NB_UNITS_PER_PLAYER) {
//            gameManager.state = 'SETTLING';
//        }
        var isRedPlaying = gameManager.currentPlayer.name === "red.player";
        if (gameManager.state === 'GAME_FINISHED') {
            sceneMaker[isRedPlaying ? 'redSphere' : 'blueSphere'].position.y += 2 + Math.cos(gameManager.chrono.elapsedTime);
        } else {
            sceneMaker.redSphere.rotation.y += gameManager.rotate_sphere_A_Y;
            sceneMaker.blueSphere.rotation.y += gameManager.rotate_sphere_B_Y;
            //sceneMaker[isRedPlaying ? 'redSphere' : 'blueSphere'].position.y = 2 + 2 * Math.cos(gameManager.chrono.elapsedTime);
        }
        if (sceneMaker.autoRotating) {
            sceneMaker.scene.rotation.y += 0.02;
        }
    },
    moveUnitTo: function (unit, position) {
        unit.position = position;
        new TWEEN.Tween(unit.mesh.position).to(
                {
                    x: position.point.x,
                    y: UNITS_Y,
                    z: position.point.z
                }, 300
                /*  :-o */).easing(TWEEN.Easing.Quadratic.In).start();
    },
    isWinningMove: function (unit) {
        var step = sceneMaker.squaresStep;
        var movedTo = unit.position;

        function markWinningPositions(points) {
//            gameManager.state = 'MOVING_UNIT';

            var isRedPlaying = gameManager.currentPlayer.name === "red.player";
            var team = isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls';
            var i = sceneMaker[team].nbUsed;

            var ball0 = sceneMaker[team].balls[i];
            var ball1 = sceneMaker[team].balls[i + 1];
            var ball2 = sceneMaker[team].balls[i + 2];

            sceneMaker[team].nbUsed = (sceneMaker[team].nbUsed + 3) % 6;

            ball0.position.x = points[0].x;
            ball0.position.y = points[0].y + UNITS_HEIGHT + 0.1;
            ball0.position.z = points[0].z;
            ball0.visible = true;

            ball1.position.x = points[1].x;
            ball1.position.y = points[1].y + UNITS_HEIGHT + 0.1;
            ball1.position.z = points[1].z;
            ball1.visible = true;

            ball2.position.x = points[2].x;
            ball2.position.y = points[2].y + UNITS_HEIGHT + 0.1;
            ball2.position.z = points[2].z;
            ball2.visible = true;

            return true;
        }

        function checkForWinningPositions(points) {

            var winningOnVertRow = true;
            var unit1OnSameRow, unit2OnSameRow, unit3OnSameRow;

            if (winningOnVertRow) {
                unit1OnSameRow = unitAt(points[0]);
                winningOnVertRow = winningOnVertRow && unit1OnSameRow !== undefined;
            }
            if (winningOnVertRow) {
                unit2OnSameRow = unitAt(points[1]);
                winningOnVertRow = winningOnVertRow && unit2OnSameRow !== undefined && unit1OnSameRow.owner.name === unit2OnSameRow.owner.name;
            }
            if (winningOnVertRow) {
                unit3OnSameRow = unitAt(points[2]);
                winningOnVertRow = winningOnVertRow && unit3OnSameRow !== undefined && unit1OnSameRow.owner.name === unit3OnSameRow.owner.name;
            }

            return winningOnVertRow;
        }

        function unitAt(point) {
            for (var i = 0, l = gameManager.units['nbRedUnitsPlaced']; i < l; i++) {
                if (gameManager.units['redUnits'][i].position.point.x === point.x
                        && gameManager.units['redUnits'][i].position.point.y === point.y
                        && gameManager.units['redUnits'][i].position.point.z === point.z) {
                    return gameManager.units['redUnits'][i];
                }
            }
            for (var i = 0, l = gameManager.units['nbBlueUnitsPlaced']; i < l; i++) {
                if (gameManager.units['blueUnits'][i].position.point.x === point.x
                        && gameManager.units['blueUnits'][i].position.point.y === point.y
                        && gameManager.units['blueUnits'][i].position.point.z === point.z) {
                    return gameManager.units['blueUnits'][i];
                }
            }
        }

        var coord = movedTo.point.x || movedTo.point.y || movedTo.point.z;
        var nthSquare = coord / step;
        var hum;

        if (movedTo.point.x !== 0 && movedTo.point.z !== 0) {
            // Check on vertical line...
            var point1 = new THREE.Vector3(0, 0, 0);
            point1.x = movedTo.point.x;
            point1.z = nthSquare * step;

            var point2 = new THREE.Vector3(0, 0, 0);
            point2.x = movedTo.point.x;
            point2.z = 0;

            var point3 = new THREE.Vector3(0, 0, 0);
            point3.x = movedTo.point.x;
            point3.z = -nthSquare * step;

            hum = checkForWinningPositions([point1, point2, point3]) && markWinningPositions([point1, point2, point3]);

            // Check on horizontal line...
            point1.x = nthSquare * step;
            point1.z = movedTo.point.z;

            point2.x = 0;
            point2.z = movedTo.point.z;

            point3.x = -nthSquare * step;
            point3.z = movedTo.point.z;

            hum = hum || checkForWinningPositions([point1, point2, point3]) && markWinningPositions([point1, point2, point3]);
        } else if (movedTo.point.x === 0) {
            // In one direction...
            var point1 = new THREE.Vector3(0, 0, 0);
            point1.x = nthSquare * step;
            point1.z = movedTo.point.z;

            var point2 = new THREE.Vector3(0, 0, 0);
            point2.x = -nthSquare * step;
            point2.z = movedTo.point.z;

            hum = checkForWinningPositions([point1, point2, movedTo.point]) && markWinningPositions([point1, point2, movedTo.point]);

            // In the other direction...
            var sign = point1.z > 0 ? 1 : -1;
            var point1 = new THREE.Vector3(0, 0, 0);
            point1.x = 0;
            point1.z = sign * step;

            var point2 = new THREE.Vector3(0, 0, 0);
            point2.x = 0;
            point2.z = sign * 2 * step;

            var point3 = new THREE.Vector3(0, 0, 0);
            point3.x = 0;
            point3.z = sign * 3 * step;

            hum = hum || checkForWinningPositions([point1, point2, point3]) && markWinningPositions([point1, point2, point3]);
        } else if (movedTo.point.z === 0) {
            // In one direction...
            var point1 = new THREE.Vector3(0, 0, 0);
            point1.z = nthSquare * step;
            point1.x = movedTo.point.x;

            var point2 = new THREE.Vector3(0, 0, 0);
            point2.z = -nthSquare * step;
            point2.x = movedTo.point.x;

            hum = checkForWinningPositions([point1, point2, movedTo.point]) && markWinningPositions([point1, point2, movedTo.point]);

            // In the other direction...
            var sign = point1.x > 0 ? 1 : -1;
            var point1 = new THREE.Vector3(0, 0, 0);
            point1.z = 0;
            point1.x = sign * step;

            var point2 = new THREE.Vector3(0, 0, 0);
            point2.z = 0;
            point2.x = sign * 2 * step;

            var point3 = new THREE.Vector3(0, 0, 0);
            point3.z = 0;
            point3.x = sign * 3 * step;

            hum = hum || checkForWinningPositions([point1, point2, point3]) && markWinningPositions([point1, point2, point3]);
        }

        return hum;
    },
    finishHim: function () {
        gameManager.state = 'FINISHING_ENEMY';
    },
    performUserRequest: function (unit, moveFrom, moveTo) {
        if (unit === null || unit.type !== 'ATI_Unit')
            throw new Error("Trying to move invalid unit :-| ");

        var result = {isWinning: false, isDone: false};

        if (unit.owner.name !== gameManager.currentPlayer.name) {
            return result;
        }

        var isNeighbor = false;
        for (var i = 0; moveFrom !== null && i < moveFrom.neighbors.length; i++) {
            if (moveFrom.neighbors[i] === moveTo) {
                isNeighbor = true;
                break;
            }
        }

        if (moveFrom === null)
            isNeighbor = true;

        if (!isNeighbor) {
            result.isWinning = false;
            result.isDone = false;
            return result;
        }

        if (!moveTo.free) {
            result.isWinning = false;
            result.isDone = false;
            return result;
        }

        gameManager.moveUnitTo(unit, moveTo);
        if (moveFrom !== null)
            moveFrom.free = true;
        moveTo.free = false;

        if (gameManager.state === 'MOVING_UNIT') {
            var isRedPlaying = gameManager.currentPlayer.name === "red.player";
            var team = isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls';

            var ball = sceneMaker[team].balls[6];
            ball.visible = false;

            result.isWinning = gameManager.isWinningMove(unit);
            if (result.isWinning) {
                gameManager.finishHim();
            }
        }

        result.isDone = true;

        return result;
    }
};

/**
 * @author todeale@BrainSploit
 *
 * Objects of this class sole responsibility is to make 3D Graphics
 * tricks with THREE.js to make the scene appear...
 *
 * ;-)
 */
THREE.ATI_SceneMaker = function () {

    Object.call(this);

    sceneMaker = this;

    this.type = 'ATI_SceneMaker';
    this.raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();

    this.units_meshes = new Array();
};

THREE.ATI_SceneMaker.prototype = {
    constructor: THREE.ATI_SceneMaker,
    prepareGame: function (units) {

        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;

        var NB_SQUARES = 3;

        function initPerspectiveCamera() {
            // Put in a camera
            sceneMaker.camera = new THREE.PerspectiveCamera(45, sceneMaker.container.offsetWidth / sceneMaker.container.offsetHeight, 1, 4000);
//    camera.position.set(0, 25, 0);
            sceneMaker.camera.position.set(0, 0, -30);
            sceneMaker.camera.lookAt(sceneMaker.scene.position);
        }

        function initLights() {
            // Create a directional light to show off the object
            var light = new THREE.DirectionalLight(0xffffff, 0.85);
            light.position.set(0, 0.65, 1);
            sceneMaker.scene.add(light);

            var light = new THREE.DirectionalLight(0xffffff, 0.85);
            light.position.set(0, 0.65, -1);
            sceneMaker.scene.add(light);

            var mainLight = new THREE.PointLight(0xcccccc, 0.95, 250);
            mainLight.position.y = 80;
            sceneMaker.scene.add(mainLight);
        }

        function initRenderer() {
            // Grab our container div
            sceneMaker.container = document.getElementById("container");
            // Create the Three.js renderer, add it to our div
            sceneMaker.renderer = new THREE.WebGLRenderer();
            sceneMaker.renderer.setClearColor(0xf0f0f0);
            sceneMaker.renderer.setPixelRatio(window.devicePixelRatio);
            sceneMaker.renderer.setSize(sceneMaker.container.offsetWidth, sceneMaker.container.offsetHeight);
            sceneMaker.container.appendChild(sceneMaker.renderer.domElement);
        }

        function initScene() {
            // Create a new Three.js scene
            sceneMaker.scene = new THREE.Scene();

//            sceneMaker.axisHelper = new THREE.AxisHelper(50);
//            sceneMaker.scene.add(sceneMaker.axisHelper);
        }

        function initStatsReporter() {
            sceneMaker.stats = new Stats();
            sceneMaker.stats.domElement.style.position = 'absolute';
            sceneMaker.stats.domElement.style.top = '0px';
            sceneMaker.container.appendChild(sceneMaker.stats.domElement);
        }

        function initOrbitControls() {
            sceneMaker.controls = new THREE.OrbitControls(sceneMaker.camera, sceneMaker.renderer.domElement);

            // Limits to how far you can dolly in and out ( PerspectiveCamera only )
            sceneMaker.controls.minDistance = 12;
            sceneMaker.controls.maxDistance = 18;

            // How far you can orbit vertically, upper and lower limits.
            // Range is 0 to Math.PI radians.
            sceneMaker.controls.minPolarAngle = 3 * Math.PI / 8; // radians
            sceneMaker.controls.maxPolarAngle = 3 * Math.PI / 8; // radians

            // How far you can orbit horizontally, upper and lower limits.
            // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
            sceneMaker.controls.minAzimuthAngle = -Infinity; // radians
            sceneMaker.controls.maxAzimuthAngle = Infinity; // radians

//    // Set to true to enable damping (inertia)
//    // If damping is enabled, you must call controls.update() in your animation loop
            sceneMaker.controls.enableDamping = true;
            sceneMaker.controls.dampingFactor = 0.5;
        }

        function populateScene() {
            loadModels();
            makePlayBoard();
            simulateShadow();
            createMarkSpheres();
        }

        function createMarkSpheres() {
            var geometry = new THREE.IcosahedronGeometry(1, 0);
            var redMaterial = new THREE.MeshPhongMaterial({color: TEAM_A_COLOR, shading: THREE.FlatShading});
            var blueMaterial = new THREE.MeshPhongMaterial({color: TEAM_B_COLOR, shading: THREE.FlatShading});

            var winningBallGeometry = new THREE.IcosahedronGeometry(0.25, 0);

            sceneMaker.redSphere = new THREE.Mesh(geometry, redMaterial);
            sceneMaker.blueSphere = new THREE.Mesh(geometry, blueMaterial);

            sceneMaker.scene.add(sceneMaker.redSphere);
            sceneMaker.scene.add(sceneMaker.blueSphere);

            sceneMaker.winningRedBalls = {balls: [], nbUsed: 0};
            sceneMaker.winningBlueBalls = {balls: [], nbUsed: 0};

            for (var i = 0; i < 7; i++) {
                var blueBall = new THREE.Mesh(winningBallGeometry, blueMaterial);
                var redBall = new THREE.Mesh(winningBallGeometry, redMaterial);

                sceneMaker.winningRedBalls.balls.push(redBall);
                sceneMaker.winningBlueBalls.balls.push(blueBall);

                sceneMaker.scene.add(redBall);
                sceneMaker.scene.add(blueBall);
            }
        }

        // TOREFACTOR - CRAZY FUNCTION !!! Yes, I know  :D
        function makePlayBoard() {
            var step = 2;
            sceneMaker.squaresStep = step;

            var geometry = new THREE.Geometry();
            sceneMaker.strategicVerts = new Array();

            // We create and handle middle points first :-|
            var positionE1 = new THREE.ATI_Position(new THREE.Vector3(-step, 0, 0), []);
            var positionF1 = new THREE.ATI_Position(new THREE.Vector3(step, 0, 0), []);
            var positionG1 = new THREE.ATI_Position(new THREE.Vector3(0, 0, -step), []);
            var positionH1 = new THREE.ATI_Position(new THREE.Vector3(0, 0, step), []);

            var positionE2 = new THREE.ATI_Position(new THREE.Vector3(-2 * step, 0, 0), []);
            var positionF2 = new THREE.ATI_Position(new THREE.Vector3(2 * step, 0, 0), []);
            var positionG2 = new THREE.ATI_Position(new THREE.Vector3(0, 0, -2 * step), []);
            var positionH2 = new THREE.ATI_Position(new THREE.Vector3(0, 0, 2 * step), []);

            var positionE3 = new THREE.ATI_Position(new THREE.Vector3(-3 * step, 0, 0), []);
            var positionF3 = new THREE.ATI_Position(new THREE.Vector3(3 * step, 0, 0), []);
            var positionG3 = new THREE.ATI_Position(new THREE.Vector3(0, 0, -3 * step), []);
            var positionH3 = new THREE.ATI_Position(new THREE.Vector3(0, 0, 3 * step), []);

            // Create relationship between points
            positionE1.setNeighbors([positionE2]);
            positionE2.setNeighbors([positionE3, positionE1]);
            positionE3.setNeighbors([positionE2]);

            positionF1.setNeighbors([positionF2]);
            positionF2.setNeighbors([positionF3, positionF1]);
            positionF3.setNeighbors([positionF2]);

            positionG1.setNeighbors([positionG2]);
            positionG2.setNeighbors([positionG3, positionG1]);
            positionG3.setNeighbors([positionG2]);

            positionH1.setNeighbors([positionH2]);
            positionH2.setNeighbors([positionH3, positionH1]);
            positionH3.setNeighbors([positionH2]);

            sceneMaker.strategicVerts.push(positionE1);
            sceneMaker.strategicVerts.push(positionE2);
            sceneMaker.strategicVerts.push(positionE3);
            sceneMaker.strategicVerts.push(positionF1);
            sceneMaker.strategicVerts.push(positionF2);
            sceneMaker.strategicVerts.push(positionF3);
            sceneMaker.strategicVerts.push(positionG1);
            sceneMaker.strategicVerts.push(positionG2);
            sceneMaker.strategicVerts.push(positionG3);
            sceneMaker.strategicVerts.push(positionH1);
            sceneMaker.strategicVerts.push(positionH2);
            sceneMaker.strategicVerts.push(positionH3);

            // Now let's cope with angular points ;-)
            // Smallest square (first)
            var pointA = new THREE.Vector3(-step, 0, -step);
            var pointB = new THREE.Vector3(step, 0, -step);
            var pointC = new THREE.Vector3(step, 0, step);
            var pointD = new THREE.Vector3(-step, 0, step);

            geometry.vertices.push(pointA);
            geometry.vertices.push(pointB);

            geometry.vertices.push(pointB);
            geometry.vertices.push(pointC);

            geometry.vertices.push(pointC);
            geometry.vertices.push(pointD);

            geometry.vertices.push(pointD);
            geometry.vertices.push(pointA);

            var positionA = new THREE.ATI_Position(pointA, []);
            var positionB = new THREE.ATI_Position(pointB, []);
            var positionC = new THREE.ATI_Position(pointC, []);
            var positionD = new THREE.ATI_Position(pointD, []);

            positionA.setNeighbors([positionG1, positionE1]);
            positionB.setNeighbors([positionF1, positionG1]);
            positionC.setNeighbors([positionH1, positionF1]);
            positionD.setNeighbors([positionE1, positionH1]);

            positionE1.neighbors.push(positionA, positionD);
            positionF1.neighbors.push(positionB, positionC);
            positionG1.neighbors.push(positionA, positionB);
            positionH1.neighbors.push(positionC, positionD);

            sceneMaker.strategicVerts.push(positionA);
            sceneMaker.strategicVerts.push(positionB);
            sceneMaker.strategicVerts.push(positionC);
            sceneMaker.strategicVerts.push(positionD);

            // Second square
            var pointA = new THREE.Vector3(-2 * step, 0, -2 * step);
            var pointB = new THREE.Vector3(2 * step, 0, -2 * step);
            var pointC = new THREE.Vector3(2 * step, 0, 2 * step);
            var pointD = new THREE.Vector3(-2 * step, 0, 2 * step);

            geometry.vertices.push(pointA);
            geometry.vertices.push(pointB);

            geometry.vertices.push(pointB);
            geometry.vertices.push(pointC);

            geometry.vertices.push(pointC);
            geometry.vertices.push(pointD);

            geometry.vertices.push(pointD);
            geometry.vertices.push(pointA);

            var positionA = new THREE.ATI_Position(pointA, []);
            var positionB = new THREE.ATI_Position(pointB, []);
            var positionC = new THREE.ATI_Position(pointC, []);
            var positionD = new THREE.ATI_Position(pointD, []);

            positionA.setNeighbors([positionG2, positionE2]);
            positionB.setNeighbors([positionF2, positionG2]);
            positionC.setNeighbors([positionH2, positionF2]);
            positionD.setNeighbors([positionE2, positionH2]);

            positionE2.neighbors.push(positionA, positionD);
            positionF2.neighbors.push(positionB, positionC);
            positionG2.neighbors.push(positionA, positionB);
            positionH2.neighbors.push(positionC, positionD);

            sceneMaker.strategicVerts.push(positionA);
            sceneMaker.strategicVerts.push(positionB);
            sceneMaker.strategicVerts.push(positionC);
            sceneMaker.strategicVerts.push(positionD);

            // Third square
            var pointA = new THREE.Vector3(-3 * step, 0, -3 * step);
            var pointB = new THREE.Vector3(3 * step, 0, -3 * step);
            var pointC = new THREE.Vector3(3 * step, 0, 3 * step);
            var pointD = new THREE.Vector3(-3 * step, 0, 3 * step);

            geometry.vertices.push(pointA);
            geometry.vertices.push(pointB);

            geometry.vertices.push(pointB);
            geometry.vertices.push(pointC);

            geometry.vertices.push(pointC);
            geometry.vertices.push(pointD);

            geometry.vertices.push(pointD);
            geometry.vertices.push(pointA);

            var positionA = new THREE.ATI_Position(pointA, []);
            var positionB = new THREE.ATI_Position(pointB, []);
            var positionC = new THREE.ATI_Position(pointC, []);
            var positionD = new THREE.ATI_Position(pointD, []);

            positionA.setNeighbors([positionG3, positionE3]);
            positionB.setNeighbors([positionF3, positionG3]);
            positionC.setNeighbors([positionH3, positionF3]);
            positionD.setNeighbors([positionE3, positionH3]);

            positionE3.neighbors.push(positionA, positionD);
            positionF3.neighbors.push(positionB, positionC);
            positionG3.neighbors.push(positionA, positionB);
            positionH3.neighbors.push(positionC, positionD);

            sceneMaker.strategicVerts.push(positionA);
            sceneMaker.strategicVerts.push(positionB);
            sceneMaker.strategicVerts.push(positionC);
            sceneMaker.strategicVerts.push(positionD);

            // We draw cross lines
            geometry.vertices.push(new THREE.Vector3(step, 0, 0));
            geometry.vertices.push(new THREE.Vector3(NB_SQUARES * step, 0, 0));

            geometry.vertices.push(new THREE.Vector3(-step, 0, 0));
            geometry.vertices.push(new THREE.Vector3(-NB_SQUARES * step, 0, 0));

            geometry.vertices.push(new THREE.Vector3(0, 0, step));
            geometry.vertices.push(new THREE.Vector3(0, 0, NB_SQUARES * step));

            geometry.vertices.push(new THREE.Vector3(0, 0, -step));
            geometry.vertices.push(new THREE.Vector3(0, 0, -NB_SQUARES * step));

//    Les croix dans l'autre sens correspond à la partie apres la boucle
//    ( yes, i speak French TOO ;-)  )
//
//    var _x = 1, _z = 1;
//    for (var i = 0; i < 4; i++) {
//        geometry.vertices.push(new THREE.Vector3(_x * step, 0, _z * step));
//        geometry.vertices.push(new THREE.Vector3(NB_SQUARES * _x * step, 0, NB_SQUARES * _z * step));
//        _x *= -1;
//        _z *= _x;
//    }

            var material = new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2});
            material.linewidth = 5;

            sceneMaker.line = new THREE.LineSegments(geometry, material);
            sceneMaker.line.position.y = 0.3001;

            sceneMaker.scene.add(sceneMaker.line);
        }

        function simulateShadow() {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-75.05, -44, -44));
            geometry.vertices.push(new THREE.Vector3(75.05, -5, -44));

            var material = new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2});
            material.linewidth = 50;

            sceneMaker.lineSeparator = new THREE.LineSegments(geometry, material);
            sceneMaker.lineSeparator.position.y = -4.5;

            sceneMaker.scene.add(sceneMaker.lineSeparator);

            var planeGeo = new THREE.PlaneBufferGeometry(150.1, 150.1);

            sceneMaker.groundMirror = new THREE.Mirror(sceneMaker.renderer, sceneMaker.camera, {clipBias: 0.003, textureWidth: WIDTH, textureHeight: HEIGHT, color: 0x889999});

            sceneMaker.mirrorMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(150.1, 150.1), sceneMaker.groundMirror.material);
            sceneMaker.mirrorMesh.add(sceneMaker.groundMirror);
            sceneMaker.mirrorMesh.rotateX(-Math.PI / 2);
            sceneMaker.mirrorMesh.position.y = -3;
            sceneMaker.scene.add(sceneMaker.mirrorMesh);

            sceneMaker.verticalMirror = new THREE.Mirror(sceneMaker.renderer, this.camera, {clipBias: 0.003, textureWidth: WIDTH, textureHeight: HEIGHT, color: 0x889999});

            sceneMaker.verticalMirrorMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(150.1, 150.1), sceneMaker.verticalMirror.material);
            sceneMaker.verticalMirrorMesh.add(this.verticalMirror);
            sceneMaker.verticalMirrorMesh.position.y = -5;
            sceneMaker.verticalMirrorMesh.position.z = -45;
            sceneMaker.scene.add(sceneMaker.verticalMirrorMesh);

            sceneMaker.planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({color: 0xffffff}));
            sceneMaker.planeTop.position.y = 100 - 5;
            sceneMaker.planeTop.rotateX(Math.PI / 2);
            sceneMaker.scene.add(sceneMaker.planeTop);

            sceneMaker.planeBack = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({color: 0xffffff}));
            sceneMaker.planeBack.position.z = -50;
            sceneMaker.planeBack.position.y = 50 - 5;
            sceneMaker.scene.add(sceneMaker.planeBack);

            sceneMaker.planeFront = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({color: 0x7f7fff}));
            sceneMaker.planeFront.position.z = 50;
            sceneMaker.planeFront.position.y = 50 - 5;
            sceneMaker.planeFront.rotateY(Math.PI);
            sceneMaker.scene.add(sceneMaker.planeFront);

            sceneMaker.planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({color: 0x00ff00}));
            sceneMaker.planeRight.position.x = 50;
            sceneMaker.planeRight.position.y = 50 - 5;
            sceneMaker.planeRight.rotateY(-Math.PI / 2);
            sceneMaker.scene.add(sceneMaker.planeRight);

            sceneMaker.planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({color: 0xff0000}));
            sceneMaker.planeLeft.position.x = -50;
            sceneMaker.planeLeft.position.y = 50 - 5;
            sceneMaker.planeLeft.rotateY(Math.PI / 2);
            sceneMaker.scene.add(sceneMaker.planeLeft);
        }

        function loadModels() {
            sceneMaker.loader = new THREE.JSONLoader();
            sceneMaker.loader.load("assets/meshes/table.json", function (geometry) {
                // Create a shaded, texture-mapped cube and add it to the scene
                // First, create the texture map
                var mapUrl = "assets/textures/jpg/table.jpg";
                var map = THREE.ImageUtils.loadTexture(mapUrl);
                var material = new THREE.MeshPhongMaterial({map: map});

                sceneMaker.cube = new THREE.Mesh(geometry, material);
                sceneMaker.cube.position.set(0, 0, 0);
                sceneMaker.scene.add(sceneMaker.cube);
            });
            sceneMaker.loader.load("assets/meshes/unit.json", function (geometry) {
                // Create a shaded, texture-mapped cube and add it to the scene
                // First, create the texture map
                var redMaterial = new THREE.MeshPhongMaterial({color: TEAM_A_COLOR, opacity: 1});
                var blueMaterial = new THREE.MeshPhongMaterial({color: TEAM_B_COLOR, opacity: 1});

                var redMesh = new THREE.Mesh(geometry, redMaterial);
                var blueMesh = new THREE.Mesh(geometry, blueMaterial);

                redMesh.visible = false;
                blueMesh.visible = false;

                for (var i = 0; i < NB_UNITS_PER_PLAYER; i++) {

                    units.redUnits[i].mesh = redMesh.clone();
                    units.blueUnits[i].mesh = blueMesh.clone();

                    sceneMaker.units_meshes.push(gameManager.units.redUnits[i].mesh);
                    sceneMaker.units_meshes.push(gameManager.units.blueUnits[i].mesh);

                    sceneMaker.scene.add(units.redUnits[i].mesh);
                    sceneMaker.scene.add(units.blueUnits[i].mesh);
                }
            });
        }

        function makeOptionControls() {
        }

        // Inits animation utils
        initScene();
        initRenderer();
        initPerspectiveCamera();

        populateScene();

        initLights();
        initStatsReporter();

        initOrbitControls();
        makeOptionControls();
    },
    startGame: function () {

        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            TWEEN.update();
            sceneMaker.stats.update();
            sceneMaker.controls.update();
            sceneMaker.groundMirror.renderWithMirror(sceneMaker.verticalMirror);
            sceneMaker.verticalMirror.renderWithMirror(sceneMaker.groundMirror);
            sceneMaker.renderer.render(sceneMaker.scene, sceneMaker.camera);

            gameManager.update();
        }
        // Run our render loop
        animate();
    },
    stopGame: function () {
    },
    endGame: function () {
    },
    getStrategicVertices: function () {
        if (this.strategicVerts === null)
            throw new Error("Strategic verts not yet filled :-|");
        return this.strategicVerts;
    },
    toggleMarkForMove: function (unit) {
        var isRedPlaying = gameManager.currentPlayer.name === "red.player";
        var team = isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls';
        var ball = sceneMaker[team].balls[6];

        for (var i = 0; i < 6; i++) {
            sceneMaker[team].balls[i].visible = false;
        }

        if (gameManager.movingUnit !== null && gameManager.movingUnit === unit) { // Deselect it...
            gameManager.state = 'PLAYING';

            ball.visible = false;

            gameManager.movingUnit = null;
        } else if (gameManager.movingUnit === null) {
            gameManager.state = 'MOVING_UNIT';

            gameManager.movingUnit = unit;

            ball.position.x = unit.position.point.x;
            ball.position.y = unit.position.point.y + UNITS_HEIGHT + 0.1;
            ball.position.z = unit.position.point.z;

            ball.visible = true;
        }
    },
    dropUnitFromScene: function (unit) {
        if (unit === null)
            return;
        sceneMaker.removeFromScene(unit.mesh);
        var isRedPlaying = gameManager.currentPlayer.name === "red.player";
        var units = gameManager.units[isRedPlaying ? 'blueUnits' : 'redUnits'];
        var meshes = sceneMaker.units_meshes;
        var i0 = units.indexOf(unit);
        var j0 = meshes.indexOf(unit.mesh);

        var i, l, lm = meshes.length;
        for (i = i0, l = gameManager.units[isRedPlaying ? 'nbBlueUnitsPlaced' : 'nbRedUnitsPlaced']; i < l - 1; i++) {
            units[i] = units[i + 1];
        }
        units[i] = null;
        units.length--;
        for (i = j0; i < lm - 1; i++) {
            meshes[i] = meshes[i + 1];
        }
        meshes[i] = null;
        meshes.length--;
        gameManager.units[isRedPlaying ? 'nbBlueUnitsPlaced' : 'nbRedUnitsPlaced']--;
        if (gameManager.units[isRedPlaying ? 'nbBlueUnitsPlaced' : 'nbRedUnitsPlaced'] < 3) {
            alert(isRedPlaying ? 'Reds win' : 'Blues win');
            gameManager.state = 'GAME_FINISHED';
            gameManager.chrono.start();
        }
    },
    toggleViewToTop: function () {
        if (!sceneMaker.isOnTopView) {
            sceneMaker.isOnTopView = true;
            sceneMaker.controls.minPolarAngle = -2 * Math.PI; // radians
            sceneMaker.controls.maxPolarAngle = 2 * Math.PI; // radians

            new TWEEN.Tween(sceneMaker.camera.position).to(
                    {
                        x: 0,
                        y: 40,
                        z: 0
                    }, 300
                    /* :-o */).easing(TWEEN.Easing.Quadratic.In).start();

            sceneMaker.camera.lookAt(sceneMaker.scene.position);

            sceneMaker.controls.minPolarAngle = -Math.PI; // radians
            sceneMaker.controls.maxPolarAngle = -Math.PI; // radians
        } else {
            sceneMaker.isOnTopView = false;
            sceneMaker.controls.minPolarAngle = 3 * Math.PI / 8; // radians
            sceneMaker.controls.maxPolarAngle = 3 * Math.PI / 8; // radians

            new TWEEN.Tween(sceneMaker.camera.position).to(
                    {
                        x: 0,
                        y: 0,
                        z: -30
                    }, 300
                    /*  :-o */).easing(TWEEN.Easing.Quadratic.In).start();

            sceneMaker.camera.lookAt(sceneMaker.scene.position);
        }
    },
    autoRotateScene: function () {
        sceneMaker.autoRotating = !sceneMaker.autoRotating;
    },
    registerListeners: function () {

        function initListeners() {

            window.addEventListener('mousedown', function (event) {
                event.preventDefault();

                mouseXonDown = event.clientX;
                mouseYonDown = event.clientY;
            }, false);

            window.addEventListener('keydown', function (event) {
                event.preventDefault();

                var key = event.keyCode || event.charCode;
                var keypressed = String.fromCharCode(key);

                if (keypressed === 'H') {
                    sceneMaker.toggleViewToTop();
                } else if (keypressed === 'R') {
                    sceneMaker.autoRotateScene();
                }
            }, false);

            window.addEventListener('mouseup', function (event) {
                event.preventDefault();

                mouseXonUp = event.clientX;
                mouseYonUp = event.clientY;

                var distance = Math.abs(mouseXonDown - mouseXonUp) + Math.abs(mouseYonDown - mouseYonUp);
                // The player is not trying to move units...just a click to ignore... :-)
                if (distance > gameManager.CLICK_ECART)
                    return;

                sceneMaker._mouse.x = (event.clientX / sceneMaker.renderer.domElement.clientWidth) * 2 - 1;
                sceneMaker._mouse.y = -(event.clientY / sceneMaker.renderer.domElement.clientHeight) * 2 + 1;

                sceneMaker.raycaster.setFromCamera(sceneMaker._mouse, sceneMaker.camera);

                var isRedPlaying = gameManager.currentPlayer.name === "red.player";
                var playingUnits = gameManager.units[isRedPlaying ? 'redUnits' : 'blueUnits'];

                if (gameManager.state === 'SETTLING') {

                    if (!gameManager.cubeAdded && sceneMaker.cube) {
                        gameManager.toleranceSpheres.push(sceneMaker.cube);
                        gameManager.cubeAdded = true;
                    }
                    var intersects = sceneMaker.raycaster.intersectObjects(gameManager.toleranceSpheres, false);

                    if (intersects.length > 0) {
                        var obj = intersects[0].object;
                        if (obj === sceneMaker.cube)
                            return;
                        for (var i = 0; i < gameManager.strategicVerts.length; i++) {
                            if (gameManager.strategicVerts[i].point.x === obj.position.x
                                    && gameManager.strategicVerts[i].point.y === obj.position.y
                                    && gameManager.strategicVerts[i].point.z === obj.position.z) {

                                var unitToPlace = gameManager.units[isRedPlaying ? 'nbRedUnitsPlaced' : 'nbBlueUnitsPlaced'];
                                var unit = playingUnits[unitToPlace];
                                unit.mesh.visible = true;

                                var result;
                                var result = gameManager.performUserRequest(unit, null, gameManager.strategicVerts[i]);

                                if (result.isDone) {
                                    gameManager.units[isRedPlaying ? 'nbRedUnitsPlaced' : 'nbBlueUnitsPlaced']++;
                                    // Next hand is not for the current player
                                    gameManager.currentPlayer = gameManager.players[isRedPlaying ? 'bluePlayer' : 'redPlayer'];
                                    // The icosahedrons show the current player
                                    gameManager.rotate_sphere_A_Y = isRedPlaying ? 0 : 0.25;
                                    gameManager.rotate_sphere_B_Y = 0.25 - gameManager.rotate_sphere_A_Y;
                                }

                                if (gameManager.units['nbRedUnitsPlaced'] === NB_UNITS_PER_PLAYER
                                        && gameManager.units['nbBlueUnitsPlaced'] === NB_UNITS_PER_PLAYER) {
                                    gameManager.state = 'PLAYING';
                                }
                                break;
                            }
                        }
                    }
                    return;
                }

                if (gameManager.state === 'MOVING_UNIT') {

                    var intersects = sceneMaker.raycaster.intersectObjects(sceneMaker.units_meshes, false);

                    if (intersects.length > 0) {
                        var obj = intersects[0].object;
                        var unit;

                        for (var i = 0, l = gameManager.units[isRedPlaying ? 'nbRedUnitsPlaced' : 'nbBlueUnitsPlaced']; i < l; i++) {
                            if (playingUnits[i].mesh === obj) {
                                unit = playingUnits[i];
                                break;
                            }
                        }
                        sceneMaker.toggleMarkForMove(unit);
                    }

                    if (!gameManager.cubeAdded && sceneMaker.cube) {
                        gameManager.toleranceSpheres.push(sceneMaker.cube);
                        gameManager.cubeAdded = true;
                    }
                    var intersects = sceneMaker.raycaster.intersectObjects(gameManager.toleranceSpheres, false);
                    var obj = intersects[0].object;
                    if (obj === sceneMaker.cube)
                        return;
                    for (var i = 0, l = gameManager.strategicVerts.length; i < l; i++) {
                        if (gameManager.strategicVerts[i].point.x === obj.position.x
                                && gameManager.strategicVerts[i].point.y === obj.position.y
                                && gameManager.strategicVerts[i].point.z === obj.position.z) {

                            var unit = gameManager.movingUnit;

                            var result;
                            var result = gameManager.performUserRequest(unit, unit.position, gameManager.strategicVerts[i]);

                            if (!result.isWinning && result.isDone) {
                                gameManager.movingUnit = null;
                                // Next hand is not for the current player
                                gameManager.currentPlayer = gameManager.players[isRedPlaying ? 'bluePlayer' : 'redPlayer'];
                                // The icosahedrons show the current player
                                gameManager.rotate_sphere_A_Y = isRedPlaying ? 0 : 0.25;
                                gameManager.rotate_sphere_B_Y = 0.25 - gameManager.rotate_sphere_A_Y;
                                gameManager.state = 'PLAYING';
                                sceneMaker[isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls'].balls[6].visible = false;
                            }

                            break;
                        }
                    }
                    return;
                }

                if (gameManager.state === 'FINISHING_ENEMY') {
                    var intersects = sceneMaker.raycaster.intersectObjects(sceneMaker.units_meshes, false);

                    if (intersects.length > 0) {
                        var obj = intersects[0].object;

                        var unit;
                        var units = gameManager.units[isRedPlaying ? 'blueUnits' : 'redUnits'];
                        for (var i = 0, l = gameManager.units[isRedPlaying ? 'nbBlueUnitsPlaced' : 'nbRedUnitsPlaced']; i < l; i++) {
                            if (units[i].mesh === obj) {
                                unit = units[i];
                                break;
                            }
                        }
                        if (unit !== undefined && unit.owner.name !== gameManager.currentPlayer.name) {
                            unit.mesh.visible = false;

                            gameManager.state = 'PLAYING';

                            sceneMaker.dropUnitFromScene(unit);

                            unit.position.free = true;
                            unit.owner.nbUnitsLost++;

                            gameManager.movingUnit = null;
                            // Next hand is not for the current player
                            gameManager.currentPlayer = gameManager.players[isRedPlaying ? 'bluePlayer' : 'redPlayer'];
                            // The icosahedrons show the current player
                            gameManager.rotate_sphere_A_Y = isRedPlaying ? 0 : 0.25;
                            gameManager.rotate_sphere_B_Y = 0.25 - gameManager.rotate_sphere_A_Y;

                            sceneMaker[isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls'].balls[6].visible = false;

                            var team = isRedPlaying ? 'winningRedBalls' : 'winningBlueBalls';
                            for (var i = 0; i < 6; i++) {
                                sceneMaker[team].balls[i].visible = false;
                            }
                        }
                    }
                    return;
                }

                if (gameManager.state === "PLAYING") {
                    var intersects = sceneMaker.raycaster.intersectObjects(sceneMaker.units_meshes);

                    if (intersects.length > 0) {

                        var obj = intersects[0].object;
                        var unit;

                        for (var i = 0, l = gameManager.units[isRedPlaying ? 'nbRedUnitsPlaced' : 'nbBlueUnitsPlaced']; i < l; i++) {
                            if (playingUnits[i].mesh === obj) {
                                unit = playingUnits[i];
                                break;
                            }
                        }
                        if (unit === undefined)
                            return;

                        sceneMaker.toggleMarkForMove(unit);
                    }
                }
            }, false);

            window.addEventListener('touchstart', function (event) {
                event.preventDefault();

                event.clientX = event.touches[0].clientX;
                event.clientY = event.touches[0].clientY;
                onDocumentMouseDown(event);
            }, false);

            window.addEventListener('resize', function () {
                sceneMaker.camera.aspect = sceneMaker.container.offsetWidth / sceneMaker.container.offsetHeight;
                sceneMaker.camera.updateProjectionMatrix();

                sceneMaker.renderer.setSize(sceneMaker.container.offsetWidth, sceneMaker.container.offsetHeight);
            }, false);
        }

        initListeners();
    },
    removeFromScene: function (mesh) {

        sceneMaker.scene.remove(mesh);
    }
};
