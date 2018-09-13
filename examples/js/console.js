//consle.js

var ctx = null;
var theCanvas = null;
var lineHeight = 20;

var widthOffset = 2;
var cursorWidth = 8;
var cursorHeight = 3;
var fontColor = "#C0C0C0";
var outputFont = '12pt Consolas';
//var outputFont = '12pt Tahoma';
//var outputFont = '9pt Courier New';
var charWidth;

var allUserCmds = [ ]; // array of strings to hold the commands user types
var currentCmd = ""; // string to hold current cmd user is typing
var currentPro = [ ]; // array of current program
var currentCmdInd = 0; // index of cmds

var PROMPT = "repl>";
var promptWidth = null;
var promptPad = 3;
var leftWindowMargin = 2;
var cursor = null;
var cursorInit = null;
window.addEventListener("load", initApp);
var flashCounter = 1;

function appCursor (cursor){
		this.x = cursor.x;
		this.y = cursor.y;
		this.width = cursor.width;
		this.height = cursor.height;
}

// 外部变量：PROMPT promptPad promptWidth lineHeight cursorWidth cursorHeight
function initApp()
{
	theCanvas = document.getElementById("gamescreen");
	ctx = theCanvas.getContext("2d");
	ctx.font = outputFont;
	var metrics = ctx.measureText("W");
	// rounded to nearest int
	charWidth = Math.ceil(metrics.width);
	promptWidth = charWidth * PROMPT.length + promptPad;
	cursor = new appCursor({x:promptWidth,y:lineHeight,width:cursorWidth,height:cursorHeight});
  cursorInit = new appCursor({x:promptWidth,y:lineHeight,width:cursorWidth,height:cursorHeight});

	// window.addEventListener("resize", draw);
	window.addEventListener("keydown",keyDownHandler);
	window.addEventListener("keypress",showKey);
	initViewArea();
	setInterval(flashCursor,300);
}

// 外部变量：allUserCmds currentCmdInd currentCmd currentPro cursorInit
function clear()
{
	var c = document.getElementById("gamescreen");
  var cxt = c.getContext("2d");
  allUserCmds = [];
  currentCmdInd = 0;
  currentCmd = "";
  currentPro = [];
  cursor = new appCursor({x:cursorInit.x,y:cursorInit.y,
  	width:cursorInit.width,height:cursorInit.height});
	initViewArea();
}

// 外部变量：ctx lineHeight cursor PROMPT leftWindowMargin
function drawNewLine(logMsg = PROMPT){
	ctx.font = outputFont;
	ctx.fillStyle = fontColor;
	var textOut = logMsg;
	if (logMsg !== PROMPT) {
		cursor.y += lineHeight
		ctx.fillText(" =>" + logMsg,-5, cursor.y);
	}
	ctx.fillText(PROMPT,leftWindowMargin, cursor.y + lineHeight);
}

// 外部变量：ctx leftWindowMargin cursor lineHeight
function drawRemainLine(){
	ctx.font = outputFont;
	ctx.fillStyle = fontColor;
	var textOut = "            ";
	ctx.fillText  (textOut,leftWindowMargin, cursor.y + lineHeight);
}

// 外部变量：ctx PROMPT leftWindowMargin lineHeight
function drawPrompt(Yoffset)
{
	ctx.font = outputFont;
	ctx.fillStyle = fontColor;
	var textOut = PROMPT;
	ctx.fillText  (textOut,leftWindowMargin, Yoffset * lineHeight);
}

// 外部变量：ctx PROMPT leftWindowMargin lineHeight
function blotPrevChar(){
	blotOutCursor();
	ctx.fillStyle = "#000000";
	cursor.x-=charWidth;
	ctx.fillRect(cursor.x,cursor.y-(charWidth + widthOffset),cursor.width+3,15);
}

// 外部变量：ctx cursor
function blotOutCursor(){
	ctx.fillStyle = "#000000";
	ctx.fillRect(cursor.x,cursor.y,cursor.width,cursor.height);
}

