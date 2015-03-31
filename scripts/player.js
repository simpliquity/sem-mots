// lecteur de voix synthétique
// appelle un script php sur le serveur pour générer un fichier mp3
var WordPlayer = function() {
    // cache pour éviter de générer plusieurs fois les mêmes requêtes
    var cache = {};
    var listeners = $.Callbacks();

    var playSound = function(url) {
        // lecteur audio sur la page html
        var source = $(wordsConfig.mp3SourceId);
        var player = $('#'+wordsConfig.audioPlayerId).get(0)
        source.attr('src',url).detach().appendTo(player);
        player.load()
        player.play()
    };

    var playLetter = function(letter) {
        if (!(letter && letter!=="")) return;
        var car = _.first(letter.toLowerCase());
        // l'addresse du fichier son (l'option v= est utile pour
        // forcer le navigateur à mettre à jour le cache (simplement
        // changer la valeur si un son à été mis-à-jour)
        var url = "sounds/letters/"+car+".mp3?v=2";
        playSound(url);
    };


    // lit le mot passé en paramètre
    var playWord = function(word) {
        // ne fait rien si le mot est vide
        if (!(word && word!=="")) return;
        // lit une lettre uniquement
        if (_.size(word) === 1) {
            playLetter(_.first(word));
            return;
        }
        listeners.fire({status:'loading'});
        // contrôle si le mot est dans le cache
        if (cache[word]) {
            playSound(cache[word]);
            listeners.fire({status:'ready'});
            return;
        } else {
            var data = {
                text: word
            };
            // appelle un script php pour générer un ficher mp3
            var url = wordsConfig.voiceScriptUrl;
            $.post(url,data,function(data,textStatus,jqXHR) {
                // la réponse est donnée en JSON
                try {
                    var answer = JSON.parse(data);
                    if (answer.status === 'OK') {
                        // ok, le mot a pu être généré
                        var url = answer.snd_url;
                        // on l'ajoute au cache
                        cache[word] = url;
                        // et on le lit
                        playSound(url);
                        listeners.fire({status:'ready'});
                        return;
                    } else {
                        console.log('Erreur de voix synthétisée: '+answer.res);
                    }
                } catch (e) {
                    console.log("Erreur lors de la génération de la voix synthétisée: ",e);
                    console.log("Réponse: ",data);
                }
                listeners.fire({status:'failed'});
            });
        }
    };

    return {
        // seule fonction publique, lit le mot passé en paramètre
        play: function(word) {
            playWord(word);
        },
        onStatusChange: function(callback) {
            listeners.add(callback);
        }
    }
};
