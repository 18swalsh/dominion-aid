//02035

//fix required
//START CARDS: some are not accounted for - Hovel, Necropolis, etc. show up weird
//MASQUERADE: throws off pass/trash
//CHG01548: grouping bug (2 courtyards gained in 1 turn led to a separate courtyard entry)
//              ("0 Estate",....,"3 Estate")
//              ("4 Plaza",.....,"2 Plaza")
//              this may be in groupCards() parseInt(cardList[i].slice(0,1)) <--1 when it should be 2 and trimmed
//trashing error - gladiator count incorrect
//                 silver count incorrect
//CHG01546: LURKER - trash/gain thrown off by lurker
//trashing cards from the supply registers as trashing from hand (except Lurker CHG01546)
//plural journeymen
//haunted mirror not registering as trashed
// -"13 Experiments"
//Magic Lamp not registered as exchanged

//nice to have
//CHG01547 identify home vs. away colors
//calculate max buying power
//calculate engine power/cycle power
//Salt of the Earth registering trashing of supply victory cards as trashing from hand

//solved
//CHG01543: fortresses do not get trashed
//CHG01543: plural error: "fortesse" - only applying to some of the fortresses in the deck
//CHG01542: plural error: Oases -- to test: gain multiple oasis cards on the same turn
//CHG01544: Page --> Champion stream results in "0 Page" (also applies to Peasant ->)
//CHG01544:            "returns" / "receives"
//CHG01545: BOONS/HEXES - showing up as gained cards
//CHG01546: not working

//major enhancements
//get discard pile vs remaining deck