function keyDownHandler(e){

	var currentKey = null;
	if (e.code !== undefined)
	{
		currentKey = e.code;
		console.log("e.code : " + e.code);
	}
	else
	{
		currentKey = e.keyCode;
		console.log("e.keyCode : " + e.keyCode);
	}
	console.log(currentKey);
	switch(currentKey) {
		case 8:
			bsHandler(e);
			break;
		case 'Backspace':
			bsHandler(e);
			break;
		case 13:
			etHandler(e);
			break;
		case 'Enter':
			etHandler(e);
			break;
		case 'ArrowUp':
			auHandler(e);
			break;
	  case 'ArrowDown':
			adHandler(e);
			break;
		default :

			break;
	}
}

// 外部变量：ctx outputFont fontColor cursor charWidth currentCmd
function showKey(e){
	blotOutCursor();

	ctx.font = outputFont;
	ctx.fillStyle = fontColor;

	ctx.fillText  (String.fromCharCode(e.charCode),cursor.x, cursor.y);
	cursor.x += charWidth;
	currentCmd += String.fromCharCode(e.charCode);

}

// 外部变量：flashCounter ctx fontColor cursor
function flashCursor(){

	var flag = flashCounter % 3;

	switch (flag)
	{
		case 1 :
		case 2 :
		{
			ctx.fillStyle = fontColor;
			ctx.fillRect(cursor.x,cursor.y,cursor.width, cursor.height);
			flashCounter++;
			break;
		}
		default:
		{
			ctx.fillStyle = "#000000";
			ctx.fillRect(cursor.x,cursor.y,cursor.width, cursor.height);
			flashCounter= 1;
		}
	}
}

function cursor (cursor){
	this.x = cursor.x;
	this.y = cursor.y;
	this.width = cursor.width;
	this.height = cursor.height;
}

// 外部变量：ctx outputFont window fontColor PROMPT leftWindowMargin cursor
function initViewArea() {
	// the -5 in the two following lines makes the canvas area, just slightly smaller
	// than the entire window.  this helps so the scrollbars do not appear.
	ctx.canvas.width  =  window.innerWidth-5;
	ctx.canvas.height = window.innerHeight-5;

	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);

	ctx.font = outputFont;
	ctx.fillStyle = fontColor;
	var textOut = PROMPT;

	ctx.fillText  (textOut,leftWindowMargin, cursor.y);
	// draw();
}

// 外部变量：ctx window outputFont fontColor allUserCmds
//          promptWidth charWidth lineHeight currentCmd cursor
// function draw()
// {
// 	ctx.canvas.width  = window.innerWidth-5;
// 	ctx.canvas.height = window.innerHeight-5;

// 	ctx.fillStyle = "#000000";
// 	ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
// 	ctx.font = outputFont;
// 	ctx.fillStyle = fontColor;

// 	for (var i=0;i<allUserCmds.length;i++)
// 	{
// 		drawPrompt(i+1);
// 		if (i == 0)
// 		{
// 			xVal = promptWidth;
// 		}
// 		else
// 		{
// 			xVal = promptWidth-charWidth;
// 		}

// 		ctx.font = outputFont;
// 		ctx.fillStyle = fontColor;
// 		for (var letterCount = 0; letterCount < allUserCmds[i].length;letterCount++)
// 		{
// 			ctx.fillText(allUserCmds[i][letterCount], xVal, lineHeight * (i+1));
// 			xVal+=charWidth;
// 		}
// 	}
// 	if (currentCmd != "")
// 	{
// 		drawPrompt(Math.ceil(cursor.y/lineHeight));
// 		ctx.font = outputFont;
// 		ctx.fillStyle = fontColor;
// 		xVal = promptWidth-charWidth;
// 		for (var letterCount = 0; letterCount < currentCmd.length;letterCount++)
// 		{
// 			ctx.fillText(currentCmd[letterCount], xVal, cursor.y);
// 			xVal += charWidth;
// 		}
// 	}
// 	else
// 	{
// 		drawPrompt(Math.ceil(cursor.y/lineHeight));
// 	}
// }

