var N = 4;
var margin = 5;
var squareWidth = 105;
var squareHeight = squareWidth / 2;
var groupBoxHeight = squareHeight + margin;
var inputBoxHeight = 30;
var groupBoxHeightExpanded = squareHeight + inputBoxHeight + margin * 2;
var selection = [];
var numDone = 0;
var groups = [];
var div;
var board;
var solvedBoards = [];
var connections = '';
var currBoard = -1;
var expandedGroupBoxes = [];
var numPoints;
var focusedField = -1;
var numPages;
var currPage = 0;
var maxBoardsPerPage = 39;
for (var i = 0; i < N; i++) {
    expandedGroupBoxes[i] = false;
}
var useStorage = (typeof(Storage) !== "undefined");
var gridHeight;
function Board(height,width,groups,boardState) {
    this.height = height;
    this.width = width;
    this.grid = new Array();
    
    array = [];
    groupOrder = boardState[0].concat(boardState[1]);
    for (var i = 0; i < height; i++) {
	if (groupOrder.indexOf(i) == -1) {
	    groupOrder.push(i);
	}
    }
    for (var i=0; i<height; i++) {
	for (var j = 0; j < width; j++) {
	    array[i * width + j] = [groupOrder[i], j];
	}
    }
    randArr = randomArray(array, (boardState[0].length + boardState[1].length) * width);
    for (var i=0; i<height; i++) {
	this.grid[i] = [];
	for (var j=0; j<width; j++) {
	    this.grid[i][j] = randArr[width * i + j];
	}
    }
}
$(document).ready(function() {
	solvedBoardsCookie = getCookie("solvedBoards");
	if (solvedBoardsCookie != "") {
	    solvedBoards = JSON.parse(solvedBoardsCookie);
	}
	currBoard = parseInt(getUrlParameter('id'));
	if (currBoard == -1) {
	    welcomeMsg();
	}
	else {
	    showBoard(currBoard);
	}
	(function($){
	    $.fn.disableSelection = function() {
		return this
		.attr('unselectable', 'on')
		.css('user-select', 'none')
		.on('selectstart', false);
	    };
	})(jQuery);
	$('body').disableSelection();
	$('body').keydown(keydown);
    });
