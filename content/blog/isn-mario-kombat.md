---
title: "Mon projet d'ISN : Mario Kombat"
tags: ["software"]
date: "2015-09-27T21:23:31Z"
lang: "fr"
license: "CC-BY-4.0"
aliases: ["/blog/56085e53/mon-projet-d-isn-mario-kombat", "/blog/56085e53/mon-projet-d’isn-:-mario-kombat"]
---

Lors de ma dernière année de lycée, dans le cadre de l'option ISN, j'ai réalisé en groupe un projet sur lequel nous avons été notés au Bac (j'ai eu 20/20). À la fin de l'année nous devons rendre un dossier papier, que voici. Je le poste ici car il y a des choses intéressantes dans ce projet (les trucs sur la reliabilité), et de plus il peut sans doute aider les futurs lycéens à s'en inspirer pour structurer leur dossier.

Par rapport au projet d'ISN, voilà les conseils que je peux donner:

* Mets-toi en groupe avec des gens de même niveau, sinon c'est galère. Si le travail est bien partagé c'est possible de faire des groupes hétérogènes, mais c'est dur de se coordonner
* Connais bien ton code: il y a toujours des gens qui font du copier-coller mais du coup il savent pas comment leur truc fonctionne et à l'oral ça se voit
* Faites un truc à votre niveau, sinon vous y arriveriez pas, vous auriez rien à montrer et de toute façon s'il vous reste du temps vous pourrez toujours [améliorer votre projet](https://en.wikipedia.org/wiki/Iterative_and_incremental_development)
* Parle vite, les 8 minutes de présentation sont très courtes
* Si t'es pas à l'aise, révise tes leçons, tu vas avoir des questions dessus
* Fais d'une pierre deux coup: prépare le dossier correctement, et adapte-le pour l'oral. En plus, tes idées seront bien mieux organisées

Bref, voilà, tel quel, ce que j'ai rendu:

## Équipe
Yvan Le Duff
Ahmed [édité]
Julien Mourer

## But du projet
Au moment de commencer un projet, nous ne pensions pas nous mettre ensemble car nous n'avions pas la même expérience de la programmation. Nous avons finalement eu l'idée de créer un jeu en ligne. Cette idée nous a plu car elle avait l'avantage d'être intéressante pour tout le monde: Yvan et Ahmed étaient motivé pour faire le jeu en lui-même, quand à moi j'étais excité à l'idée de faire un serveur; d'autant plus que à peu près un an avant le début du projet j'avais déjà fait une tentative de serveur de jeu (bien plus simple: elle utilisait des WebSockets donc TCP) qui avait été un échec. Ce serveur fonctionnait, mais avait beaucoup d'erreurs de conceptions; j'étais donc décidé à recommencer cette tâche de la bonne façon. C'est ainsi que nous avons commencé "Mario Kombat", un clone multijoueur de Street Fighter.

## Cahier des charges
Réaliser un clone multijoueur de Street Fighter.
Les buts fixés pour le client sont les suivants:

* 2 joueurs
* Contrôles: gauche, droite, sauter, frapper et parer
* Prédiction

Les buts fixés pour le serveur sont les suivants:

* serveur asynchrone
* reliabilité
* serveur autoritaire

## Répartition du travail
Ahmed et Yvan se sont principalement intéressé au moteur du jeu et au game design. Pour ma part je me suis plutôt occupé de la partie réseau, c'est à dire le serveur et le protocole. Évidement il s'agit d'un projet unique dont les différentes parties se recoupent donc nous avons tous été amenés à collaborer.

## Technologies utilisées
### Coté client
Nous avons utilisé Pygame, une excellente bibliothèque de développement de jeux en Python. Elle est la librairie de référence dans son domaine.

### Coté serveur
Nous avons utilisé:

* Asyncio: pour créer un serveur asynchrone.
* Protocol Buffers: pour formater les différents messages qui transitent du client au serveur.
* bitstring: pour le système de ack, il y a besoin de convertir des `int` en suite de bits et vice-versa.


## Mise en œuvre
### Quel type de serveur ?
La première chose à laquelle je me suis attaqué à été de créer un serveur. Étant donné que le game engine est écrit en Python, il m'a parut évident de créer ce serveur en Python lui-aussi, car comme vous allez le voir par la suite le game engine est partagé entre le serveur et le client.
Je me suis documenté sur les technique utilisées pour communiquer en réseau avec Python, tout d'abord avec un approche basique avec une boucle principale qui attends que des sockets gérés par le système d'exploitation reçoivent des messages. Ensuite j'ai découvert qu'il était possible d'utiliser un serveur asynchrone grâce à la bibliothèque asyncio, ce qui m'a bien plût car j'ai de l'expérience avec un autre serveur asynchrone, Node.js. Les avantages que j'y ai vu sont les suivants:

* scale beaucoup mieux
* gère les ressources efficacement
* à mon avis, amène à coder de façon plus élégante

Cependant, les tests que j'avais fait sur un serveur simple n'ont pas été perdus; je les ai réintégré dans le code du client. En effet, celui-ci n'a pas les même besoins que le serveur, asyncio serait ici superflu. Une implémentation simple est ici bien plus légère et élégante.

### Sérialisation
Une fois le serveur fonctionnel, j'ai pu m'atteler à la suite: la sérialisation. Jusqu'alors j'avais un serveur capable de recevoir les messages des clients et de les informer du game state à une fréquence définie (en l’occurrence 33ms). Il a donc fallu être en mesure d'utiliser ces messages. De nombreux types de messages peuvent être échangés entre le client et le serveur, par exemple les messages renseignant sur la position des joueurs, les messages du chat, etc.
J'ai donc utilisé *Protocol Buffers* qui gère le formatage des donnés. Avant d'être envoyées, les données vont être formatées selon un certain schéma qui va permettre d'envoyer des message divers en un minimum de bits. Il faut être efficace en programmation réseau ! Ensuite, ces données sont déserialisées selon ce même schéma.
Voici un exemple de "schéma":

```protobuf
message Datagram {
	enum Type {
		INPUT = 1;
		CHAT = 2;
		NICKNAME = 3;
	}
	required Type type = 1;

	required Ack ack = 2;

	optional uint32 reliable = 3;// if we want to get back an ack

	extensions 4 to max;
}
message Ack {
	required uint32 ack = 2;
	required bytes ackfield = 3;
}

message Input {
	extend Datagram {
		optional Input input = 5;
	}

	required uint32 key = 1;
}

message Chat {
	extend Datagram {
		optional Chat chat = 6;
	}

	required string msg = 1;
}

message Handshake {
	extend Datagram {
		optional Handshake handshake = 7;
	}

	required string nickname = 1;
}
```

Une fois formatées, les donnés prennent la forme d'une suite de bytes comme ceci: `b"\x08\x02\x12\x04\x08\x1e\x10d*?\n\x15\n\x0bJean-Pierre\x12\x06Salut.\n&\n\x06P\xc3\xa9p\xc3\xa9\x12\x1cMregn\xc3\xa9 d'mon temps...mrbmmr"`, que l'on va pouvoir incorporer dans un datagramme UDP.

J'ai beaucoup réfléchi avant de choisir *Protocol Buffers*. Voici mes critères de sélection:

 Avantages | Protocol Buffers | Avro | JSON | Pickle
 --------- | ---------------- | ---- | ---- | ------
Standard | Non | Non | Oui | Oui
Sécurité | Oui | Oui | Oui | Non
Expérience préalable | Non | Non | Oui | Non
Efficace | Oui | Moins que protobuf | Moins que Avro | Non testé
Peu error-prone | Oui | Oui | Non | Non
Bien supporté | Oui | Non | Oui | Non

J'ai éliminé Pickle directement car les message reçus sont exécutés directement par Python, ce qui pose un énorme problème de sécurité pour un jeu en ligne. JSON n'était pas un bon choix au niveau de l'efficacité. J'ai beaucoup hésité entre Avro Et Protocol Buffers, mais ce dernier à une masse d'utilisateur très conséquente, donc un bon support, ce qui m'a convaincu.

### Reliabilité
Le serveur utilise UDP, qui est un protocole très rapide et bien adapté aux jeux en réseau. Mais ce protocole de transport a une caractéristique qui peut causer problème dans certaines situations: certains datagramme peuvent ne jamais arriver. Nous avions étudiés en cours les différences, avantage et inconvénient de ces protocoles. TCP lui assure que les messages (segments) sont bien reçus, mais est bien plus lent et consomme plus de bande passante. Il aurait été possible d'utiliser les deux: TCP pour les messages reliables et UDP pour le reste. Mais cette approche cause quelques soucis en pratique, détaillés [ici](https://www.isoc.org/INET97/proceedings/F3/F3_1.HTM). Il est donc plus malin d'implémenter la reliabilité (utilisée bien sûr uniquement pour certains messages) au-dessus de UDP.

Pour s'assurer qu'un message avec un certain ID a été reçu, le receveur renvoie habituellement un ack (abréviation de acknowledgment), un message qui contient le même ID. L'envoyeur, à la réception du ack est assuré que le receveur à reçu son message.
Mais que se passe-t'il si le ack est perdu ?
Le système que j'ai utilisé est redondant: il envoie le ack plusieurs fois pour s'assurer qu'au moins un ack sera reçu. Pour cela, chaque message, quel qu'il soit contient une liste des 33 précédents acks.
Pourquoi 33 ?
Admettons que les acks envoyé sont des uint32. Il prennent donc 32 bits de place. Si l'on veut en envoyer 33 par paquet, cela va donc prendre 1056 bits, ce qui est loin d'être optimal.
Pour stocker de multiples acks en peu de place, on ne va pas tous les entrer un à un mais plutôt entrer le dernier ack reçu suivi d'un bitfield (une suite de 0 et de 1). Chaque chiffre de cette suite représente si les acks précédents ont été reçu ou non dans l'ordre du plus récent au moins récent. Tout message contient donc -en plus du reste- un uint32, par exemple `5584` et un bitfield (géré par la librairie Bitstring), par exemple `00000000000000000000000001000001` qui sera traduit en décimal par `65`. On peut donc assurer la reliabilité en ajoutant seulement 64 bits supplémentaires à chaque paquet.

### Serveur autoritaire
Un gros challenge avec Mario Kombat est qu'il s'agit d'un jeu d'action rapide. Lorsqu'il est joué en ligne, il va falloir éliminer les lags qui pourraient affecter le gameplay. Une solution naïve serait de calculer toutes le données chez le client puis de les envoyer au serveur qui les distribuerait aux clients. Cependant, il serait alors très facile à un tricheur d'envoyer les données qu'il veut, pour par exemple se téléporter. J'ai donc choisi de développer un architecture avec un serveur autoritaire, c'est à dire que les clients envoient uniquement les touches sur lesquelles ils ont appuyés, et le serveur se charge à partir de ces données de gérer la physique du jeu. Il va ensuite renvoyer le game state à tout les joueurs (par exemple: les positions de tout le monde, s'il sont en train de frapper ou de parer, etc.).
Le problème de cette architecture, c'est qu'elle génère du délai car il faut attendre après chaque input d'être notifié des nouvelles positions physique des objets.
Prenons l'exemple d'un client qui à 50ms de ping, ce qui est des assez bonnes conditions sur un réseau à grande échelle tel qu'Internet. Si le joueur veut frapper, il faudra attendre 100ms, le temps que le message parte vers le serveur et que le serveur envoie un game state mis à jour. Dans un jeu de combat de ce type, 100ms de délai sont très visibles et risque de rendre le jeu difficile à jouer. D'autant plus que pour cette simulation nous n'avons pas pris en comte les délais généré par le serveur: celui-ci ne rafraîchit le game state que toutes les 33ms.

