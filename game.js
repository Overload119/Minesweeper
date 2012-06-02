var Cell = function(x, y, size) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.isBomb = false;
	this.nearbyBombs = 0;
	this.nearbyCells = [];
	this.revealed = false;
	this.flagged = false;
};
Cell.prototype.getX = function() { return this.x/this.size };
Cell.prototype.getY = function() { return this.y/this.size };
Cell.prototype.draw = function(g) {
	g.shadowColor = "";
	g.shadowBlur = 0;
	g.shadowOffsetX = 0;
	g.shadowOffsetY = 0;
	
	if( this.revealed ) {
		if( this.isBomb ) {
			g.font = Math.floor( this.size/2 ) + "pt Arial";
			g.fillStyle = "Red";
			g.strokeStyle = "White";
			g.strokeRect(this.x, this.y, this.size, this.size);
			g.fillRect(this.x, this.y, this.size, this.size);
			g.fillStyle = "White";		
			
			g.fillText( "X" , this.x+Math.round(g.measureText("X").width/2), Math.round(this.y+this.size*0.8));		
		} else {
			g.fillStyle = "#393C45";
			g.fillRect(this.x, this.y, this.size, this.size);
			g.fillStyle = "#616675";
			g.fillRect(this.x+5, this.y+5, this.size-5, this.size-5);	
			g.strokeStyle = "White";	
			g.strokeRect(this.x, this.y, this.size, this.size);		
			if( this.nearbyBombs > 0 ) {
				g.font = Math.floor( this.size/2 ) + "pt Arial";			
				var txtMetrics = g.measureText( this.nearbyBombs.toString() );
				g.fillStyle = "White";
				g.shadowColor = "Black";
				g.shadowBlur = 10;
				g.fillStyle = "White";	
				g.fillText( this.nearbyBombs.toString() , this.x+Math.round(txtMetrics.width/1), Math.round(this.y+this.size*0.8));
			}
		}
	} else {
		if( this.flagged ) {
			g.font = Math.floor( this.size/2 ) + "pt Arial";
			g.fillStyle = "Yellow";
			g.strokeStyle = "Black";
			g.strokeRect(this.x, this.y, this.size, this.size);
			g.fillRect(this.x, this.y, this.size, this.size);
			g.fillStyle = "White";
			g.shadowColor = "Black";
			g.shadowBlur = 15;
			g.fillStyle = "White";	
			g.fillText( "!" , this.x-Math.round(g.measureText("!").width/2)+(this.size/2), Math.round(this.y+this.size*0.8));
		} else {
			g.fillStyle = "#1F52ED";
			g.strokeStyle = "White";
			g.strokeRect(this.x, this.y, this.size, this.size);
			g.fillRect(this.x, this.y, this.size, this.size);
		}
	}
};