function showHelp() {
    $('#msgTitle').html('איך משחקות?');
    $('#msgContainer').show().animate({opacity: 1}, 200);
    $('#brighten').show().animate({opacity: 0.8}, 200);
    $('#msgTxt').empty();
    $('#msgTxt').html('<div style="color: white; font-size: 60%; line-height: normal;"><p>טוב ששאלת. בכל לוח  יש שישה-עשר רמזים אותם יש לחלק לארבע קבוצות.</p>' +
		      '<p>לכל קבוצה יש מכנה משותף.</p>' +
		      '<p>יש פתרון אחד נכון.</p>' +
		      '<p>הגיגול אינו מומלץ.</p>' +
		      '<p>בהצלחה.</p><div>');
}
function resetBox() {
    $('#msgTitle').html('איפוס לוח');
    $('#msgContainer').show().animate({opacity: 1}, 200);
    $('#brighten').show().animate({opacity: 0.8}, 200);
    $('#msgTxt').empty();
    $('#msgTxt').html('<div style="color: white; font-size: 60%; line-height: normal;"><p class="msgBoxTxt">פעולה זו תאפס את הלוח. את בטוחה שזה רצונך?</p>' +
		      '<div class="squareLink" onclick="reset();">כן</div><div class="squareLink" onclick="closeMsg()">לא</div>');
}
function winBox() {
    $('#msgTitle').html('ניצחת!');
    $('#msgContainer').show().animate({opacity: 1}, 500);
    $('#brighten').show().animate({opacity: 0.8}, 500);
    $('#msgTxt').empty();
    $('#msgTxt').html('<div style="color: white; font-size: 60%; line-height: normal;"><p class="msgBoxTxt">שלל ברכות ואיחולים. רוצה עוד?</p>' +
		      '<div class="squareLink" onclick="chooseBoard();">כן!</div>');
}
function welcomeMsg() {
    window.history.replaceState("whatevz","פרופסור","/");
    $("#pointBox").html("0 נקודות")
    $('#grid').html('<div id="welcomeHeader">ברוכה הבאה לפרופסור!</div><div id="welcomeTxt">בחרי לוח והתחילי לשחק!<br>לקבלת עדכונים: <a id="fbButton" class="squareLink" href="https://www.facebook.com/professoramiacyborg" target="_blank">f</a></div>');
}
function closeMsg() {
    $('#msgContainer').animate({opacity: 0}, 200, function() {
	    $('#msgContainer').hide();  
	    $('#brighten').hide();
	});
    $('#brighten').animate({opacity: 0}, 200);
}
function boardScroll(left) {
    if (left) {
	if (currPage + 1 < numPages) {
	    $('#page' + currPage).animate({left: 510});
	    currPage ++;
	    $('#page' + currPage).animate({left: 0});
	}
    }
    else {
	if (currPage > 0) {
	    $('#page' + currPage).animate({left: -510});
	    currPage --;
	    $('#page' + currPage).animate({left: 0});
	}
    }
}
function chooseBoard() {
    $.get("cgi-bin/getBoards.py",{}, function(a) {
	    $('#msgTitle').html('בחרי לוח');
	    $('#msgContainer').show().animate({opacity: 1}, 300);
	    $('#brighten').show().animate({opacity: 0.8}, 200);
	    data = eval('('+a+')');
	    $('#msgTxt').empty();
	    $('#msgTxt').append('<div id="page0" class="boardPage"></div>');
	    numPages = 1;
	    currPage = 0;
	    var numBoardsInPage = 0;
	    for (var i=0; i<data.boards.length; i++) {
		if (numBoardsInPage == maxBoardsPerPage) {
		    if (numPages == 1) {
			$('#msgTxt').append('<div id="scrollLeft" class="roundButton" onclick="boardScroll(true);">›</div>' +
					    '<div id="scrollRight" class="roundButton" onclick="boardScroll(false);">‹</div>');
		    }
		    $('#msgTxt').append('<div id="page' + numPages + '" class="boardPage" style="left: -510px;"></div>');
		    numPages ++;
		    numBoardsInPage = 0;
		}
		solved = (solvedBoards.indexOf(data.boards[i]) != -1);
		var boardStateStr = getCookie("boardState" + data.boards[i]);
		var fill = "";
		if (!solved && boardStateStr != "") {
		    var boardState = JSON.parse(boardStateStr);
		    var numPoints = boardState[0].length * 2 + boardState[1].length;
		    fill = '<div class="boardLinkFill" style="height: ' + (numPoints/8) * 30 + ';"/>';
		}
		$('#page' + (numPages - 1)).append('<div class="boardLink ' + (solved ? "solved" : "unsolved") + '" onclick="showBoard('+data.boards[i]+','+(i+1).toString()+');"><div class="boardLinkTxt">'+(i+1)+'</div>' + fill + '</div>');
		numBoardsInPage ++;
	    }
	});
}
function showBoard(id, boardNum) {
    closeMsg();
    $.get("cgi-bin/retrieve.py",{id: id}, function(a){
	    dictData = JSON.parse(a);
	    groups=eval(unescape(dictData['board']));
	    connectionsRaw = eval(unescape(dictData['connections']));
	    connections = [];
	    if (connectionsRaw != undefined)
	    for (var i=0; i<N; i++) {
		connections[i] = connectionsRaw[i].replace(/(&#39;|׳)/g,"'").replace(/(״)/g,"\"").split("!");
		if (connections[i][connections[i].length-1] == "") {
		    connections[i].pop();
		}
		if (connections[i][0] == "") {
		    connections[i].shift();
		}
	    }
	    var boardStateCookie = getCookie("boardState" + id);
	    var boardState = [[], []];
	    if (boardStateCookie != "") {
		boardState = JSON.parse(boardStateCookie);
	    }
	    board = new Board(N,N,groups,boardState);
	    selection = [];
	    numDone = boardState[0].length + boardState[1].length;
	    numPoints = boardState[0].length * 2 + boardState[1].length;
	    $("#pointBox").html(numPoints + " נקודות");
	    div = $('#grid').empty();
	    displayGrid(boardState[0], boardState[1]);
	    currBoard = id;
	    window.history.replaceState("whatevz","פרופסור","/?id="+id);
	    bnum = dictData['bnum'];
	    if (bnum == -1) {
	        bnum = "סודי";
	    }
	    document.title = "פרופסור - לוח "+bnum
	});
}
function displayGrid(completedGroups, missingConnection) {
    for (var i = 0; i < N; i++) {
	expandedGroupBoxes[i] = (missingConnection.indexOf(board.grid[i][0][0]) != -1);
	if (i < numDone) {
	    addGroupBox(i, false, (completedGroups.indexOf(board.grid[i][0][0]) != -1));
	}
    }
    gridHeight = heightOfBoxesAbove(N) + margin * N;
    $('#grid').css('height',gridHeight);
    $("#container").css('height', gridHeight + 10);
    for (var i=0; i<board.height; i++) {
	for (var j=0; j<board.width; j++) {
	    createSquareElement(i,j);
	}
    }
    
}

function reset() {
    localStorage.setItem('boardState' + currBoard, JSON.stringify([[],[]]));
    var ind = solvedBoards.indexOf(currBoard);
    if (ind > 0) {
	solvedBoards.splice(ind,1);
	if (useStorage) {
	    localStorage.setItem("solvedBoards",JSON.stringify(solvedBoards));
	}
    }
    showBoard(currBoard);
}

function createSquareElement(i,j) {
    var square = document.createElement('div');
    square.setAttribute('style','position:absolute; top:'+(margin * (i + 1) + heightOfBoxesAbove(i))+'px; left:'+(margin+(margin+squareWidth)*j)+'px; width: '+squareWidth+'px; height: '+squareHeight+'px; color: white; text-align: center; line-height: '+squareHeight+'px; vertical-align: middle;');
    square.setAttribute('class','square' + ((i < numDone) ? ' finished' : ''));
    square.setAttribute('id','row'+i+'col'+j);
    square.setAttribute('onmouseup',(i < numDone) ? 'function(){}' : ('clickSquare('+i+','+j+')'));
    var span = document.createElement('span');
    span.setAttribute('class','text');
    inds = board.grid[i][j];
    var text = document.createTextNode(groups[inds[0]][inds[1]].replace(/(&#39;|׳)/g,"'"));
    span.appendChild(text);
    square.appendChild(span);
    div.append(square);
    
}
function addGroupBox(boxId, animate, complete) {
    $("#grid").append('<div id="groupbox'+boxId+'" class="unsolved-groupbox"' +
		      ' style="opacity: ' + (animate ? 0 : 1) + '; height: '+ ((animate || complete) ? groupBoxHeight : groupBoxHeightExpanded) + 'px; top: ' +
		      (margin * (0.5 + boxId) + heightOfBoxesAbove(boxId)) +'px;">' +
		      '<input value="מה הקשר?" id="connection' + boxId +'" class="groupInput" style="opacity: ' + ((animate || complete) ? 0 : 1) + ';"/>' +
		      '<a class="roundButton" id="roundButton' + boxId + '" style="opacity: ' + ((animate || complete) ? 0 : 1) + '; background-color: rgb(35,78,43);" onclick="submitConnection('+boxId+');">↩</a>' +
		      '</div>');
    $('#connection' + boxId).focus(function() {
	    focusedField = boxId;
	    if ($('#connection' + boxId).val() == "מה הקשר?") {
		$('#connection' + boxId).val("");
	    }
	});
    $('#connection' + boxId).blur(function() {
	    if ($('#connection' + boxId).val() == "") {
		$('#connection' + boxId).val("מה הקשר?");
	    }
	});
    if (animate) {
	$("#groupbox" + boxId).animate({opacity: 1}, 1000, function() {
		$("#groupbox" + boxId).animate({
			height: groupBoxHeightExpanded},500, function(){
			if (boxId == N - 2) {
			    
			    addGroupBox(N - 1, true, false);
			}
		    });
		$('#connection' + boxId).animate({opacity: 1}, 500);
		$('#roundButton' + boxId).animate({opacity: 1}, 500);
		saveBoard();
		repositionAllSquares();
		if (boxId == N - 2) {
		    expandedGroupBoxes[N-1] = true;
		}
	    });
    }
}
function submitCategory() {
    setTimeout(function(){
	    var sameGroup = true;
	    var group = board.grid[selection[0][0]][selection[0][1]][0];
	    for (var k = 0; k < N; k++) {
		$('#row'+selection[k][0]+'col'+selection[k][1]).removeClass('selected');
		if (k > 0 && group != board.grid[selection[k][0]][selection[k][1]][0]) {
		    sameGroup = false;
		}
	    }
	    if (sameGroup) {
		addGroupBox(numDone, true, false);
		var offset = 0;
		for (var k = 0; k < N; k++) {
		    if (board.grid[numDone][k][0] != group) {
			while (selection[offset][0] == numDone) {
			    offset ++;
			}
			src = selection[offset];
			temp = board.grid[numDone][k];
			board.grid[numDone][k] = board.grid[src[0]][src[1]];
			board.grid[src[0]][src[1]] = temp;
			$('#row'+src[0]+'col'+src[1]).attr('id', 'temp'+k).addClass('finished').attr('onmouseup','function(){}');
			$('#row'+numDone + 'col' + (k)).attr('id','row'+src[0] + 'col' + src[1]).attr('onmouseup','clickSquare('+src[0]+','+src[1]+');');
			$('#' + 'temp'+k).attr('id','row'+numDone+'col'+(k));
			offset ++;
		    }
		    else {
			$('#row'+numDone+'col'+k).addClass('finished');
		    }
		}
		repositionAllSquares();
		expandedGroupBoxes[numDone] = true;
		numDone ++;
		winPoints(1);
		if (numDone == N - 1) {
		    numDone ++;
		    winPoints(1);
		    for (var k = 0; k < N; k++) {
			$('#row'+(N - 1)+'col'+k).addClass('finished').attr('onmouseup','function(){}');
		    }
		}
	    }
	    selection = [];
	}, 200);
}
function keydown(event) {
    if (event.which == 13 || event.keyCode == 13) {
	//Enter key
	if ($('#connection' + focusedField + ":focus").length) {
	    submitConnection(focusedField);
	}
	return false;
    }
    if (event.which == 27 || event.keyCode == 27) {
	//Esc key
	closeMsg();
	return false;
    }
    return true;
}
function submitConnection(c) {
    var v = $('#connection' + c).val().replace("׳","'").replace(/(״)/g,"\"");
    var group = board.grid[c][0][0];
    var validAnswer = false;
    var vSplit = v.split(" ");
    for (var i = 0; i < connections[group].length; i++) {
	var conSplit = connections[group][i].split(" ");
	for (var j = 0; j < vSplit.length - conSplit.length + 1; j++) {
	    var thisIsTheOne = true;
	    for (var k = 0; k < conSplit.length; k++) {
		if (vSplit[j+k] != conSplit[k]) {
		    thisIsTheOne = false;
		}
	    }
	    if (thisIsTheOne) {
		validAnswer = true;
		break;
	    }
	}
	if (validAnswer) {
	    break;
	}
    }
    if (validAnswer) {
	focusedField = -1;
	$("#roundButton" + c).html("✓").animate({backgroundColor: "rgb(255,0,0)"}, 500,function(){
		$("#roundButton" + c).animate({opacity: 0});
		$("#connection" + c).animate({opacity: 0});
		$("#groupbox" + c).animate({height: groupBoxHeight}, 500);
		expandedGroupBoxes[c] = false;
		saveBoard();
		repositionAllSquares();
	    });
	winPoints(1);
	if (numPoints == N * 2) {
	    if (solvedBoards.indexOf(currBoard) == -1) {
		solvedBoards.push(currBoard);
		if (useStorage) {
		    localStorage.setItem("solvedBoards",JSON.stringify(solvedBoards));
		}
	    }
	    $.get("cgi-bin/win.py",{id: currBoard});
	    setTimeout(winBox, 500);
	}
    }
    else {
	$("#roundButton" + c).html("✗").animate({backgroundColor: "rgb(255,0,0)"}, 500,"easeOutQuint",function() {
		$("#roundButton" + c).animate({backgroundColor: "rgb(35, 78, 43)"}, 500,"easeInQuint",function() {
			$("#roundButton" + c).html("↩");
		    });
	    });
    }
}
function winPoints(howMany) {
    numPoints += howMany;
    $("#pointBox").html(numPoints + " נקודות").animate({backgroundColor: "white"},500,function (){
	    $("#pointBox").animate({backgroundColor: "rgb(199, 231, 203)"});
	});
}
function repositionAllSquares() {
    for (var y = 0; y < N; y++) {
	heightOfBoxesAboveY = heightOfBoxesAbove(y);
	for (var x = 0; x < N; x ++) {
	    $('#row'+y + 'col' + x).animate({
		    top: margin * (y + 1) + heightOfBoxesAboveY,
			left: (margin+(margin+squareWidth)*x)
			}, 500);
	}
    }
    for (var i = 0; i < numDone; i++) {
	$("#groupbox" + i).animate({
		top: (margin * (0.5 + i) + heightOfBoxesAbove(i))
		    }, 500);
    }
    gridHeight = margin * N + heightOfBoxesAbove(N);
    $("#container").animate({height: gridHeight + 10}, 500);
    $("#grid").animate({height: gridHeight}, 500);
}
function heightOfBoxesAbove(i) {
    var numExpandedAboveI = numExpandedAbove(i);
    return numExpandedAboveI * groupBoxHeightExpanded + (i - numExpandedAboveI) * groupBoxHeight;
}
function numExpandedAbove(i) {
    var res = 0;
    for (var j = 0; j < i; j++) {
	if (expandedGroupBoxes[j]) {
	    res ++;
	}
    }
    return res;
}
function clickSquare(i,j) {
    if (i < numDone) {
	return;
    }
    for (var k = 0; k < selection.length; k++) {
	if (selection[k][0] == i && selection[k][1] == j) {
	    selection.splice(k,1);
	    $('#row'+i+'col'+j).removeClass('selected');
	    return
	}
    }
    selection.push([i,j]);
    $('#row'+i+'col'+j).addClass('selected');
    if (selection.length == N) {
	submitCategory();
    }
}
function randomArray(array, numToSkip) {
    var counter = array.length, temp, index;
    // While there are elements in the array
    while (counter > numToSkip) {
        // Pick a random index
        index = numToSkip + Math.floor(Math.random() * (counter-numToSkip));
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}
function saveBoard() {
    var completedGroups = [];
    var missingConnection = [];
    for (var i = 0; i < numDone; i++) {
	if (expandedGroupBoxes[i]) {
	    missingConnection.push(board.grid[i][0][0]);
	}
	else {
	    completedGroups.push(board.grid[i][0][0]);
	}
    }
    if (useStorage) {
	localStorage.setItem('boardState' + currBoard, JSON.stringify([completedGroups,missingConnection]));
    }
}
function getCookie(cname) {
    if (useStorage) {
	res = localStorage.getItem(cname);
	if (res != null) {
	    return res;
	}
    }
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) 
	{
	    var c = ca[i].trim();
	    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
    return "";
}
function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
    return '-1';
}