const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');
const usersInLobby = document.getElementById('usersInLobby');
const leaveButton = document.getElementById('leaveButton');
const rootElement = document.getElementById('root');

let gameBoard;
let boardCentreForCard;
let playerOnePlace;
let playerTwoPlace;
let playerThreePlace;
let playerFourPlace;
let topCardPlace;
let topCardName;
let previousCard;
let demandedCardVisual;
let chosenColourVisual;

let userName = sessionStorage.getItem('joiningname');
let partyOwnerName;
let lobbyName = sessionStorage.getItem('joininglobbyname');
if(userName == null || lobbyName == null){
    window.location = '/';
}
let users = [];
let deck;
let hand = [];
let possibleCards = [];

let move = false;
let blocked = false;
let turnsToWait = 0;
let jopekToMove = false;
let jopekTurnOnGoing = false;
let asToMove = false;

sessionStorage.clear();

leaveButton.addEventListener('click', leaveLobby);

socket.emit('user-joined-lobby', userName, lobbyName);

function leaveLobby(){
    window.location = '/';
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

function addPlayerToList(playerName){
    const div = document.createElement("div");
    div.classList.add('specificUserInLobby');
    div.id = playerName;
    div.textContent = playerName;
    div.id = playerName;
    usersInLobby.append(div);
}

function addToListIterating(arr){
    for(const name of arr){
        addPlayerToList(name);
        users.push(name);
    }
}

function removeFromArray(arr,value){
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}

function removePlayerFromList(playerName){
    const target = document.getElementById(playerName);
    target.remove();
    let temp = removeFromArray(users, playerName);
    users = temp;
}

function renderCards(cards){
    for(const card of cards){
        let fileName = card + ".png";
        let path = '/public/graphics/' + fileName;
        const img = document.createElement("img");
        img.src = path;
        img.id = card;
        img.draggable = true;
        img.ondragstart = drag;

        playerOnePlace.append(img);
        console.log('cards being rendered');
    }
}

function renderOtherPlayers(){
    for(let i = 0; i<users.length-1; i++){
        if(i%2==0){
            for(let j = 0; j<5; j++){
                let fileName = "rewers.png";
                let path = '/public/graphics/' + fileName;
                const card = document.createElement('img');
                card.src = path;
                card.id = "rewers"+j+","+i;
                card.className = "imgHorizontal";

                if(i==0){
                    playerTwoPlace.append(card);
                }
                if(i==2){
                    playerFourPlace.append(card);
                }
            }
        }
        else{
            for(let j = 0; j<5; j++){
                let fileName = "rewers.png";
                let path = '/public/graphics/' + fileName;
                const card = document.createElement('img');
                card.src = path;
                card.id = "rewers"+j+","+i;
                card.className = "imgVertical";

                playerThreePlace.append(card);
            }
        }
    }
}

function addVerticalCard(card, playerId){
    let fileName = card + ".png";
    let path = "/public/graphics/" + fileName;
    
    const img = document.createElement('img');
    img.src = path;
    img.id = card;
    img.draggable = true;
    img.ondragstart = drag;
    img.className = "imgVertical";

    if(playerId == 1){
        playerOnePlace.append(img);
    }
    if(playerId == 3){
        playerThreePlace.append(img);
    }
}

function addHorizontalCard(card, playerId){
    let fileName = card + ".png";
    let path = "/public/graphics/" + fileName;
    
    const img = document.createElement('img');
    img.src = path;
    img.id = card;
    img.draggable = true;
    img.ondragstart = drag;
    img.className = "imgHorizontal";

    if(playerId == 2){
        playerTwoPlace.append(img);
    }
    if(playerId == 4){
        playerFourPlace.append(img);
    }
}

function newCardOnTop(newCard){
    const prevTopCard = boardCentreForCard.firstChild;
    prevTopCard.remove();
    
    const card = document.createElement('img');
    card.id = 'topCard';
    card.src = '/public/graphics/' + newCard + '.png';
    card.className = 'imgVertical';
    boardCentreForCard.append(card);
}

function allowDrop(ev) {
    ev.preventDefault();
}
  
function drag(ev) {
    if(move){
        ev.dataTransfer.setData("text", ev.target.id);
    }
}
  
function drop(ev) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    console.log(data);
    if(possibleCards.includes(data)){   
        if(jopekTurnOnGoing){
            socket.emit('remove-demanded-card-visual', lobbyName);
            jopekTurnOnGoing = false;
        }
        newCardOnTop(data);
        let newCardFigure = getCardFigure(data);
        previousCard = topCardName;

        const oldCardToRemove = document.getElementById(data);
        oldCardToRemove.remove();

        if(newCardFigure != "jopek" && newCardFigure != "as"){
            socket.emit('new-card-on-top', lobbyName, userName, data, topCardName);
        }else{
            if(newCardFigure == "jopek"){
                jopekToMove = true;
                jopekTurnOnGoing = true;
            }
            else if(newCardFigure == "as"){
                asToMove = true;
            }
        }
        move = false;
        topCardName = data;
        
        let removalIndex = hand.indexOf(data);
        hand.splice(removalIndex, 1);
    }
}