var Bot = {
	thinkCount: 0,
	guessTrack: [],
	discoveredBombs: {},
	guessQueue: [],
	thread: null,
	speed: 0,
	flagged: 0,
	attempt: 0,
	
	start: function(speed) {
		Bot.attempt++;
		console.log("Bot started at "+speed+"ms #"+Bot.attempt);
		Bot.thinkCount = 0;
		Bot.guessQueue = [];
		Bot.speed = speed;
		Bot.flagged = 0;
		Bot.thread = setInterval( Bot.think, speed );
	},
	recover: function() {
		clearInterval( Bot.thread );
		
		// After one second, start the bot again
		var restartTimer = setTimeout( function() {
			// Reset the gameboard
			for( var i = 0; i<gameSize; i++ ) {
				for( var j = 0; j<gameSize; j++ ) {
					cells[i][j].revealed = false;
					cells[i][j].flagged = false;
				}
			}
			if( Bot.speed > 30 ) Bot.speed -= 10;
			Bot.start( Bot.speed );
			clearTimeout(restartTimer);
		}, Bot.speed*2);
	},
	think: function() {
		if( Bot.flagged == bombs ) {
			for( var i = 0; i<gameSize; i++ ) {
				for( var j = 0; j<gameSize; j++ ) {
					if( !cells[i][j].flagged )
						Reveal(i, j);
				}
			}
			console.log("Finished");
			ConsoleSuccess();
			clearInterval(Bot.thread);
			return;
		}
		
		if( Bot.thinkCount < Bot.guessTrack.length ) {
			if( Bot.discoveredBombs[Bot.guessTrack[Bot.thinkCount].getX() + "," + Bot.guessTrack[Bot.thinkCount].getY()] != undefined ){
					Bot.guessTrack[Bot.thinkCount].flagged = true;
					Bot.flagged++;
					console.log("Flagging previous!");
			} else {
				Reveal(Bot.guessTrack[Bot.thinkCount].getX(), Bot.guessTrack[Bot.thinkCount].getY());
			}
			Bot.thinkCount++;
		}
		else {
			if( Bot.guessQueue.length == 0 && Bot.guessTrack.length == 0 ) {
				var randomRow = Math.floor( Math.random() * gameSize );
				var randomCol = Math.floor( Math.random() * gameSize );
				Bot.guessQueue.push( cells[randomRow][randomCol] );
			}
			// We've recovered the last time we tried. Now let's try somewhere else.
			else if( Bot.guessQueue.length == 0 ) {
				// First try to get nearby of last hit
				var possible = Bot.guessTrack[ Bot.guessTrack.length-1 ].nearbyCells;
				for( var i = 0, l=possible.length; i<l; i++) {
					var nc = possible[i];
					if( !nc.revealed && !nc.flagged) {
						Bot.guessQueue.push(nc);
						break;
					}
				}
				if( Bot.guessQueue.length == 0 ) {
					for( var i = 0; i<gameSize; i++ ) {
						for( var j = 0; j<gameSize; j++ ){
							if( !cells[i][j].revealed && !cells[i][j].flagged) {
								Bot.guessQueue.push(cells[i][j]);
								console.log("Could not find a nearby cell -- attempting random.");
								break;
							}
						}
					}
				}
				
				// We try it now.
				var c = Bot.guessQueue[0];
				if( Bot.discoveredBombs[c.getX() + "," + c.getY()] != undefined ){
					c.flagged = true;
					Bot.flagged++;
					console.log("Flagging!");
				}
				else if( c.isBomb ) {
					 Bot.discoveredBombs[c.getX() + "," + c.getY()] = c;
					 Reveal(c.getX(), c.getY());
					 Bot.guessTrack.push(c);					 
					 Bot.recover();
				} else {
					Bot.guessTrack.push(c);
					Reveal(c.getX(), c.getY());
					// Enumerate nearby that aren't revealed already
					for( var i = 0, l=c.nearbyCells.length; i<l; i++) {
						var nc = c.nearbyCells[i];
						if( !nc.revealed && !nc.flagged ) {
							Bot.guessQueue.push(nc);
							break;
						}
					}
				}
				Bot.guessQueue.splice(0,1);
			}
			else {
				var c = Bot.guessQueue[0];
				if( Bot.discoveredBombs[c.getX() + "," + c.getY()] != undefined ){
					c.flagged = true;
					Bot.flagged++;
					console.log("Flagging!");
				}
				else if( c.isBomb ) {
					 Bot.discoveredBombs[c.getX() + "," + c.getY()] = c;
					 Reveal(c.getX(), c.getY());
					 Bot.guessTrack.push(c);					 
					 Bot.recover();
				} else {
					Bot.guessTrack.push(c);
					Reveal(c.getX(), c.getY());
					// Enumerate nearby that aren't revealed already
					for( var i = 0, l=c.nearbyCells.length; i<l; i++) {
						var nc = c.nearbyCells[i];
						if( !nc.revealed && !nc.flagged ) {
							Bot.guessQueue.push(nc);
							break;
						}
					}
				}
				Bot.guessQueue.splice(0,1);
			}			
			Bot.thinkCount++;
			document.getElementById("console").value = Bot.flagged;
		}
	}
};


var g;
var cells = [];
var gameSize = 0;
var bombs = 0;

function Draw() {
	for( var i = 0; i<gameSize; i++ ) {
		for( var j = 0; j<gameSize; j++ ) {
			var c = cells[i][j];			
			c.draw(g);
		}
	}
}
function Reveal(x, y){
	var c = cells[x][y];
	if( c.isBomb ) {
	} 
	else if( c.nearbyBombs == 0 ) {
		cells[x][y].revealed = true;
		for( var i=0, l=c.nearbyCells.length; i<l; i++){
			var temp = c.nearbyCells[i];
			if( temp.nearbyBombs == 0 && !temp.revealed){
				Reveal( temp.x/c.size, temp.y/c.size );
			}
		}
	}
	cells[x][y].revealed = true;
	return c;
}

function InitGame() {
	setInterval( Draw, 30 );
}