### Prédiction
Pour résoudre le problème sus-mentionné, nous avons implémenté de la prédiction coté client. Le principe est simple: le client suppose l'état du jeu avant d'en recevoir la confirmation du serveur. Dans l'exemple précédent, quand le jouer appuie sur la touche "frapper", le client va afficher le personnage en train de frapper. Si tout ce passe bien, 100ms plus tard, il va recevoir du serveur la confirmation qu'il était bien en train de frapper. Mais le serveur à toujours le dernier mot: si le client à fait une erreur dans sa prédiction, il va devoir se mettre à jour avec le serveur. Bien que cela risque de se voir, cette situation arrive en pratique très peu souvent et ne posera donc pas problème.

## Difficultés
J'ai eu beaucoup de mal à comprendre au premier abord la documentation de asyncio, cette librairie est très jeune (incluse dans la librairie standard lors de la sortie de la dernière version: 3.4) et il y a encore peu de documentation autre que la documentation officielle.

Comme dit précédemment, Protocol Buffers est très bien supporté, seulement, il supporte uniquement quelques langages officiellement. Python l'est, mais dans sa version 2 qui est incompatible avec la version 3 que nous avons choisie pour ce projet.
J'ai donc été amené à utiliser une librairie tierce, dans laquelle j'ai trouvé deux bugs, ce qui m'a causé quelques soucis. J'ai utilisé des workarounds pour arriver à ce que je voulais en dépit de ces bugs. J'ai aussi contacté l'auteur de cette implémentation de Protocol Buffers pour lui signaler et éventuellement lui proposer des solutions afin de fixer ceux-ci. Je n'ai pour l'instant pas eu de réponses.