function drawCard(){
    if(move){
        socket.emit('draw-request', lobbyName);
    }
}

function sendChosenCard(){
    if(jopekToMove){
        let select = document.getElementById("selectCard");

        socket.emit("cardGotSelected", select.value, topCardName, previousCard, userName, lobbyName);
        jopekToMove = false;
    }
}

function sendChosenColour(){
    if(asToMove){
        let select = document.getElementById("selectColour");

        socket.emit("colourGotSelected", select.value, topCardName, previousCard, userName, lobbyName);
        asToMove = false;
    }
}

function changeColourVisual(colour){
    let stringToChange = chosenColourVisual.textContent;
    let afterSlice = stringToChange.slice(0,6);
    afterSlice += colour;
    chosenColourVisual.textContent = afterSlice;
}

function getCardFigure(card){
    let colour = getCardColour(card);
 
    return card.replace(colour, '');
}

function changeDemandedCardVisual(figure){
    let stringToChange = demandedCardVisual.textContent;
    let afterSlice = stringToChange.slice(0,13);
    afterSlice += figure;
    demandedCardVisual.textContent = afterSlice;
}

function getCardColour(card){
    if(card.includes('pik')) return 'pik';
    if(card.includes('trefl')) return 'trefl';
    if(card.includes('karo')) return 'karo';
    if(card.includes('kier')) return 'kier';
}

socket.on('user-info-receiver', (owname, usersIn) => {
    partyOwnerName = owname;

    addToListIterating(usersIn);

    title.textContent = `${lobbyName}, lobby gracza ${partyOwnerName}`;
    yourNick.textContent = `Twój nick: ${userName}`;
    socket.emit('add-to-list-attempt', userName, lobbyName);
});

