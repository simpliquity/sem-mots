/*
 * Clavier tactile.
 */
var Keyboard = function(layer,dimensions) {
    // liste de listeners pour les événements du clavier
    var typeListeners = $.Callbacks();
    var kb = new Kinetic.Group({
        x: 0,
        y: 0
    });
    var keys = {};
    var keySize;
    layer.add(kb);

    // appelée lorsqu'une touche a été déplacée
    var keyDragEnd = function(e) {
        var key = e.dragEndNode;//targetNode.getParent();
        key.off('dragend');
        // on enlève la touche du clavier
        key.remove();
        layer.draw();
        // et on la passe aux objets qui écoutent se type d'événement
        typeListeners.fire(key);
    };

    // appelé lorsqu'une touche est déplacée par l'utilisteur
    // (correspond à une frappe)
    // la touche déplacée est enlevée du clavier (pour servir à écrire
    // par exemple), elle doit donc être clonée et remplacée pour garder
    // un clavier complet.
    var keyDragStart = function(e) {
        var key = e.targetNode.getParent();
        // on arrête d'écouter le début d'un déplacemetn
        key.off('dragstart');
        // on s'intéresse à la fin du déplacement (écriture de la lettre)
        key.on('dragend',keyDragEnd);
        // on clone la lettre déplacée pour la remplacer dans le clavier
        clone = createKey(key.name, key.originalPos, keySize);
        clone.on('dragstart',keyDragStart);
        // on ajoute le clone au clavier
        kb.add(clone);
        key.moveToTop();
        layer.draw();
        keys[key.name] = clone;
    };

    var createEmptyKey = function(name, pos, size) {
        // background
        var bg = new Kinetic.Rect({
            width: size,
            height: size,
            cornerRadius:10,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 3
        });
        var key = new Kinetic.Group({
            x:pos.x,
            y:pos.y,
            draggable: true
        });
        key.name = name;
        key.add(bg);
        return key;
    };

    // création d'une touche de clavier
    var createKey = function(name,pos,size) {
        // le caractère
        var txt = new Kinetic.Text({
            fontSize: 32,
            text: name,
            fill: 'black',
            align: 'center',
            padding: 5 
        });
        txt.setWidth(txt.getHeight());
        var txtScale = size/txt.getHeight();
        txt.setScale(txtScale);
        key = createEmptyKey(name,pos,size);
        key.originalPos = _.clone(pos);
        key.add(txt);
        key.on('dragstart',keyDragStart);
        return key;
    };

    return {
        // lines: tableau de caractères
        setKeys: function(lines) {
            // quelques calculs pour utiliser le maximum de place disponible
            // nombre max de touches par ligne
            var maxKeysPerLine = _.size(_.max(lines, function(line) {return _.size(line);}));
            var colOffset = 10;
            var rowOffset = 10;
            // largeur max d'une lettre (fonction de la taille du clavier)
            var maxKeyWidth = (dimensions.size.width-colOffset*(maxKeysPerLine-1)) / maxKeysPerLine;
            // hauteur max d'une lettre (fonction de la taille du clavier)
            var maxKeyHeight = (dimensions.size.height-rowOffset*(_.size(lines)-1)) / _.size(lines);
            // taille d'une touche min. des deux valeurs précédentes
            keySize = Math.min(maxKeyWidth,maxKeyHeight);
            var currentPos = {
                x: dimensions.pos.x,
                y: dimensions.pos.y
            };
            // création des touches
            _.each(lines, function(line) {
                var keysCount = _.size(line);
                var lineLen = (keysCount-1)*colOffset + keysCount * keySize;
                currentPos.x = dimensions.pos.x + 0.5 * (dimensions.size.width -lineLen); 
                _.each(line, function(name) {
                    key = createKey(name,currentPos,keySize);
                    keys[name] = key;
                    kb.add(key);
                    currentPos.x += colOffset + keySize;
                });
                currentPos.y += keySize + rowOffset;
            });
            layer.draw();
        },
        // pour être informé lorsqu'une touche est "tapée"
        onLetterTyped: function(callback) {
            typeListeners.add(callback);
        },
        getKeySize: function() {
            return keySize;
        },
        getEmptyKey: function(name, pos) {
            return createEmptyKey(name, pos, keySize);
        }
    };
};