## Annexe
Le code du jeu est disponible [**ici**](https://github.com/Getkey/mario-kombat). Avant d'y jouer il va vous falloir installer Pygame. Je déploierai un serveur à l'adresse suivante: **getkey.eu:9876**.

## Développements futurs ?
Les concepts suivants pourront être ajoutés pour réduire encore plus la latence:

* Flow control: adapter le nombre de datagrammes envoyé par seconde à la connexion du joueur
* Réconciliation au serveur: pour minimiser les micro-téléportations du personnage du joueur qui peuvent apparaître lorsqu'il y a du lag
* Interpolation d'entités: pour supprimer les micro-téléportations des autres joueurs lorsqu'il y a du lag
* Compensation de lag: pour empêcher les deux techniques précédentes de créer des problèmes

## Lecture
Si ces quatre dernières techniques éveillent votre curiosité, vous pouvez lire les [écrits de Gabriel Gambetta](http://gabrielgambetta.com/fast_paced_multiplayer.html) ainsi que les [articles de Glenn Fiedler](http://gafferongames.com/networking-for-game-programmers/).
Vous y retrouverez d'autre techniques que j'ai utilisé pour ce projet, et dont j'ai parlé. En effet, le travail réalisé pour ce projet est en bonne partie basé sur des concepts développés par ces auteurs, et je les en remercie.
