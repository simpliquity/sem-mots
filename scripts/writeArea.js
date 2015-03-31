// options:
// - backgroundLayer
// - writeLayer
// - dimensions
// - keyboard
// - wordPlayer
var WriteArea = function(options) {
    // synthétiseur de voix
    var bgLayer = options.backgroundLayer
    var layer = options.writeLayer;
    var dimensions = options.dimensions;
    var keyboard = options.keyboard;
    var player = options.wordPlayer;
    var letters = new Kinetic.Group({
        x: 0,
        y: 0,
        draggable: false
    });
    var lettersData = [];
    var lettersPadding = 10;
    var keySize = 100;

    // crée la grille d'écriture (affichage + structure de données)
    (function init() {
        var keySize = keyboard.getKeySize()
        var lineLen = Math.floor(dimensions.size.width / (keySize+lettersPadding));
        var linesCount = Math.floor(dimensions.size.height / (keySize+lettersPadding));

        var basePos = {
            x: dimensions.pos.x + (dimensions.size.width/2) - (keySize+lettersPadding)*lineLen/2,
            y: dimensions.pos.y + (dimensions.size.height/2) - (keySize+lettersPadding)*linesCount/2
        };
        for (var i=0; i<linesCount; i=i+1) {
            for (var j=0; j<lineLen; j=j+1) {
                key = keyboard.getEmptyKey('empty-'+i+'-'+j, {x:100,y:100});
                key.setDraggable(false);
                data = {
                    index: {
                        x: j,
                        y: i
                    },
                    pos: {
                        x: basePos.x + j * (keySize + lettersPadding),
                        y: basePos.y + i * (keySize + lettersPadding)
                    }
                };
                lettersData.push(data);
                key.setPosition(data.pos.x, data.pos.y);
                key.setOpacity(0.6);
                bgLayer.add(key);
            }
        }
        layer.draw();
    })()

    // lit le mot écrit (ordre des lettres)
    // et le retourne (String)
    var updateWord = function() {
        // on extrait toutes les lettres, dans l'ordre
        var word = _.reduce(lettersData, function(memo, data) {
            if (data.letter) {
                memo.push(data.letter.name);
            } else if ((_.size(memo) > 0) && (_.last(memo) !== ' ')) {
                // un seul espace est inséré s'il y a un trou
                memo.push(' ');
            }
            return memo;
        }, []);
        if (_.last(word) === ' ') {
            word = _.first(word, -1);
        }
        // "dit" le mot
        player.play(word.join(''));
        console.log("word", word.join(''));
        return word;
    };

    // contrôle si une lettre est dans la zone d'écriture
    var isLetterInArea = function(letter) {
        var letterPos = letter.getPosition();
        return _.every([
            letterPos.x >= dimensions.pos.x,
            letterPos.y >= dimensions.pos.y,
            letterPos.x < dimensions.pos.x+dimensions.size.width,
            letterPos.y < dimensions.pos.y+dimensions.size.height
        ], _.identity);
    };

    // positionne une lettre sur la grille
    // remplace la lettre s'il y en a déjà une
    var snapToGrid = function(letter) {
        var letterPos = letter.getPosition();
        var offset = keySize/2;
        var pos = {
            x: letterPos.x,
            y: letterPos.y
        };
        var data = _.reduce(lettersData, function(memo,data) {
            if (pos.x+offset >= data.pos.x && pos.y+offset >= data.pos.y)
                memo = data
            return memo
        },null);
        if (data.letter && (data.letter._id !== letter._id)) {
            removeLetter(data.letter, {refresh:false});
        }
        if (data) {
            if (letter.letterData) {
                delete letter.letterData.letter;
            }
            data.letter = letter;
            letter.letterData = data;
            letter.setPosition(data.pos.x, data.pos.y);
            return true;
        } else {
            return false;
        }
    };

    // appelé quand une lettre est déplacée
    var letterMoved = function(e) {
        letter = e.targetNode.getParent();
        if (!isLetterInArea(letter)) {
            // plus dans la zone d'écriture: on l'efface
            removeLetter(letter);
        } else {
            if (snapToGrid(letter)) {
                // on place la lettre en dessus de toutes les autres
                // pour être sûr de la voir
                letter.moveToTop();
                layer.draw();
            }
        }
        updateWord();
    };

    var removeLetter = function(letter, options) {
        if (letter.letterData) {
            delete letter.letterData.letter;
        }
        letter.remove();
        console.log("Remove");
        if (!options || options.refresh) {
            console.log("Refresh");
            layer.draw();
        }
    };


    layer.add(letters);

    return {
        // ajoute une lettre à cette zone d'écriture
        addLetter: function(letter) {
            // contrôle si la lettre est bien dans la zone
            if (isLetterInArea(letter)) {
                if (snapToGrid(letter)) {
                    // on réagit aux mouvements de lettres (nouveau mot)
                    letter.on('dragend',letterMoved);
                    letters.add(letter);
                    // on place la lettre en dessus de toutes les autres
                    // pour être sûr de la voir
                    letter.moveToTop();
                    layer.draw();
                    updateWord();
                }
            }
        },
        getWord: function() {
            return updateWord();
        }
    };
};
