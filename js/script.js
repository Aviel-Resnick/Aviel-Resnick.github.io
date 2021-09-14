// cards
card_home = document.getElementById("card-home")
card_resume = document.getElementById("card-resume")
card_edu = document.getElementById("card-edu")
card_classes = document.getElementById("card-classes")
card_project1 = document.getElementById("card-project1")
card_project2 = document.getElementById("card-project2")
card_work1 = document.getElementById("card-work1")
card_work2 = document.getElementById("card-work2")

// neighbors order: up, down, left, right
const neighbors = new Map();
neighbors.set("card-home", [card_resume, card_edu, card_project1, card_work1]);
neighbors.set("card-resume", [null, card_home, null, null]);
neighbors.set("card-edu", [card_home, card_classes, null, null]);
neighbors.set("card-classes", [card_edu, null, null, null]);
neighbors.set("card-project1", [null, null, card_project2, card_home]);
neighbors.set("card-project2", [null, null, null, card_project1]);
neighbors.set("card-work1", [null, null, card_home, card_work2]);
neighbors.set("card-work2", [null, null, card_work1, null]);

function getCurrCard() {
    if (window.getComputedStyle(card_home, null).display == "block") { return "card-home" }
    else if (window.getComputedStyle(card_resume, null).display == "block") { return "card-resume" }
    else if (window.getComputedStyle(card_edu, null).display == "block") { return "card-edu" }
    else if (window.getComputedStyle(card_classes, null).display == "block") { return "card-classes" }
    else if (window.getComputedStyle(card_project1, null).display == "block") { return "card-project1" }
    else if (window.getComputedStyle(card_project2, null).display == "block") { return "card-project2" }
    else if (window.getComputedStyle(card_work1, null).display == "block") { return "card-work1" }
    else if (window.getComputedStyle(card_work2, null).display == "block") { return "card-work2" }
    else { return alert("No Card Visible") }
}

document.onkeydown = checkKey;

function checkKey(e) {
    e = e || window.event;

    curr_card = getCurrCard()

    if (e.keyCode == '38') {
        // up arrow
        if (neighbors.get(curr_card)[0] == null) {
            console.log("Invalid Move")
        } else {
            activate(neighbors.get(curr_card)[0])
        }        
    }
    else if (e.keyCode == '40') {
        // down arrow
        if (neighbors.get(curr_card)[1] == null) {
            console.log("Invalid Move")
        } else {
            activate(neighbors.get(curr_card)[1])
        }
    }
    else if (e.keyCode == '37') {
        // left arrow
        if (neighbors.get(curr_card)[2] == null) {
            console.log("Invalid Move")
        } else {
            activate(neighbors.get(curr_card)[2])
        }
    }
    else if (e.keyCode == '39') {
        // right arrow
        if (neighbors.get(curr_card)[3] == null) {
            console.log("Invalid Move")
        } else {
            activate(neighbors.get(curr_card)[3])
        }
    }
}

function upArrow() {
    curr_card = getCurrCard()
    if (neighbors.get(curr_card)[0] == null) {
        console.log("Invalid Move")
    } else {
        activate(neighbors.get(curr_card)[0])
    }
}

function downArrow() {
    curr_card = getCurrCard()
    if (neighbors.get(curr_card)[1] == null) {
        console.log("Invalid Move")
    } else {
        activate(neighbors.get(curr_card)[1])
    }
}

function leftArrow() {
    curr_card = getCurrCard()
    if (neighbors.get(curr_card)[2] == null) {
        console.log("Invalid Move")
    } else {
        activate(neighbors.get(curr_card)[2])
    }
}

function rightArrow() {
    curr_card = getCurrCard()
    if (neighbors.get(curr_card)[3] == null) {
        console.log("Invalid Move")
    } else {
        activate(neighbors.get(curr_card)[3])
    }
}

// TODO: iterate through an array of the courses / the keys of neighbors for modularity
function activate(card) {
    for (let [key, value] of neighbors) {
        console.log(key + " = " + value);
        curr = document.getElementById(key);
    }

    card_home.style.display = "none";
    card_resume.style.display = "none";
    card_edu.style.display = "none";
    card_classes.style.display = "none";
    card_project1.style.display = "none";
    card_project2.style.display = "none";
    card_work1.style.display = "none";
    card_work2.style.display = "none";

    card.style.display = "block";
}