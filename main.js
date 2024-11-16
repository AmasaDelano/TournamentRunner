
// Author: Alex Leone
"use strict";

(function () {
    // https://javascript.info/task/shuffle
    function shuffleInPlace(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        
            // swap elements array[i] and array[j]
            // we use "destructuring assignment" syntax to achieve that
            // you'll find more details about that syntax in later chapters
            // same can be written as:
            // let t = array[i]; array[i] = array[j]; array[j] = t
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    function newBracket() {
        return {
            winner: "",
            winnerOrder: [],
            matches: []
        };
    }
    function calculateBracketWinnerOrder(bracket) {
        if (bracket.matches.some(function (match) {
            return !match.winner;
        })) {
            return [];
        }
        
        var winnerRecords = {};
        bracket.matches.forEach(function (match) {
            if (winnerRecords[match.item1] === undefined) {
                winnerRecords[match.item1] = 0;
            }
            if (winnerRecords[match.item2] === undefined) {
                winnerRecords[match.item2] = 0;
            }
            
            winnerRecords[match.winner] += 1;
        });

        var winnerScores = Object.keys(winnerRecords).map(function (item) {
            return {
                item: item,
                score: winnerRecords[item] || 0
            };
        });
        winnerScores.sort(function (a, b) {
            return b.score - a.score;
        });

        return winnerScores.map(function (winnerScore) {
            return winnerScore.item + " (" + winnerScore.score + ")";
        });
    }

    var app = Vue.createApp({
        data: function () {
            return {
                step: "selection",
                rawItems: "",
                selectionMethod: "round-robin-series-8",
                brackets: [],
                currentBracketIndex: 0,
                currentBracket: newBracket(),
                currentMatchIndex: 0,
                currentMatch: {}
            };
        },
        beforeCreate: function () {
        },
        beforeMount: function () {
            this.rawItems = localStorage.getItem("rawItems");
            this.selectionMethod = localStorage.getItem("selectionMethod") || this.selectionMethod;
            this.brackets = JSON.parse(localStorage.getItem("brackets"));

            if (this.brackets) {
                this.startTournament();
            }
        },
        computed: {
        },
        methods: {
            isStep: function (step) {
                return step === this.step;
            },
            confirmSelection: function () {
                localStorage.setItem("rawItems", this.rawItems);
                localStorage.setItem("selectionMethod", this.selectionMethod);

                var items = this.rawItems.split("\n");
                console.log(items);

                var brackets = [];
                if (this.selectionMethod === "round-robin") {
                    var bracket = newBracket();
                    items.forEach(function (item, index) {
                        if (index >= items.length - 1) {
                            return;
                        }

                        var pairs = items.slice(index + 1);
                        pairs.forEach(function (pair) {
                            bracket.matches.push({
                                item1: item,
                                item2: pair,
                                winner: ""
                            });
                        });
                    });

                    brackets.push(bracket);
                } else if (this.selectionMethod === "round-robin-series-8") {
                    shuffleInPlace(items);

                    for (var index = 0; index < items.length; index += 8) {
                        var bracket = newBracket();

                        var bracketItems = items.slice(index, index + 8);
                        bracketItems.forEach(function (item, index) {
                            if (index >= bracketItems.length - 1) {
                                return;
                            }
    
                            var pairs = bracketItems.slice(index + 1);
                            pairs.forEach(function (pair) {
                                bracket.matches.push({
                                    item1: item,
                                    item2: pair,
                                    winner: ""
                                });
                            });
                        });
    
                        brackets.push(bracket);
                    }

                    // FINAL BRACKET - taking winners of brackets of 8
                    var finalBracket = newBracket();
                    
                    brackets.forEach(function (_, bracketIndex) {
                        if (bracketIndex >= brackets.length - 1) {
                            return;
                        }

                        var pairs = brackets.slice(bracketIndex + 1);
                        pairs.forEach(function (_, pairIndex) {
                            finalBracket.matches.push({
                                item1FromBracketWinner: bracketIndex,
                                item2FromBracketWinner: pairIndex,
                                winner: ""
                            });
                        });
                    });

                    brackets.push(finalBracket);
                } else if (this.selectionMethod === "single-elimination") {
                    shuffleInPlace(items);

                    for (var index = 0; index < items.length - 2; index += 2) {
                        var item1 = items[index];
                        var item2 = items[index + 1];
                        
                        var bracket = newBracket();
                        
                        bracket.matches.push({
                            item1: item1,
                            item2: item2,
                            winner: ""
                        });
                        
                        brackets.push(bracket);
                    }
                    var numBrackets = brackets.length;
                    for (numBrackets = Math.ceil(numBrackets / 2); ;) {
                        ;
                    }

                    for (var matchIndex = 0; matchIndex < numMatches; matchIndex += 2) {
                        var bracket = {matches: []};
                        bracket.matches.push({
                            item1: null,
                            item2: null,
                            item1FromWinner: matchIndex,
                            item2FromWinner: matchIndex + 1,
                            winner: ""
                        });
                        brackets.push(bracket);
                    }
                }
                
                brackets.forEach(function (b) {
                    shuffleInPlace(b.matches);
                });
                
                console.log(brackets);
                this.brackets = brackets;
                this.startTournament();
            },
            startTournament: function () {
                var firstBracketIndexWithNoWinner = this.brackets.findIndex(function (bracket) {
                    return !bracket.winner;
                }) || (this.brackets.length - 1);
                this.currentBracketIndex = firstBracketIndexWithNoWinner;

                this.goToLastUnchosenMatch();
                this.updateCurrentMatch();
                this.step = "tournament";
            },
            itemSelected: function (item) {
                return this.currentMatch.winner && this.currentMatch.winner === item;
            },
            itemNotSelected: function (item) {
                return this.currentMatch.winner && this.currentMatch.winner !== item;
            },
            selectItem1: function () {
                this.selectWinner(this.currentMatch.item1);
            },
            selectItem2: function () {
                this.selectWinner(this.currentMatch.item2);
            },
            selectWinner: function (newWinner) {
                if (!newWinner) {
                    return;
                }

                var winnerIsNew = !this.currentMatch.winner;
                this.currentMatch.winner = newWinner;

                var brackets = this.brackets;
                brackets.forEach(function (bracket) {
                    bracket.winnerOrder = calculateBracketWinnerOrder(bracket);
                    bracket.winner = bracket.winnerOrder[0] || "";
                });
                brackets.forEach(function (bracket) {
                    bracket.matches.forEach(function (match) {
                        function updateItemLink(itemNumber) {
                            if (typeof match["item" + itemNumber + "FromBracketWinner"] === "number") {
                                var oldItem = match["item" + itemNumber];
                                match["item" + itemNumber] = brackets[match["item" + itemNumber + "FromBracketWinner"]].winner;
                                if (match["item" + itemNumber] !== oldItem) {
                                    match.winner = "";
                                }
                            }
                        }

                        updateItemLink("1");
                        updateItemLink("2");
                    });
                });

                if (winnerIsNew) {
                    this.nextMatch();
                }
            },
            previousMatch: function () {
                this.currentMatchIndex -= 1;
                if (this.currentMatchIndex < 0) {
                    this.currentMatchIndex = 0;
                }
                this.updateCurrentMatch();
            },
            nextMatch: function () {
                this.currentMatchIndex += 1;
                if (this.currentMatchIndex >= this.currentBracket.matches.length) {
                    this.currentMatchIndex = this.currentBracket.matches.length - 1;
                    this.nextBracket();
                }
                this.updateCurrentMatch();
            },
            previousBracket: function () {
                this.currentBracketIndex -= 1;
                if (this.currentBracketIndex < 0) {
                    this.currentBracketIndex = 0;
                }
                this.goToLastUnchosenMatch();
                this.updateCurrentMatch();
            },
            nextBracket: function () {
                this.currentBracketIndex += 1;
                if (this.currentBracketIndex >= this.brackets.length) {
                    this.currentBracketIndex = this.brackets.length - 1;
                    // completeTournament();
                }
                this.goToLastUnchosenMatch();
                this.updateCurrentMatch();
            },
            goToLastUnchosenMatch: function () {
                this.currentBracket = this.brackets[this.currentBracketIndex];

                this.currentMatchIndex = this.currentBracket.matches.findIndex(function (match) {
                    return !match.winner;
                });

                if (this.currentMatchIndex < 0) {
                    this.currentMatchIndex = this.currentBracket.matches.length - 1;
                }
            },
            updateCurrentMatch: function () {
                localStorage.setItem("brackets", JSON.stringify(this.brackets));

                this.currentBracket = this.brackets[this.currentBracketIndex];
                this.currentMatch = this.currentBracket.matches[this.currentMatchIndex];
            },
            progressPercentage: function (index, length) {
                var percentage = 100 * (index + 1) / length;
                return percentage.toString() + "%";
            }
        }
    });

    // var vm = 
    app.mount("#tournament-app");

    // part.vm = vm;
}());