var victoryCards = ["Estate","Duchy","Province","Colony","Vineyard","Tunnel","Gardens","Mill","Island","Silk Road", "Feodum", "Cemetery","Duke","Dame Josephine","Distant Lands","Harem","Nobles","Fairgrounds","Farmland","Overgrown Estate","Pasture"];
var treasureCards = ["Copper","Silver","Gold","Platinum","Spoils","Diadem","Haunted Mirror","Magic Lamp","Goat","Pasture","Pouch","Cursed Gold","Pasture","Lucky Coin","Harem","Hoard","Quarry","Talisman","Rocks","Masterpiece","Humble Castle","Loan","Contraband","Royal Seal","Horn of Plenty","Cache","Ill-Gotten Gains","Relic","Treasure Trove","Plunder","Capital","Charm","Idol","Scepter","Spices","Stash","Ducat","Coin of the Realm","Fool's Gold","Philosopher's Stone","Potion","Venture","Counterfeit","Crown","Bank","Fortune"]

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    src = request.source;

    //CHG01547
    //var reName
    //var blName

    var reStart = new RegExp(/(?<=color:red.*starts with.*">)\w.*(?=<\/span><)/gm);
    var reShelters = new RegExp(/\w+ ?\w+ ?\w+<\/span/gm);
    var reGain = new RegExp(/(?<=color:red.*(gains|receives).*">)\w.*(?=<\/span><)/gm); //CHG01544
    var reTrash = new RegExp(/(?<=color:red.+(trashes|returns).+')\w+/gm); //CHG01544
    var reTrashList;
    var blTrashList;
    var reGainList;
    var blGainList;
    var reCardCount = 0;
    var blCardCount = 0;

    var blGain = new RegExp(/(?<=color:rgb.*(gains|receives).*">)\w.*(?=<\/span><)/gm);
    var blTrash = new RegExp(/(?<=color:rgb.+(trashes|returns).+')\w+/gm);

    var startList = src.match(reStart).sort();
    var displayMsg = "*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*"; // = "Start List: " + groupCards(startList);




    //gains appears twice in html before game starts
    try {
        if (src.match(reGain).length > 2) {
            reGainList = src.match(reGain).sort();
            reGainList = groupCards(reGainList);
            blGainList = src.match(blGain).sort();
            blGainList = groupCards(blGainList);
            //displayMsg = displayMsg + "\r\n" + "Red Gain List: " + reGainList;
            //displayMsg = displayMsg + "\r\n" + "Blue Gain List: " + blGainList;
        }
    }
    catch(e){
        console.log(e)
    }





    //if any cards have been trashed
    try {
        if (src.match(reTrash).length > 0 || src.match(blTrash).length > 0) {
            //create red trash list
            try {
                reTrashList = src.match(reTrash).sort();
                //finds "Copper","Estate" --> change to "1 Copper", "1 Estate"
                for (var i = 0; i < reTrashList.length; i++) {
                    reTrashList[i] = "1 " + reTrashList[i];
                }
                reTrashList = groupCards(reTrashList)
                reTrashList = bounceFortress(reTrashList)
                //displayMsg = displayMsg + "\r\n" + "Red Trash List: " + reTrashList;
            }
            catch(e){
                console.log(e)
            }
            //create blue trash list
            try {
                blTrashList = src.match(blTrash).sort();
                //finds "Copper","Estate" --> change to "1 Copper", "1 Estate"
                for (var i = 0; i < blTrashList.length; i++) {
                    blTrashList[i] = "1 " + blTrashList[i];
                }
                blTrashList = groupCards(blTrashList)
                blTrashList = bounceFortress(blTrashList)
                //displayMsg = displayMsg + "\r\n" + "Blue Trash List: " + blTrashList;
            }
            catch(e){
                console.log(e)
            }
        }
    }
    catch(e){
        console.log(e)
    }






    //combine start list with gain list
    var reAccumList = startList.concat(reGainList);
    //sort by card name
    reAccumList.sort(function(x,y) {
  	    if (x[2] < y[2]) {
    	    return -1;
        }
    });
    reAccumList = groupCards(reAccumList)

    var blAccumList = startList.concat(blGainList);
    //sort by card name
    blAccumList.sort(function(x,y) {
  	    if (x[2] < y[2]) {
    	    return -1;
        }
    })
    blAccumList = groupCards(blAccumList)

    //displayMsg = displayMsg + "\r\n" + "Red Accum List: " + reAccumList;
    //displayMsg = displayMsg + "\r\n" + "Blue Accum List: " + blAccumList;



    //account for LURKER //CHG01546
    var reLurkerList = lurkerAccount(src, "red")
    var blLurkerList = lurkerAccount(src, "rgb")
    //remove lurker-trashed cards from trashed card list
    reTrashList = listDiff(reTrashList, reLurkerList)
    blTrashList = listDiff(blTrashList, blLurkerList)

    //remove trashed cards
    var reCleanList = listDiff(reAccumList, reTrashList)
    var blCleanList = listDiff(blAccumList, blTrashList)

    //get number of cards
    for (var i = 0; i < reCleanList.length; i++) {
        reCardCount = reCardCount + parseInt(reCleanList[i].slice(0,2).trim())
    }
    for (var i = 0; i < blCleanList.length; i++) {
        blCardCount = blCardCount + parseInt(blCleanList[i].slice(0,2).trim())
    }

    //calculate buying power - returns [estimated buying power, number of potions, number of treasures, average card value]
    var reBuyingPower = buyingPower(reCleanList, reCardCount)
    var blBuyingPower = buyingPower(blCleanList, blCardCount)

    var reVCardCount = victoryCount(reCleanList)
    var blVCardCount = victoryCount(blCleanList)

    displayMsg = displayMsg
        + "\r\n"
        + "Red (" + reCardCount + " cards)"
        + "\r\n"
        + reCleanList
        + "\r\n"
        + "Estimated Buying Power: " + reBuyingPower[0]
        + "\r\n"
        + "Potions: " + reBuyingPower[1]
        + "\r\n"
        + "Number of treasures: " + reBuyingPower[2]
        + "\r\n"
        + "Average card value: " + reBuyingPower[3]
        + "\r\n"
        + "No-cycle average value: " + reBuyingPower[3] * 5
        + "\r\n"
        + "Number of Victory Cards: " + reVCardCount
        + "\r\n"
        + "\r\n"
        + "Blue (" + blCardCount + " cards)"
        + "\r\n"
        + blCleanList
        + "\r\n"
        + "Estimated Buying Power: " + blBuyingPower[0]
        + "\r\n"
        + "Potions: " + blBuyingPower[1]
        + "\r\n"
        + "Number of treasures: " + blBuyingPower[2]
        + "\r\n"
        + "Average card value: " + blBuyingPower[3]
        + "\r\n"
        + "No-cycle average value: " + blBuyingPower[3] * 5
        + "\r\n"
        + "Number of Victory Cards: " + blVCardCount

    message.innerText = displayMsg;

  }
});

function sortList(cardList){
    cardList.sort(function(x,y) {
  	    //if (treasureCards.includes(getCardName(x))) {
  	    //    return -1;
  	    //}
  	    if (victoryCards.includes(getCardName(x))) {
    	    return -1;
        }
    });
    return cardList
}

/*
function formatCardList(cardList){
    var formatted = ""

    //pre-sort list
    cardList.sort(function(x,y) {
  	    if (victoryCards.includes(getCardName(x))) {
    	    return -1;
        }
    });


    for (var i = 0; i < cardList.length; i++) {
        formatted = formatted
            + cardList[i]
            + "\r\n"
    }
    return formatted
}
*/

function victoryCount(cardList) {
    var count = 0
    for (var i = 0; i < cardList.length; i++) {
        if (victoryCards.includes(getCardName(cardList[i]))){
            count = count + parseInt(cardList[i].slice(0,2).trim());
        }
    }
    return count;
    //POTENTIAL ERRORS
    //how are islands and distant lands accounted for?
}

function buyingPower(cardList, cardCount){
    var bp = 0;
    var potion = 0;
    var count = 0;

    for (var i = 0; i < cardList.length; i++) {

        if (getCardName(cardList[i]) == "Copper"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim());
        }
        if (getCardName(cardList[i]) == "Silver"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Gold"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 3 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Platinum"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 5 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Spoils"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 3 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Diadem"){
            //this also gives you +1 per unused action
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Haunted Mirror"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Magic Lamp"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Goat"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Pasture"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Pouch"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Cursed Gold"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 3 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Pasture"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Lucky Coin"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Harem"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Hoard"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Quarry"){
            //this also makes action cards cost 2 less
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Talisman"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Rocks"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Masterpiece"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Humble Castle"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Loan"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Contraband"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Royal Seal"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Horn of Plenty"){

            count = count + parseInt(cardList[i].slice(0,2).trim());;
        }
        if (getCardName(cardList[i]) == "Cache"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 3 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Ill-Gotten Gains"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Relic"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Treasure Trove"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Plunder"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Capital"){
            //should debt be incorporated?
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 6 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Charm"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Idol"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Scepter"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Spices"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Stash"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Ducat"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Coin of the Realm"){
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Fool's Gold"){
            //worth 1 if alone, 4 if with another Fool's Gold
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            if (parseInt(cardList[i].slice(0,2).trim()) > 1) {
                bp = bp + 4 * (parseInt(cardList[i].slice(0,2).trim()) - 1) + 1
            }
            else {
                bp = bp + parseInt(cardList[i].slice(0,2).trim())
            }
        }
        if (getCardName(cardList[i]) == "Philosopher's Stone"){
            //worth 1 per 5 cards between deck and discard pile - estimated as 25% of (deck - 5)
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + (cardCount - 5) * 0.25 / 5 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Potion"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            potion = potion + parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Venture"){
            //will play another treasure (use average treasure)
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + (bp / count) * parseInt(cardList[i].slice(0,2).trim()) + 1
        }
        if (getCardName(cardList[i]) == "Counterfeit"){
            //will play another treasure twice (average card value)
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + ((bp / cardCount) * 2 + 1) * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Crown"){
            //will play another treasure twice (average card value)
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + (bp / cardCount) * 2 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Bank"){
            count = count + parseInt(cardList[i].slice(0,2).trim());
            bp = bp + 6 * parseInt(cardList[i].slice(0,2).trim())
        }
        if (getCardName(cardList[i]) == "Fortune"){
            //doubles buying power - estimated as average card value x 6
            count = count + parseInt(cardList[i].slice(0,2).trim());;
            bp = bp + (bp / cardCount) * 6 * parseInt(cardList[i].slice(0,2).trim())
        }
//POTENTIAL ERRORS:
//adding integer with long (Counterfeit)
//getCardName on Ill-Gotten Gains
//should debt for capital be incorporated?
//how to estimate Bank value? - arbitrarily chose 6
//how to estimate Fortune value? - arbitrarily chose 6 * average
//would need to combine this with cycle power to get a useful number
    }
    var result = [bp, potion, count, bp/cardCount]
    return result
}

//listA: accumList, listB: trashList
function listDiff(listA = [], listB = []) {

    for (var i = 0; i < listB.length; i++){
        for (var j = 0; j < listA.length; j++){
            if (getCardName(listB[i]) == getCardName(listA[j])) {
                var n = parseInt(listA[j].substring(0,2).trim()) - parseInt(listB[i].substring(0,2).trim())
                listA[j] = n.toString() + " " + getCardName(listA[j])
                break;
            }
        }
    }

    return listA;
}

function bounceFortress(trashList){
    //CHG01543 - fortresses cannot be trashed
    trashList = trashList.filter(function(e){
        return !e.includes("Fortress")
    });
    return trashList
}

function lurkerAccount(html, color){ //CHG01546

    if (color == "rgb") {
        var regexLurker = new RegExp(/(?<=color:rgb.*(plays).*">a Lurker(.*\n){4}.*trashes.*color:\w+">)(\w+| |-){1,6}/gm);
    }
    else {
        var regexLurker = new RegExp(/(?<=color:red.*(plays).*">a Lurker(.*\n){4}.*trashes.*color:\w+">)(\w+| |-){1,6}/gm);
    }
    //will error if no cards have been trashed by a Lurker
    try {
        return groupCards(html.match(regexLurker));
    }
    catch(e){
        console.log(e)
    }
}

function getCardName(str){

    var plurals = ["Band of Misfits","Castles","Catacombs","Crossroads","Distant Lands","Duchess","Enchantress","Fairgrounds","Followers","Fortress","Gardens","Goons","Haunted Woods","Horse Traders","Hunting Grounds","Ill-Gotten Gains","Ironworks","Jack of All Trades","Lackeys","Lost in the Woods","Necropolis","Nobles","Oasis","Princess","Rats","Rocks","Settlers","Smugglers","Spices","Spoils","Stables","Survivors","Fortresses"];
    var cardName = str.substring(2,str.length).trim();

    //check for ending in "ies/y"
    if (cardName.slice(cardName.length-3) === "ies") {
    	return cardName.substring(0, cardName.length-3) + "y";
    }

    //CHG01542
    if (cardName == "Oases"){
        return "Oasis";
    }

    if (plurals.includes(cardName)){
        return cardName;
    }
    else {
        if (cardName.substring(cardName.length - 1) == "s"){
           return cardName.substring(0, cardName.length - 1);
        }
        else {
            return cardName;
        }
    }
}

function groupCards(cardList) {

      var groupList = [];
      var count = 1;

      //loop through cardList
      for (var i = 0; i < cardList.length; i++) {

        //if last card is not a match of the 2nd to last card, add last card to groupList. Regardless, break loop
        if (i == cardList.length - 1) {

          //check for number or "a"
          if (cardList[i].slice(0,2).trim() !== "a") { //CHG01548
            count = count + parseInt(cardList[i].slice(0,1)) - 1;
          }

          //if card is not the same as the previous card
            if (getCardName(cardList[i]) !== getCardName(cardList[i-1])) {
            groupList.push(count.toString() + " " + getCardName(cardList[i]))
            break;
          }
          else {
            groupList.push(count.toString() + " " + getCardName(cardList[i]));
            break;
          }
        }

        //check each card against the next card and sum matches
        if (getCardName(cardList[i]) == getCardName(cardList[i+1])) {
          //check for number or "a"
          if (cardList[i].slice(0,2).trim() == "a") { //CHG01547
            count = count + 1;
          }
          else {
            count = count + parseInt(cardList[i].slice(0,2).trim())
          }
        }


        //if the next card does not match
        else {
          //add card to groupList
          if (cardList[i].slice(0,1) !== "a") {
            count = count + parseInt(cardList[i].slice(0,2).trim()) - 1;
          }

          //CHG01545: if count is a number (this will exclude boons)
          if (!isNaN(count)) {
            groupList.push(count.toString() + " " + getCardName(cardList[i]))
          }

          //reset count
          count = 1
        }
      }
      return groupList;

}

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    }
  });

}

window.onload = onWindowLoad;