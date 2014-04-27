var WriteArea = function(bgLayer,layer,dimensions) {
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
        stroke: 'black',
        strokeWidth: 0
    });
    bgLayer.add(background);
    layer.add(letters);
    layer.draw();

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
