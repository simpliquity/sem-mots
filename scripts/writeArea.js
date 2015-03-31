var WriteArea = function(bgLayer, layer, dimensions, keyboard) {
    // synthétiseur de voix
    var player = WordPlayer();
    var letters = new Kinetic.Group({
        x: 0,
        y: 0,
        draggable: false
    });
    var lettersData = [];
    var lettersPadding = 10;
    var keySize = 100;

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
        }, []).join('');
        // "dit" le mot
        //player.play(word);
        console.log("word", word);
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

    var snapToGrid = function(letter) {
        var letterPos = letter.getPosition();
        var offset = keySize/2;
        var pos = {
            x: letterPos.x, // + (keySize + lettersPadding)/2,
            y: letterPos.y //+ (keySize + lettersPadding)/2
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

var WriteArea2 = function(bgLayer,layer,dimensions) {
    // synthétiseur de voix
    var player = WordPlayer();
    var letters = new Kinetic.Group({
        x:0,
        y:0,
        draggable: false
    });

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

    var background = new Kinetic.Rect({
        x: dimensions.pos.x,
        y: dimensions.pos.y,
        width: dimensions.size.width,
        height: dimensions.size.height,
        cornerRadius:30,
        fill: 'white',
        stroke: 'white',
        strokeWidth:10 
    });
    bgLayer.add(background);
    layer.add(letters);
    layer.draw();

    player.onStatusChange(function(status) {
        switch(status.status) {
            case 'loading':
                background.setStroke('white');
                break;
            case 'ready':
                background.setStroke('green');
                break;
            default:
                background.setStroke('red');
        }
        bgLayer.draw();
    });

    // lit le mot écrit (ordre des lettres)
    // et le retourne (String)
    var updateWord = function() {
        var children = letters.getChildren();
        // ordre basé sur la position horizontale
        var sortedLetters = _.sortBy(children, function(letter) {
            return letter.getPosition().x;
        });
        // construit le mot en prenant les lettres l'une après l'autre
        var word = _.reduce(sortedLetters, function(word,letter) {
            return word + letter.name;
        }, '');
        // "dit" le mot
        player.play(word);
        return word;
    };

    // appelé quand une lettre est déplacée
    var letterMoved = function(e) {
        letter = e.targetNode.getParent();
        if (!isLetterInArea(letter)) {
            // plus dans la zone d'écriture: on l'efface
            letter.remove();
            layer.draw();
        }
        updateWord();
    };

    return {
        // ajoute une lettre à cette zone d'écriture
        addLetter: function(letter) {
            // contrôle si la lettre est bien dans la zone
            if (isLetterInArea(letter)) {
                // on réagit aux mouvements de lettres (nouveau mot)
                letter.on('dragend',letterMoved);
                letters.add(letter);
                // on place la lettre en dessus de toutes les autres
                // pour être sûr de la voir
                letter.moveToTop();
                layer.draw();
                updateWord();
            }
        },
        getWord: function() {
            return updateWord();
        }
    };
};