socket.on('add-to-list', (uname) => {
    if(!users.includes(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
});

socket.on('owner-left-kick-all', () => {
    leaveLobby();
})

socket.on('remove-user-from-list', (uname) => {
    removePlayerFromList(uname);
});

socket.on('load-game-for-lobby', ()=>{
    rootElement.remove();
    document.title = "Makao i po makale";

    const tempBoard = document.createElement('div');
    tempBoard.id = 'gameBoard';

    document.body.append(tempBoard);
    gameBoard = document.getElementById('gameBoard');

    const playerOne = document.createElement("div");
    playerOne.id = 'player1';
    playerOnePlace = playerOne;
    gameBoard.append(playerOne);

    const playerTwo = document.createElement("div");
    playerTwo.id = 'player2';
    playerTwoPlace = playerTwo;
    gameBoard.append(playerTwo);

    const playerThree = document.createElement("div");
    playerThree.id = 'player3';
    playerThreePlace = playerThree;
    gameBoard.append(playerThree);

    const playerFour = document.createElement("div");
    playerFour.id = 'player4';
    playerFourPlace = playerFour;
    gameBoard.append(playerFour);

    const drawButton = document.createElement('button');
    drawButton.textContent = "DOBIERZ";
    drawButton.id = "drawButton";
    drawButton.addEventListener('click', drawCard);
    gameBoard.append(drawButton);

    const labelForDemandedCard = document.createElement('label');
    labelForDemandedCard.className = "demandedCard";
    labelForDemandedCard.htmlFor = "demandedCards";
    labelForDemandedCard.id = "labelDemandedCard";
    labelForDemandedCard.textContent = "Wybierz kartę: ";
    gameBoard.append(labelForDemandedCard);

    const selectDemandedCard = document.createElement('select');
    selectDemandedCard.className = "demandedCard";
    selectDemandedCard.name = "demandedCards";
    selectDemandedCard.id = "selectCard";
    gameBoard.append(selectDemandedCard);

    for(let i = 5; i<=10; i++){
        const option = document.createElement('option');
        option.value = ""+i;
        option.textContent = ""+i;
        selectDemandedCard.append(option);
    }

    const submit = document.createElement('button');
    submit.id = "submitChoice";
    submit.className = "demandedCard";
    submit.textContent = "WYBIERZ";
    submit.addEventListener('click', (e)=>sendChosenCard());
    gameBoard.append(submit);

    const labelForColourChoice = document.createElement('label');
    labelForColourChoice.className = "colourChoice";
    labelForColourChoice.htmlFor = "colourList";
    labelForColourChoice.id = "labelColour";
    labelForColourChoice.textContent = "Wybierz kolor: ";
    gameBoard.append(labelForColourChoice);

    const selectColour = document.createElement('select');
    selectColour.className = "colourChoice";
    selectColour.id = "selectColour";
    selectColour.name = "colourList";
    gameBoard.append(selectColour);

    for(const col of ["pik","kier","karo","trefl"]){
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        selectColour.append(option);
    }

    const submitColour = document.createElement('button');
    submitColour.id = "submitColour";
    submitColour.className = "colourChoice";
    submitColour.textContent = "WYBIERZ";
    submitColour.addEventListener('click', (e)=>sendChosenColour());
    gameBoard.append(submitColour);

    const demandedCardText = document.createElement('h3');
    demandedCardText.textContent = "Żądana karta:  ";
    demandedCardText.id = 'demandedCardInfo';
    gameBoard.append(demandedCardText);
    demandedCardVisual = demandedCardText;

    const colourChoiceText = document.createElement('h3');
    colourChoiceText.textContent = "Kolor:";
    colourChoiceText.id = "colourChoiceInfo";
    gameBoard.append(colourChoiceText);
    chosenColourVisual = colourChoiceText;
});

socket.on('deck-sent', (deckSent)=>{
    deck = deckSent;
});

socket.on('hand-sent', (handSent)=>{
    hand = handSent;
    renderCards(hand);
    renderOtherPlayers();
    console.log('deck received');
});

socket.on('kick-player-from-lobby', (pname)=>{
    console.log('received on user side');
    if(pname==userName){
        leaveLobby();
    }
});

socket.on('top-card', (card)=>{
    topCardName = card;

    const boardCentre = document.createElement('div');
    boardCentre.id = 'boardCentre';
    boardCentre.ondrop = drop;
    boardCentre.ondragover = allowDrop;
    boardCentreForCard = boardCentre;
    gameBoard.append(boardCentre);

    const topCard = document.createElement('img');
    topCard.id = 'topCard';
    topCard.src = '/public/graphics/' + card + '.png';
    topCard.className = "imgVertical";
    topCardPlace = topCard;
    boardCentre.append(topCard);
});

socket.on('first-move', (uname) => {
    if(uname == userName){
        alert("it's my move");
        move = true;

        socket.emit('count-possibilities', hand, lobbyName);
    }
});

socket.on('possible-cards', (cards)=>{
    possibleCards = cards;

    console.log(possibleCards);
});

socket.on('new-move', (userMoving) => {
    if(userName == userMoving){
        if(!blocked){
            possibleCards = [];

            move = true;
            alert('its my move!');
            console.log(topCardName);
            socket.emit('count-possibilities', hand, lobbyName, userName);
        }
        else{
            socket.emit('move-without-new-card', lobbyName, userName);
            turnsToWait--;
            if(turnsToWait==0) {
                blocked = false;
            }
        }
    }
});

socket.on('change-top-card', (uname, card) => {
    if(userName != uname){
        newCardOnTop(card);
        topCardName = card;
    }
});

socket.on('pull-card', (card) => {
    if(jopekTurnOnGoing){
        socket.emit('remove-demanded-card-visual', lobbyName);
        socket.emit('remove-card-demander', lobbyName);
        jopekTurnOnGoing = false;
    }
    let tempHand = hand;
    tempHand.push(card);
    hand = tempHand;
    addVerticalCard(card, 1);
    socket.emit('move-without-new-card', lobbyName, userName);
    move = false;
});

socket.on('special-pull', (cards)=>{
    let tempHand = hand;
    for(const card of cards){
        tempHand.push(card);
        addVerticalCard(card, 1);
    }
    hand = tempHand;
    socket.emit('move-without-new-card', lobbyName, userName);
    move = false;
});

socket.on('im-blocked', (turns)=>{
    if(turns>1){
        blocked = true;
        turnsToWait = turns;
    }
    socket.emit('move-without-new-card', lobbyName, userName);
});

socket.on('remove-one-card', (uname, index)=>{
    if(uname != userName){
        let indexOfUser = users.indexOf(userName);
        let lobbySize = users.length;
        if(index == 0){
            let ownerCard = playerTwoPlace.firstChild;
            ownerCard.remove();
        }else{
            if(lobbySize==3){
                let card = playerThreePlace.firstChild;
                card.remove();
            }else{
                if(indexOfUser==1){
                    if(index==2){
                        let card = playerThreePlace.firstChild;
                        card.remove();
                    }
                    else if(index==3){
                        let card = playerFourPlace.firstChild;
                        card.remove();
                    }
                }
                else if(indexOfUser==2){
                    if(index==1){
                        let card = playerThreePlace.firstChild;
                        card.remove();
                    }
                    else if(index==3){
                        let card = playerFourPlace.firstChild;
                        card.remove();
                    }
                }else{
                    if(index==1){
                        let card = playerThreePlace.firstChild;
                        card.remove();
                    }else if(index==2){
                        let card = playerFourPlace.firstChild;
                        card.remove();
                    }
                }
            }
        }
    }
});

socket.on('demandedCard', (cardFigure)=>{
    changeDemandedCardVisual(cardFigure);
});

socket.on('remove-visual', ()=>{
    changeDemandedCardVisual("");
    console.log(`removing visual`);
});

socket.on("selectedColourInfo", (colour)=>{
    changeColourVisual(colour);
});

socket.on("remove-colour", ()=>{
    changeColourVisual("");
});

socket.on('addCards', (cards, uname)=>{
    if(uname != userName){
        let indexOfUser = users.indexOf(userName);
        let index = users.indexOf(uname);
        let lobbySize = users.length;
        if(index == 0){
            for(let i = 0; i<cards.length; i++){
                addHorizontalCard("rewers",2);
            }
        }else{
            if(lobbySize==3){
                for(let i = 0; i<cards.length; i++){
                    addVerticalCard("rewers",3);
                }
            }else{
                if(indexOfUser==1){
                    if(index==2){
                        for(let i = 0; i<cards.length; i++){
                            addVerticalCard("rewers",3);
                        }
                    }
                    else if(index==3){
                        for(let i = 0; i<cards.length; i++){
                            addHorizontalCard("rewers",4);
                        }
                    }
                }
                else if(indexOfUser==2){
                    if(index==1){
                        for(let i = 0; i<cards.length; i++){
                            addVerticalCard("rewers",3);
                        }
                    }
                    else if(index==3){
                        for(let i = 0; i<cards.length; i++){
                            addHorizontalCard("rewers",4);
                        }
                    }
                }else{
                    if(index==1){
                        for(let i = 0; i<cards.length; i++){
                            addVerticalCard("rewers",3);
                        }
                    }else if(index==2){
                        for(let i = 0; i<cards.length; i++){
                            addHorizontalCard("rewers",4);
                        }
                    }
                }
            }
        }
    }
});