/*
  keyboard handler:
	bsHandler   ->   handler <Backspace>
	etHandler   ->   handler <Enter>
	auHandler   ->   handler <ArrowUp>
	adHandler   ->   handler <ArrowDown>
*/

// 外部变量：cursor promptWidth currentCmd
function bsHandler(e) {
	if (document.activeElement !== 'text') {
		e.preventDefault();
		// promptWidth is the beginning of the line with the repl>
		if (cursor.x > promptWidth)
		{
			blotPrevChar();
			if (currentCmd.length > 0)
			{
				currentCmd = currentCmd.slice(0,-1);
			}
		}
	}
}

// 外部变量：currentPro currentCmd cursor promptWidth charWidth
//          lineHeight allUserCmds
function etHandler(e) {

	currentPro.push(currentCmd);
	if (currentCmd.trim() === "clear") {
		clear();
	}
	else if (currentCmd.slice(-1) === ";") {
		blotOutCursor();
		drawRemainLine();
		cursor.x=promptWidth-charWidth;
		cursor.y+=lineHeight;
		if (currentCmd.length > 0)
		{
			allUserCmds.push(currentCmd);
			currentCmd = "";
		}
	}
	else {
		console.log(currentPro.join(""));
		let result;
		try {
			result = run(currentPro.join(""))
		}
		catch (SchemeError) {
			result = "Error: " + SchemeError.errorMsg;
		}
		blotOutCursor();
		drawNewLine("   " + result);
		cursor.x=promptWidth-charWidth;
		cursor.y+=lineHeight;
		if (currentCmd.length > 0)
		{
			allUserCmds.push(currentCmd);
			currentCmd = "";

			//reset currentCmdind to current index
			currentCmdInd = allUserCmds.length - 1;
		}
		currentPro = [];
	}
}

// 外部变量：currentCmdInd allUserCmds ctx outputFont fontColor PROMPT
//          leftWindowMargin cursor
function adHandler(e) {
	if (currentCmdInd === (allUserCmds.length - 1)) {
		clearCurrLine(0);
		ctx.font = outputFont;
	  ctx.fillStyle = fontColor;
	  ctx.fillText(PROMPT,leftWindowMargin, cursor.y);
	}
	else if (currentCmdInd >= 0 && currentCmdInd <= (allUserCmds.length - 2)) {
		blotOutCursor();
		clearCurrLine();

		currentCmdInd += 1;
		ctx.font = outputFont;
		ctx.fillStyle = fontColor;
		let hisCommand = allUserCmds[currentCmdInd];

		ctx.fillText  (hisCommand.trim(),cursor.x, cursor.y);
		cursor.x += charWidth * (hisCommand.trim().length);
		//currentCmd += hisCommand;
	}
}

// 外部变量：currentCmdInd allUserCmds ctx outputFont fontColor cursor
//          charWidth
function auHandler(e) {
	if (currentCmdInd >= 0 && currentCmdInd <= (allUserCmds.length - 1)) {
		blotOutCursor();
		clearCurrLine();

		ctx.font = outputFont;
		ctx.fillStyle = fontColor;
		let hisCommand = allUserCmds[currentCmdInd]

		ctx.fillText(hisCommand.trim(),cursor.x, cursor.y);
		cursor.x += charWidth * (hisCommand.trim().length);
		//currentCmd += hisCommand;

		currentCmdInd = (currentCmdInd === 0 ? 0 : currentCmdInd - 1);
	}
}

// 外部变量：ctx outputFont PROMPT charWidth cursor lineHeight promptPad
function clearCurrLine(offset) {
	ctx.font = outputFont;
	ctx.fillStyle = "#000000";
	if (offset === undefined) {
		ctx.fillRect(PROMPT.length * charWidth,cursor.y - lineHeight,cursor.x + charWidth,lineHeight + 4);
		cursor.x =  charWidth * PROMPT.length + promptPad;
	}
	else {
		ctx.fillRect(offset,cursor.y - lineHeight,cursor.x + charWidth,lineHeight + 4);
		cursor.x =  charWidth * PROMPT.length + promptPad;
	}
}