function ConsoleCommand(cmd) {
	if(cmd.substring(0,4) == "size") {
		gameSize = parseInt(cmd.substring(4));
		
		gameSize = Math.sqrt(gameSize);
		gameSize = Math.floor(gameSize);
		
		var cellSize = Math.floor(768/gameSize);
		for( var i = 0; i<gameSize; i++ ) {
			cells[i] = [];
			for( var j = 0; j<gameSize; j++ ) {
				var c = cells[i][j] = new Cell(i*cellSize, j*cellSize, cellSize);
				if( i > 0 ){
					var upCell = cells[i-1][j];
					upCell.nearbyCells.push( c );
					c.nearbyCells.push( upCell );	
					
					if( j < gameSize-1 ) {
						var diaCell = cells[i-1][j+1];
						diaCell.nearbyCells.push( c );
						c.nearbyCells.push(diaCell);
					}
					
				}
				if( j > 0 ) {
					var leftCell = cells[i][j-1];
					leftCell.nearbyCells.push( c );
					c.nearbyCells.push( leftCell );
				}	
				if( i > 0 && j > 0 ){
					var diaCell = cells[i-1][j-1];
					diaCell.nearbyCells.push( c );
					c.nearbyCells.push(diaCell);
				}
			}
		}
		
		document.getElementById("g").width = document.getElementById("g").height = gameSize*cellSize;
		console.log("Created "+(gameSize*gameSize)+" cells.");
		ConsoleSuccess();		
	}	
	else if(cmd.substring(0,5) == "bombs"){
	
		var _bombs = parseInt(cmd.substring(5));
		if( _bombs < 0 || gameSize == 0 || _bombs >= (gameSize*gameSize)) {
			ConsoleError();
			return;
		}
			
		bombs = 0;
		while( bombs < _bombs ) {
			var randomRow = Math.floor( Math.random() * gameSize );
			var randomCol = Math.floor( Math.random() * gameSize );
			
			var bombCell = cells[randomRow][randomCol];
			
			if( bombCell.isBomb == true )
				continue; 
				
			bombCell.isBomb = true;
			bombCell.nearbyBombs = 0;
			
			for( var i = 0, l=bombCell.nearbyCells.length; i<l; i++ ){
				var c = bombCell.nearbyCells[i];
				c.nearbyBombs++;
			}
			
			bombs++;
			
		}
		
	}
	else if(cmd === "start") {
		InitGame();
		ConsoleSuccess();
	}
	else if(cmd.substring(0,3) === "bot") {
		var speed = parseInt(cmd.substring(3));
		if( isNaN(speed) ){
			ConsoleError();
			return;
		}
		Bot.start(speed);
		ConsoleSuccess();
	}	
	else if(cmd === "reveal") {
		for( var i = 0; i<gameSize; i++ ) {
			for( var j = 0; j<gameSize; j++ ) {
				Reveal(i, j);
			}
		}
	}
	else if(cmd.substring(0,1) == "r"){
		if( cmd.length < 3 ) {
			ConsoleFailure();
			return;
		}
		var _subcmd = cmd.substring(2);
		var x;
		var y;
		try {
			x = parseInt(cmd.substring(2, _subcmd.indexOf(" ")+2));
			_subcmd = _subcmd.substring(_subcmd.indexOf(" "));
			y = parseInt( _subcmd );
		}
		catch(err) {
			ConsoleError();
			return;
		}
		if( isNaN(x) || isNaN(y) ) {
			ConsoleError();
			return;
		}
		if( x < 0 || y < 0 || x>gameSize || y>gameSize ) {
			ConsoleFailure();
			return;
		}
		
		Reveal(x,y);
		ConsoleSuccess();
		
	}
}

function ConsoleSuccess() {
	var _count = 5;
	var t = setInterval( function() {
		if( _count % 2 == 0 ) document.getElementById("console").style.backgroundColor = "#46FF40";
		else document.getElementById("console").style.backgroundColor = "White";
		_count--;
		if(_count <= 0 ) clearInterval(t);
	}, 100 );	
}
function ConsoleError() {	
	var _count = 5;
	var t = setInterval( function() {
		if( _count % 2 == 0 ) document.getElementById("console").style.backgroundColor = "#FF4043";
		else document.getElementById("console").style.backgroundColor = "White";
		_count--;
		if(_count <= 0 ) clearInterval(t);
	}, 100 );	
}

function ConsoleKeyPress(evt) {
	var key = evt.keyCode;
	if( key === 13 ) {
		var cmd = document.getElementById("console").value;
		if(cmd) {
			document.getElementById("console").value = "";
			ConsoleCommand(cmd);
		}		
	}
}

function Main() {
	g = document.getElementById("g").getContext("2d");

	document.getElementById("console").addEventListener("keypress", ConsoleKeyPress, false);
	g.fillStyle = "Black";
	g.fillRect(0,0,768,768);
	
	document.getElementById("console").focus();
}