var wordsApp = (function() {
    // dimensions de l'application
    var size = (function() {
        var win = $(window);
        var offset = $('#canvasBox').offset();
        var border = 5;
        return {
            width: $('#canvasBox').width(),
            height: win.height()-2*offset.top-border
        };
    })();
    // dimensions et position de la zone d'écriture
    var writeAreaDim = (function() {
        var border = 10;
        // position (relative au sommet de la page)
        var relTopOffset = 0.05;
        // hauteur (relative à la hauteur de la page)
        var relHeight = 0.5;
        return {
            pos: {
                x: border,
                y: border + size.height * relTopOffset
            },
            size: {
                width: size.width - 2*border,
                height: size.height * relHeight
            },
            lettersPerLine: wordsConfig.lettersPerLine
        };
    })();
    // dimensions et position du clavier
    var keyboardDim = (function() {
        var border = 10;
        // hauteur (relative à la hauteur de la page)
        var relHeight = 0.4;
        return {
            pos: {
                x: border,
                y: size.height * (1-relHeight) - border
            },
            size: {
                width: size.width - 2*border,
                height: size.height * relHeight
            }
        }
    })();

    // la scène principale (rendu)
    var stage = new Kinetic.Stage({
        container: 'canvasBox',
        width: size.width,
        height: size.height
    });
    var backgroundLayer = new Kinetic.Layer();
    var writeLayer = new Kinetic.Layer();
    var writeArea = null;
    var keyboardLayer = new Kinetic.Layer();
    var keyboard = null;

    var wordPlayer = null;

    var onLetterTyped = function(letter) {
        // on ajoute simplement la lettre à la zone d'écriture
        writeArea.addLetter(letter);
    };

    var init = function() {
        wordPlayer = WordPlayer();
        keyboard = Keyboard(keyboardLayer,keyboardDim,wordPlayer);
        keys = [
            ["a","b","c","d","e","f","g","h","i"],
            ["j","k","l","m","n","o","p","q"],
            ["r","s","t","u","v","w","x","y","z"]
        ]
        keyboard.setKeys(keys);
        keyboard.onLetterTyped(onLetterTyped);
        writeArea = WriteArea({
            backgroundLayer: backgroundLayer,
            writeLayer: writeLayer,
            dimensions: writeAreaDim,
            keyboard: keyboard,
            wordPlayer: wordPlayer
        });

        stage.add(backgroundLayer);
        stage.add(keyboardLayer);
        stage.add(writeLayer);

        backgroundLayer.setZIndex(0);
        writeLayer.setZIndex(1);
        keyboardLayer.setZIndex(2);
    };

    return {
        init:init
    };
})();

$(document).ready(function() {
    wordsApp.init();
});
